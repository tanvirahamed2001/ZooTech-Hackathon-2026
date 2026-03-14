import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';
import type { EmailCapture, VarkScores } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please connect to Supabase.');
}

export const supabase = createClient<Database>(
  supabaseUrl ?? '',
  supabaseAnonKey ?? ''
);

// Get user's IP address and user agent
const getUserInfo = async () => {
  try {
    // Get IP address from a reliable service
    const ipResponse = await fetch('https://api.ipify.org?format=json');
    const ipData = await ipResponse.json();
    
    return {
      ipAddress: ipData.ip,
      userAgent: navigator.userAgent
    };
  } catch (error) {
    console.warn('Could not fetch IP address:', error);
    return {
      ipAddress: null,
      userAgent: navigator.userAgent
    };
  }
};

// Save email capture IMMEDIATELY when user submits form
export const saveEmailCapture = async (emailCapture: EmailCapture, recaptchaToken?: string, hpField?: string) => {
  try {
    console.log('Saving email capture to database:', emailCapture);
    console.log('Honeypot field value:', hpField);

    // Get user info for tracking
    const userInfo = await getUserInfo();
    console.log('User tracking info:', userInfo);

    const { data, error } = await supabase
      .from('quiz_responses')
      .insert([{
        email: emailCapture.email,
        first_name: emailCapture.firstName || null,
        reason: emailCapture.reason,
        custom_reason: emailCapture.customReason || null,
        scores: { V: 0, A: 0, R: 0, K: 0 }, // Placeholder scores
        answers: {}, // Empty answers for now
        results_url: '', // Will be updated later
        email_sent: false,
        ip_address: userInfo.ipAddress,
        user_agent: userInfo.userAgent
      }])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw new Error(`Database error: ${error.message}`);
    }
    
    console.log('Email capture saved with ID:', data.id);
    console.log('IP address captured:', userInfo.ipAddress);
    return data;
  } catch (error) {
    console.error('Failed to save email capture:', error);
    throw error;
  }
};

// Update quiz response with final scores and answers using the specific record ID
export const updateQuizResponse = async (
  recordId: string,
  scores: VarkScores,
  answers: Record<number, string[]>,
  resultsUrl: string
) => {
  try {
    console.log('Updating quiz response with final data for record ID:', recordId);

    const { data, error } = await supabase
      .from('quiz_responses')
      .update({
        scores,
        answers,
        results_url: resultsUrl
      })
      .eq('id', recordId)
      .select()
      .single();

    if (error) {
      console.error('Database update error:', error);
      throw new Error(`Database update error: ${error.message}`);
    }
    
    console.log('Quiz response updated:', data);
    return data;
  } catch (error) {
    console.error('Failed to update quiz response:', error);
    throw error;
  }
};

// Save quiz response to database (fallback for users who didn't provide email)
export const saveQuizResponse = async (
  emailCapture: EmailCapture | null,
  scores: VarkScores,
  answers: Record<number, string[]>,
  resultsUrl: string
) => {
  try {
    console.log('Saving quiz response for user without email capture:', {
      hasEmailCapture: !!emailCapture,
      scores,
      answersCount: Object.keys(answers).length,
      resultsUrl
    });

    // Get user info for tracking even for anonymous users
    const userInfo = await getUserInfo();
    console.log('Anonymous user tracking info:', userInfo);

    const { data, error } = await supabase
      .from('quiz_responses')
      .insert([{
        email: emailCapture?.email || null,
        first_name: emailCapture?.firstName || null,
        reason: emailCapture?.reason || null,
        custom_reason: emailCapture?.customReason || null,
        scores,
        answers,
        results_url: resultsUrl,
        email_sent: false,
        ip_address: userInfo.ipAddress,
        user_agent: userInfo.userAgent
      }])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw new Error(`Database error: ${error.message}`);
    }
    
    console.log('Quiz response saved to database with IP:', userInfo.ipAddress);
    return data;
  } catch (error) {
    console.error('Failed to save quiz response:', error);
    throw error;
  }
};

// Email sending function with security validation
export const sendVarkReport = async (
  emailCapture: EmailCapture, 
  scores: VarkScores, 
  dominantStyles: string[], 
  resultsUrl: string
) => {
  try {
    console.log('Attempting to send email to:', emailCapture.email);
    
    // Get reCAPTCHA token
    let recaptchaToken = '';
    const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
    if (siteKey && window.grecaptcha) {
      try {
        recaptchaToken = await window.grecaptcha.execute(siteKey, { action: 'send_email' });
      } catch (error) {
        console.warn('reCAPTCHA execution failed:', error);
      }
    }
    
    const response = await fetch(`${supabaseUrl}/functions/v1/send-vark-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        emailCapture,
        scores,
        dominantStyles,
        resultsUrl,
        recaptchaToken,
        hp_field: emailCapture.hpField || '' // Send the actual honeypot field value
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Email API error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    console.log('Email sent successfully:', result);
    return result;
  } catch (error) {
    console.error('Error sending VARK report:', error);
    throw error;
  }
};

export type MyResultRow = {
  id: string;
  created_at: string;
  results_url: string;
  scores: { V: number; A: number; R: number; K: number };
};

export const getMyResults = async (email: string): Promise<MyResultRow[]> => {
  const response = await fetch(`${supabaseUrl}/functions/v1/get-my-results`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || 'Failed to load results');
  }
  const data = await response.json();
  return (data.results ?? []) as MyResultRow[];
};