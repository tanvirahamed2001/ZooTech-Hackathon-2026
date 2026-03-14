import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.8";
import { z } from "npm:zod@3.22.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Validation schema
const RequestSchema = z.object({
  emailCapture: z.object({
    firstName: z.string().optional(),
    email: z.string().email(),
    reason: z.string(),
    customReason: z.string().optional(),
    recordId: z.string().optional(),
    hpField: z.string().optional()
  }),
  scores: z.object({
    V: z.number(),
    A: z.number(),
    R: z.number(),
    K: z.number()
  }),
  dominantStyles: z.array(z.string()),
  resultsUrl: z.string().url(),
  recaptchaToken: z.string().optional(),
  hp_field: z.string().optional()
});

// Verify reCAPTCHA token
async function verifyRecaptcha(token: string): Promise<boolean> {
  const secret = Deno.env.get("RECAPTCHA_SECRET");
  if (!secret || !token) return false;

  try {
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${secret}&response=${token}`
    });

    const result = await response.json();
    return result.success && result.score >= 0.5;
  } catch (error) {
    console.error("reCAPTCHA verification failed:", error);
    return false;
  }
}

serve(async (req: Request) => {
  try {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Only allow POST
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }), 
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate Content-Type
    const contentType = req.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return new Response(
        JSON.stringify({ error: "Content-Type must be application/json" }), 
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body first
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (error) {
      console.error("Failed to parse JSON:", error);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }), 
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // HONEYPOT VALIDATION - Check ALL possible locations immediately after parsing
    const honeypotSources = [
      requestBody.hp_field,
      requestBody.hpField,
      requestBody.emailCapture?.hp_field,
      requestBody.emailCapture?.hpField
    ];

    // Check if any honeypot field has a value
    for (const honeypotValue of honeypotSources) {
      if (honeypotValue && typeof honeypotValue === 'string' && honeypotValue.trim() !== "") {
        console.warn("🚨 HONEYPOT TRIGGERED - Bot detected:", {
          honeypotValue: honeypotValue,
          userAgent: req.headers.get("user-agent"),
          ip: req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip"),
          timestamp: new Date().toISOString()
        });
        
        return new Response(
          JSON.stringify({ error: "Security validation failed" }), 
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Now validate the schema (after honeypot check)
    let requestData;
    try {
      requestData = RequestSchema.parse(requestBody);
    } catch (error) {
      console.error("Schema validation failed:", error);
      return new Response(
        JSON.stringify({ error: "Invalid request data", details: error.message }), 
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify reCAPTCHA if token provided
    if (requestData.recaptchaToken) {
      const isValidCaptcha = await verifyRecaptcha(requestData.recaptchaToken);
      if (!isValidCaptcha) {
        console.warn("reCAPTCHA verification failed for:", requestData.emailCapture.email);
        return new Response(
          JSON.stringify({ error: "reCAPTCHA verification failed" }), 
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Get credentials from environment variables
    const GMAIL_ADDRESS = Deno.env.get("GMAIL_ADDRESS");
    const GMAIL_APP_PASSWORD = Deno.env.get("GMAIL_APP_PASSWORD");

    if (!GMAIL_ADDRESS || !GMAIL_APP_PASSWORD) {
      return new Response(
        JSON.stringify({ error: "SMTP credentials not configured" }), 
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { emailCapture, scores, dominantStyles, resultsUrl } = requestData;
    const { firstName, email, reason, customReason } = emailCapture;

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get the record ID for unsubscribe link - USE DEPLOYED APP URL!
    const recordId = emailCapture.recordId;
    const unsubscribeUrl = recordId 
      ? `https://vark-questionnaire.netlify.app/u/${recordId}`
      : null;

    // Generate personalized email content
    const personalizedContent = generateEmailContent(firstName, scores, dominantStyles, reason, customReason, resultsUrl, unsubscribeUrl);

    // Create email record
    const { data: emailRecord, error: insertError } = await supabaseClient
      .from("emails")
      .insert([{
        recipient: email,
        subject: personalizedContent.subject,
        body: personalizedContent.html,
        cc: null,
        bcc: null,
        status: "sending",
        metadata: {
          type: "vark_report",
          scores,
          dominantStyles,
          reason,
          customReason,
          quiz_response_id: recordId
        }
      }])
      .select()
      .single();

    if (insertError || !emailRecord) {
      console.error("Failed to create email record:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create email record" }), 
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Configure SMTP transport - FIXED: Changed createTransporter to createTransport
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: GMAIL_ADDRESS,
        pass: GMAIL_APP_PASSWORD
      }
    });

    try {
      // Send email
      const info = await transporter.sendMail({
        from: `AI Brain Coach <${GMAIL_ADDRESS}>`,
        to: email,
        subject: personalizedContent.subject,
        text: personalizedContent.text,
        html: personalizedContent.html
      });

      // Update record with success
      await supabaseClient
        .from("emails")
        .update({
          status: "sent",
          smtp_response: JSON.stringify(info)
        })
        .eq("id", emailRecord.id);

      console.log("✅ Email sent successfully to:", email);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "VARK report sent successfully",
          emailId: emailRecord.id 
        }), 
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("SMTP error:", error);
      // Update record with failure
      await supabaseClient
        .from("emails")
        .update({
          status: "failed",
          smtp_response: error.message
        })
        .eq("id", emailRecord.id);

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error.message 
        }), 
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Unexpected error in edge function:", error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateEmailContent(firstName: string | undefined, scores: any, dominantStyles: string[], reason: string, customReason: string | undefined, resultsUrl: string, unsubscribeUrl: string | null) {
  const name = firstName ? firstName : "there";
  const greeting = `Hi ${name}!`;
  
  // Determine primary learning style
  const primaryStyle = dominantStyles[0];
  const styleNames = {
    'V': 'Visual',
    'A': 'Auditory', 
    'R': 'Read/Write',
    'K': 'Kinesthetic'
  };
  
  const isMultimodal = dominantStyles.length > 1;
  const styleDescription = isMultimodal 
    ? `multimodal learner with strengths in ${dominantStyles.map(s => styleNames[s]).join(' and ')}`
    : `${styleNames[primaryStyle]} learner`;

  // Personalized tips based on dominant style(s)
  const getTips = (styles: string[]) => {
    const allTips = {
      'V': [
        "Use color-coding and highlighters in your notes",
        "Convert text information into diagrams, charts, and mind maps", 
        "Watch video demonstrations before attempting new tasks",
        "Create visual flashcards with images and diagrams"
      ],
      'A': [
        "Record lectures or read your notes aloud to review later",
        "Discuss concepts with others to solidify understanding",
        "Use mnemonic devices and rhymes to remember information",
        "Consider audiobooks or podcast learning materials"
      ],
      'R': [
        "Take detailed notes and rewrite them to enhance memory",
        "Convert diagrams and charts into written descriptions", 
        "Create lists, headings, and organized notes",
        "Look for text-based resources rather than visual or interactive ones"
      ],
      'K': [
        "Use physical objects or models when possible",
        "Take breaks to move around while studying",
        "Apply concepts to real-world scenarios or case studies",
        "Create physical flashcards you can manipulate and arrange"
      ]
    };
    
    const tips = [];
    styles.forEach(style => {
      tips.push(...allTips[style]);
    });
    return tips.slice(0, 6); // Limit to 6 tips
  };

  const personalizedTips = getTips(dominantStyles);

  // Context-aware message based on their reason
  const getContextMessage = (reason: string, customReason?: string) => {
    switch (reason) {
      case 'Self-awareness / Personal development':
        return "Since you're focused on personal development, understanding your learning style is a powerful tool for accelerating your growth in any area of life.";
      case "I'm onboarding as an AI Brain Coach client":
        return "Welcome to the AI Brain Coach community! This learning style insight will help us tailor your coaching experience perfectly.";
      case "I'm exploring coaching tools":
        return "As someone exploring coaching tools, you'll find that understanding learning styles is crucial for effective coaching relationships.";
      case "I'm curious how I learn":
        return "Your curiosity about learning is exactly the right mindset! This knowledge will help you optimize how you absorb new information.";
      case "Someone made me do this 😅":
        return "Even though someone nudged you to take this, the insights are genuinely yours! Sometimes the best discoveries come from unexpected places.";
      case "Other (I'll explain...)":
        return customReason ? `Based on what you shared: "${customReason}" - these insights should be particularly relevant to your situation.` : "Thanks for taking the time to discover your learning style!";
      default:
        return "Thanks for taking the time to discover your learning style!";
    }
  };

  const contextMessage = getContextMessage(reason, customReason);

  const subject = `${name === "there" ? "Your" : `${firstName}'s`} VARK Learning Style Report: You're a ${styleDescription}!`;

  // Use the deployed logo URL
  const logoUrl = "https://vark-questionnaire.netlify.app/AI%20braintrust%20logo%20transparent.png";

  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your VARK Learning Style Report</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #262626; 
            margin: 0; 
            padding: 20px;
            background: linear-gradient(135deg, #fafafa 0%, #f0f9ff 100%);
            font-feature-settings: "ss01", "ss02", "cv01", "cv02";
        }
        
        .email-container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0,0,0,0.08);
        }
        
        .header { 
            background: linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%); 
            padding: 40px 30px; 
            text-align: center; 
            border-bottom: 1px solid #e2e8f0;
        }
        
        .logo-section {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
        }
        
        .logo {
            width: 48px;
            height: 48px;
            margin-right: 12px;
        }
        
        .brand-name {
            font-size: 28px;
            font-weight: 700;
            margin: 0;
            letter-spacing: -0.5px;
            color: #262626;
        }
        
        .tagline {
            font-size: 16px;
            color: #64748b;
            margin: 4px 0 0 0;
            font-weight: 500;
        }
        
        .report-title {
            font-size: 20px;
            font-weight: 600;
            color: #262626;
            margin: 20px 0 0 0;
        }
        
        .content { 
            padding: 40px 30px; 
        }
        
        .greeting {
            font-size: 18px;
            color: #262626;
            margin-bottom: 20px;
            font-weight: 500;
        }
        
        .context-message {
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            border-left: 4px solid #0ea5e9;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 12px 12px 0;
            color: #0c4a6e;
            font-weight: 500;
        }
        
        .results-section {
            text-align: center;
            margin: 30px 0;
        }
        
        .results-title {
            font-size: 24px;
            font-weight: 700;
            color: #262626;
            margin-bottom: 20px;
            letter-spacing: -0.5px;
        }
        
        .scores { 
            display: flex; 
            justify-content: space-between; 
            margin: 30px 0; 
            background: linear-gradient(135deg, #fafafa 0%, #f8fafc 100%);
            padding: 25px 20px;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
        }
        
        .score-item { 
            text-align: center; 
            flex: 1;
        }
        
        .score-number { 
            font-size: 32px; 
            font-weight: 800; 
            color: #0ea5e9;
            display: block;
            margin-bottom: 4px;
        }
        
        .score-label {
            font-size: 14px;
            color: #64748b;
            font-weight: 600;
        }
        
        .tips { 
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); 
            border: 1px solid #bae6fd;
            border-radius: 12px;
            padding: 25px; 
            margin: 30px 0; 
        }
        
        .tips-title {
            font-size: 20px;
            font-weight: 700;
            color: #0c4a6e;
            margin-bottom: 15px;
            letter-spacing: -0.3px;
        }
        
        .tips-intro {
            color: #0369a1;
            margin-bottom: 20px;
            font-weight: 500;
        }
        
        .tip-item { 
            margin: 12px 0; 
            padding-left: 25px; 
            position: relative;
            color: #0c4a6e;
            font-weight: 500;
        }
        
        .tip-item:before { 
            content: "✓"; 
            position: absolute; 
            left: 0; 
            color: #10b981; 
            font-weight: bold; 
            font-size: 16px;
        }
        
        .cta { 
            background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); 
            color: white; 
            padding: 16px 32px; 
            text-decoration: none; 
            border-radius: 12px; 
            display: inline-block; 
            margin: 25px 0;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
            transition: all 0.2s ease;
        }
        
        .quote { 
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); 
            border-left: 4px solid #f59e0b; 
            padding: 20px; 
            margin: 25px 0; 
            border-radius: 0 12px 12px 0;
        }
        
        .quote-text {
            color: #92400e;
            font-size: 16px;
            margin-bottom: 8px;
            font-style: italic;
            font-weight: 500;
        }
        
        .quote-author {
            color: #d97706;
            font-weight: 600;
            font-size: 14px;
        }
        
        .footer { 
            background: linear-gradient(135deg, #fafafa 0%, #f8fafc 100%); 
            padding: 30px; 
            text-align: center; 
            font-size: 14px; 
            color: #64748b;
            border-top: 1px solid #e2e8f0;
        }
        
        .signature {
            margin: 25px 0;
            color: #262626;
        }
        
        .signature-name {
            font-weight: 700;
            color: #0ea5e9;
        }
        
        .divider {
            height: 1px;
            background: linear-gradient(90deg, transparent 0%, #e2e8f0 50%, transparent 100%);
            margin: 30px 0;
        }
        
        .highlight-box {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .unsubscribe-link {
            color: #0ea5e9;
            text-decoration: none;
            font-weight: 500;
        }
        
        .unsubscribe-link:hover {
            text-decoration: underline;
        }
        
        @media (max-width: 600px) {
            body { padding: 10px; }
            .email-container { margin: 0; border-radius: 12px; }
            .header, .content { padding: 25px 20px; }
            .scores { 
                flex-direction: column; 
                gap: 15px; 
                padding: 20px;
            }
            .brand-name { font-size: 24px; }
            .results-title { font-size: 20px; }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo-section">
                <img src="${logoUrl}" alt="AI Brain Coach Logo" class="logo" />
                <div>
                    <h1 class="brand-name">AI Brain Coach</h1>
                    <p class="tagline">VARK Learning Style Quiz</p>
                </div>
            </div>
            <h2 class="report-title">Your Personalized Learning Style Report</h2>
        </div>
        
        <div class="content">
            <p class="greeting">${greeting}</p>
            
            <div class="context-message">
                ${contextMessage}
            </div>
            
            <div class="results-section">
                <h2 class="results-title">🎯 Your Results: You're a ${styleDescription}!</h2>
                
                <div class="scores">
                    <div class="score-item">
                        <span class="score-number">${scores.V}</span>
                        <div class="score-label">Visual</div>
                    </div>
                    <div class="score-item">
                        <span class="score-number">${scores.A}</span>
                        <div class="score-label">Auditory</div>
                    </div>
                    <div class="score-item">
                        <span class="score-number">${scores.R}</span>
                        <div class="score-label">Read/Write</div>
                    </div>
                    <div class="score-item">
                        <span class="score-number">${scores.K}</span>
                        <div class="score-label">Kinesthetic</div>
                    </div>
                </div>
            </div>
            
            <div class="tips">
                <h3 class="tips-title">🚀 Your Personalized Learning Strategies</h3>
                <p class="tips-intro">Based on your ${styleDescription} profile, here are specific techniques that will supercharge your learning:</p>
                ${personalizedTips.map(tip => `<div class="tip-item">${tip}</div>`).join('')}
            </div>
            
            <div class="quote">
                <p class="quote-text"><strong>RayRayRay says:</strong> "Now you know why some learning methods felt like trying to eat soup with a fork! Your brain has preferences, and working WITH them instead of against them is like upgrading from dial-up to fiber internet."</p>
                <p class="quote-author">— RayRayRay, AI Brain Coach</p>
            </div>
            
            <div class="divider"></div>
            
            <div class="highlight-box">
                <p style="margin-bottom: 15px;"><strong>Want to dive deeper?</strong> Your full interactive results are always available here:</p>
                <a href="${resultsUrl}" class="cta">View Your Full Interactive Results</a>
            </div>
            
            <p style="margin: 25px 0;">Questions? Just reply to this email - I read every single one!</p>
            
            <div class="signature">
                <p>Keep learning (the way YOUR brain wants to),<br>
                <span class="signature-name">The AI Brain Coach Team</span></p>
            </div>
        </div>
        
        <div class="footer">
            <p>This report was generated based on your VARK Learning Style Assessment.</p>
            <p style="margin-top: 10px;">
                Don't want these emails? 
                ${unsubscribeUrl ? `<a href="${unsubscribeUrl}" class="unsubscribe-link">Unsubscribe here</a>` : 'Reply with "unsubscribe"'}
            </p>
        </div>
    </div>
</body>
</html>`;

  const text = `
AI BRAIN COACH - VARK LEARNING STYLE QUIZ
Your Personalized Learning Style Report

${greeting}

${contextMessage}

YOUR RESULTS: You're a ${styleDescription}!

Your VARK Scores:
- Visual: ${scores.V}
- Auditory: ${scores.A} 
- Read/Write: ${scores.R}
- Kinesthetic: ${scores.K}

PERSONALIZED LEARNING STRATEGIES:
${personalizedTips.map((tip, i) => `${i + 1}. ${tip}`).join('\n')}

RayRayRay says: "Now you know why some learning methods felt like trying to eat soup with a fork! Your brain has preferences, and working WITH them instead of against them is like upgrading from dial-up to fiber internet."

View your full interactive results: ${resultsUrl}

Questions? Just reply to this email - I read every single one!

Keep learning (the way YOUR brain wants to),
The AI Brain Coach Team

---
This report was generated based on your VARK Learning Style Assessment.
${unsubscribeUrl ? `Don't want these emails? Unsubscribe here: ${unsubscribeUrl}` : 'Don\'t want these emails? Reply with "unsubscribe"'}
`;

  return { subject, html, text };
}