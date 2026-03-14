import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface VisitorData {
  date: string;
  visitors: number;
}

interface TopItem {
  value: string;
  count: number;
}

interface RawVisit {
  id: string;
  timestamp: string;
  ip_address: string;
  page_path: string;
  user_agent: string;
  country: string;
  city: string;
  region: string;
  org: string;
  device_type: string;
  platform: string;
  referrer_domain: string;
  time_on_page_ms: number;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin token
    const url = new URL(req.url);
    const adminToken = url.searchParams.get('admin_token');
    
    if (adminToken !== 'SECRET123') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create service client using environment variables
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Log admin access
    const userAgent = req.headers.get('user-agent') || '';
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0] || realIp || null;

    await supabase
      .from('admin_analytics_views')
      .insert([{
        ip_address: ipAddress,
        user_agent: userAgent,
        access_time: new Date().toISOString()
      }]);

    // Get visitors per day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: dailyVisitors, error: dailyError } = await supabase
      .from('visitor_analytics')
      .select('timestamp')
      .gte('timestamp', thirtyDaysAgo.toISOString())
      .order('timestamp', { ascending: true });

    if (dailyError) throw dailyError;

    // Process daily visitors data
    const visitorsByDay = dailyVisitors?.reduce((acc: Record<string, number>, visit) => {
      const date = new Date(visit.timestamp).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {}) || {};

    const visitorsPerDay: VisitorData[] = Object.entries(visitorsByDay).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      visitors: count as number
    }));

    // Get top IPs
    const { data: ipData, error: ipError } = await supabase
      .from('visitor_analytics')
      .select('ip_address')
      .not('ip_address', 'is', null);

    if (ipError) throw ipError;

    const ipCounts = ipData?.reduce((acc: Record<string, number>, visit) => {
      if (visit.ip_address) {
        acc[visit.ip_address] = (acc[visit.ip_address] || 0) + 1;
      }
      return acc;
    }, {}) || {};

    const topIPs: TopItem[] = Object.entries(ipCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([ip, count]) => ({ value: ip, count: count as number }));

    // Get top user agents (simplified)
    const { data: uaData, error: uaError } = await supabase
      .from('visitor_analytics')
      .select('browser_name')
      .not('browser_name', 'is', null);

    if (uaError) throw uaError;

    const uaCounts = uaData?.reduce((acc: Record<string, number>, visit) => {
      if (visit.browser_name) {
        acc[visit.browser_name] = (acc[visit.browser_name] || 0) + 1;
      }
      return acc;
    }, {}) || {};

    const topUserAgents: TopItem[] = Object.entries(uaCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([ua, count]) => ({ value: ua, count: count as number }));

    // Get top paths
    const { data: pathData, error: pathError } = await supabase
      .from('visitor_analytics')
      .select('page_path');

    if (pathError) throw pathError;

    const pathCounts = pathData?.reduce((acc: Record<string, number>, visit) => {
      acc[visit.page_path] = (acc[visit.page_path] || 0) + 1;
      return acc;
    }, {}) || {};

    const topPaths: TopItem[] = Object.entries(pathCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([path, count]) => ({ value: path, count: count as number }));

    // Get top cities (enriched data)
    const { data: cityData, error: cityError } = await supabase
      .from('visitor_analytics')
      .select('city, country')
      .not('city', 'is', null);

    if (cityError) throw cityError;

    const cityCounts = cityData?.reduce((acc: Record<string, number>, visit) => {
      if (visit.city) {
        const cityCountry = visit.country ? `${visit.city}, ${visit.country}` : visit.city;
        acc[cityCountry] = (acc[cityCountry] || 0) + 1;
      }
      return acc;
    }, {}) || {};

    const topCities: TopItem[] = Object.entries(cityCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([city, count]) => ({ value: city, count: count as number }));

    // Get top ISPs/Organizations
    const { data: orgData, error: orgError } = await supabase
      .from('visitor_analytics')
      .select('org')
      .not('org', 'is', null);

    if (orgError) throw orgError;

    const orgCounts = orgData?.reduce((acc: Record<string, number>, visit) => {
      if (visit.org) {
        // Simplify org names for display
        const simplified = visit.org.length > 30 ? visit.org.substring(0, 30) + '...' : visit.org;
        acc[simplified] = (acc[simplified] || 0) + 1;
      }
      return acc;
    }, {}) || {};

    const topISPs: TopItem[] = Object.entries(orgCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([org, count]) => ({ value: org, count: count as number }));

    // Get top referrer domains
    const { data: referrerData, error: referrerError } = await supabase
      .from('visitor_analytics')
      .select('referrer_domain')
      .not('referrer_domain', 'is', null);

    if (referrerError) throw referrerError;

    const referrerCounts = referrerData?.reduce((acc: Record<string, number>, visit) => {
      if (visit.referrer_domain) {
        acc[visit.referrer_domain] = (acc[visit.referrer_domain] || 0) + 1;
      }
      return acc;
    }, {}) || {};

    const topReferrers: TopItem[] = Object.entries(referrerCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([domain, count]) => ({ value: domain, count: count as number }));

    // Get device type distribution
    const { data: deviceData, error: deviceError } = await supabase
      .from('visitor_analytics')
      .select('device_type')
      .not('device_type', 'is', null);

    if (deviceError) throw deviceError;

    const deviceCounts = deviceData?.reduce((acc: Record<string, number>, visit) => {
      if (visit.device_type) {
        acc[visit.device_type] = (acc[visit.device_type] || 0) + 1;
      }
      return acc;
    }, {}) || {};

    const deviceTypes: TopItem[] = Object.entries(deviceCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .map(([device, count]) => ({ value: device, count: count as number }));

    // Get raw visits with enriched data (last 100)
    const { data: rawData, error: rawError } = await supabase
      .from('visitor_analytics')
      .select(`
        id, 
        timestamp, 
        ip_address, 
        page_path, 
        user_agent, 
        country, 
        city, 
        region, 
        org, 
        device_type, 
        platform, 
        referrer_domain, 
        time_on_page_ms
      `)
      .order('timestamp', { ascending: false })
      .limit(100);

    if (rawError) throw rawError;

    const rawVisits: RawVisit[] = rawData || [];

    // Calculate average session duration
    const { data: durationData, error: durationError } = await supabase
      .from('visitor_analytics')
      .select('time_on_page_ms')
      .not('time_on_page_ms', 'is', null)
      .gt('time_on_page_ms', 0);

    if (durationError) throw durationError;

    const averageSessionDuration = durationData && durationData.length > 0 
      ? durationData.reduce((sum, visit) => sum + (visit.time_on_page_ms || 0), 0) / durationData.length
      : 0;

    // Get total visitor count
    const { count, error: countError } = await supabase
      .from('visitor_analytics')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    const totalVisitors = count || 0;

    // Return all enriched analytics data
    const analyticsData = {
      visitorsPerDay,
      topIPs,
      topUserAgents,
      topPaths,
      topCities,
      topISPs,
      topReferrers,
      deviceTypes,
      rawVisits,
      totalVisitors,
      averageSessionDuration: Math.round(averageSessionDuration)
    };

    return new Response(
      JSON.stringify(analyticsData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Enhanced analytics function error:', error);
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