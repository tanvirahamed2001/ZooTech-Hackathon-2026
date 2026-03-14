import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface IPInfoResponse {
  ip: string;
  city?: string;
  region?: string;
  country?: string;
  postal?: string;
  org?: string;
  asn?: string;
  bogon?: boolean;
}

// Enhanced IP enrichment with better error handling and validation
async function enrichWithIPInfo(ipAddress: string): Promise<Partial<IPInfoResponse>> {
  const IPINFO_TOKEN = 'e870b5bb8b37a1';
  
  // Skip enrichment for invalid/local IPs
  if (!ipAddress || 
      ipAddress === '127.0.0.1' || 
      ipAddress === '::1' || 
      ipAddress.startsWith('192.168.') ||
      ipAddress.startsWith('10.') ||
      ipAddress.startsWith('172.') ||
      ipAddress === 'null' ||
      ipAddress === 'undefined') {
    console.log('Skipping enrichment for local/invalid IP:', ipAddress);
    return {};
  }
  
  try {
    const response = await fetch(`https://ipinfo.io/${ipAddress}?token=${IPINFO_TOKEN}`, {
      timeout: 5000, // 5 second timeout
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'VARK-Analytics/1.0'
      }
    });
    
    if (!response.ok) {
      console.warn(`IPinfo API error: ${response.status} for IP ${ipAddress}`);
      return {};
    }
    
    const data: IPInfoResponse = await response.json();
    
    // Check if IP is marked as bogon (invalid/reserved)
    if (data.bogon) {
      console.log('IP marked as bogon (reserved/invalid):', ipAddress);
      return {};
    }
    
    // Validate and clean the response data
    const cleanedData = {
      city: data.city && data.city !== 'null' && data.city.trim() !== '' ? data.city : null,
      region: data.region && data.region !== 'null' && data.region.trim() !== '' ? data.region : null,
      country: data.country && data.country !== 'null' && data.country.trim() !== '' ? data.country : null,
      postal: data.postal && data.postal !== 'null' && data.postal.trim() !== '' ? data.postal : null,
      org: data.org && data.org !== 'null' && data.org.trim() !== '' ? data.org : null,
      asn: data.asn && data.asn !== 'null' && data.asn.trim() !== '' ? data.asn : null
    };
    
    console.log('IPinfo enrichment successful for', ipAddress, ':', cleanedData);
    return cleanedData;
    
  } catch (error) {
    console.warn('IPinfo enrichment failed for', ipAddress, ':', error);
    return {};
  }
}

// Extract real IP from various header sources
function extractRealIP(req: Request): string | null {
  // Try multiple header sources in order of preference
  const headers = [
    'cf-connecting-ip',      // Cloudflare
    'x-real-ip',            // Nginx
    'x-forwarded-for',      // Standard proxy header
    'x-client-ip',          // Some proxies
    'x-cluster-client-ip'   // Some load balancers
  ];
  
  for (const header of headers) {
    const value = req.headers.get(header);
    if (value) {
      // x-forwarded-for can contain multiple IPs, take the first one
      const ip = value.split(',')[0].trim();
      if (ip && ip !== 'null' && ip !== 'undefined') {
        console.log(`Found IP from ${header}:`, ip);
        return ip;
      }
    }
  }
  
  console.warn('No valid IP found in headers');
  return null;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create service client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Extract the real IP address from request headers
    const ipAddress = extractRealIP(req);

    if (!ipAddress) {
      return new Response(
        JSON.stringify({ error: 'No valid IP address found in request headers' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Enriching analytics for IP:', ipAddress);

    // Get enrichment data from IPinfo
    const enrichmentData = await enrichWithIPInfo(ipAddress);
    
    // Only proceed if we got useful enrichment data
    if (Object.keys(enrichmentData).length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No enrichment data available for this IP',
          ip: ipAddress 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Find recent visitor_analytics records with this IP that need enrichment
    const { data: records, error: selectError } = await supabase
      .from('visitor_analytics')
      .select('id, ip_address, timestamp')
      .eq('ip_address', ipAddress)
      .is('city', null) // Only enrich records that haven't been enriched yet
      .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours only
      .order('timestamp', { ascending: false })
      .limit(20); // Limit to recent records

    if (selectError) {
      console.error('Error selecting records:', selectError);
      return new Response(
        JSON.stringify({ error: 'Database query failed' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!records || records.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No recent unenriched records found for this IP',
          ip: ipAddress 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Update records with enrichment data
    const recordIds = records.map(r => r.id);
    
    const { error: updateError } = await supabase
      .from('visitor_analytics')
      .update(enrichmentData)
      .in('id', recordIds);

    if (updateError) {
      console.error('Error updating records:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update records' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`✅ Enriched ${records.length} records for IP ${ipAddress}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        enriched_records: records.length,
        ip: ipAddress,
        enrichment_data: enrichmentData
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Enrichment function error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});