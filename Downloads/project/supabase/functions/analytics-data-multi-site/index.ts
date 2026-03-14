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
  percentage?: number;
}

interface SiteData extends TopItem {
  domain: string;
  paths: TopItem[];
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

// Extract domain from referrer or page path more intelligently
function extractDomain(visit: any): string {
  // First try referrer_domain if it exists and is not null
  if (visit.referrer_domain && visit.referrer_domain !== 'null' && visit.referrer_domain.trim() !== '') {
    return visit.referrer_domain;
  }
  
  // Try to extract from referrer URL
  if (visit.referrer && visit.referrer !== 'null' && visit.referrer.trim() !== '') {
    try {
      const url = new URL(visit.referrer);
      return url.hostname;
    } catch {
      // If referrer is not a valid URL, continue to next method
    }
  }
  
  // Try to extract from page_path if it looks like a full URL
  if (visit.page_path && visit.page_path.startsWith('http')) {
    try {
      const url = new URL(visit.page_path);
      return url.hostname;
    } catch {
      // If page_path is not a valid URL, continue
    }
  }
  
  // Check user agent for common patterns that might indicate the site
  if (visit.user_agent) {
    const ua = visit.user_agent.toLowerCase();
    if (ua.includes('vark') || ua.includes('quiz')) {
      return 'vark-questionnaire.netlify.app';
    }
    if (ua.includes('localhost') || ua.includes('127.0.0.1')) {
      return 'localhost-dev';
    }
  }
  
  // Default based on page path patterns
  if (visit.page_path) {
    if (visit.page_path.includes('/quiz') || visit.page_path.includes('/results') || visit.page_path === '/') {
      return 'vark-questionnaire.netlify.app';
    }
    if (visit.page_path.includes('localhost') || visit.page_path.includes('127.0.0.1')) {
      return 'localhost-dev';
    }
  }
  
  // Last resort - check if we have any geographic or org data to make educated guess
  if (visit.org && visit.org.includes('Netlify')) {
    return 'netlify-hosted-site';
  }
  
  // Only use unknown-site.com as absolute last resort
  return 'direct-traffic';
}

// Group paths by domain/site with better logic
function groupBySite(visits: any[]): SiteData[] {
  const siteMap = new Map<string, { count: number; paths: Map<string, number> }>();
  
  visits.forEach(visit => {
    const domain = extractDomain(visit);
    
    if (!siteMap.has(domain)) {
      siteMap.set(domain, { count: 0, paths: new Map() });
    }
    
    const site = siteMap.get(domain)!;
    site.count++;
    
    const path = visit.page_path || '/';
    site.paths.set(path, (site.paths.get(path) || 0) + 1);
  });
  
  // Convert to array and sort
  return Array.from(siteMap.entries())
    .map(([domain, data]) => ({
      value: domain,
      domain,
      count: data.count,
      paths: Array.from(data.paths.entries())
        .map(([path, count]) => ({ value: path, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10) // Top 10 paths per site
    }))
    .sort((a, b) => b.count - a.count);
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
    const siteFilter = url.searchParams.get('site') || 'all';
    
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

    // Build query with site filter - FIXED: Don't filter out data, get ALL data first
    let query = supabase.from('visitor_analytics').select('*');
    
    // Get all visitor data for analysis (don't filter here, filter in processing)
    const { data: allVisits, error: visitsError } = await query.order('timestamp', { ascending: false });

    if (visitsError) throw visitsError;

    console.log(`Total visits in database: ${allVisits?.length || 0}`);

    // Apply site filter AFTER getting data if needed
    let filteredVisits = allVisits || [];
    if (siteFilter !== 'all') {
      filteredVisits = (allVisits || []).filter(visit => {
        const domain = extractDomain(visit);
        return domain === siteFilter;
      });
    }

    console.log(`Filtered visits: ${filteredVisits.length}`);

    // Get visitors per day (last 30 days) - FIXED: Use all data, not just recent
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentVisits = filteredVisits.filter(visit => 
      new Date(visit.timestamp) >= thirtyDaysAgo
    );

    console.log(`Recent visits (last 30 days): ${recentVisits.length}`);

    // Process daily visitors data
    const visitorsByDay = recentVisits.reduce((acc: Record<string, number>, visit) => {
      const date = new Date(visit.timestamp).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    const visitorsPerDay: VisitorData[] = Object.entries(visitorsByDay).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      visitors: count as number
    }));

    // Group visits by site
    const topSites = groupBySite(filteredVisits);
    const totalSites = topSites.length;

    // Get top IPs - FIXED: Filter out null values properly
    const ipCounts = filteredVisits.reduce((acc: Record<string, number>, visit) => {
      if (visit.ip_address && visit.ip_address !== null && visit.ip_address !== 'null') {
        acc[visit.ip_address] = (acc[visit.ip_address] || 0) + 1;
      }
      return acc;
    }, {});

    const topIPs: TopItem[] = Object.entries(ipCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 20)
      .map(([ip, count]) => ({ value: ip, count: count as number }));

    console.log(`Top IPs found: ${topIPs.length}`);

    // Get top user agents (simplified by browser) - FIXED: Better browser detection
    const uaCounts = filteredVisits.reduce((acc: Record<string, number>, visit) => {
      if (visit.browser_name && visit.browser_name !== null && visit.browser_name !== 'null') {
        acc[visit.browser_name] = (acc[visit.browser_name] || 0) + 1;
      } else if (visit.user_agent && visit.user_agent !== null && visit.user_agent !== 'null') {
        // Fallback to parsing user agent if browser_name is missing
        const ua = visit.user_agent.toLowerCase();
        let browser = 'Unknown';
        if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Chrome';
        else if (ua.includes('firefox')) browser = 'Firefox';
        else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
        else if (ua.includes('edg')) browser = 'Edge';
        else if (ua.includes('opera')) browser = 'Opera';
        
        acc[browser] = (acc[browser] || 0) + 1;
      }
      return acc;
    }, {});

    const topUserAgents: TopItem[] = Object.entries(uaCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([ua, count]) => ({ value: ua, count: count as number }));

    // Get top paths (across all sites)
    const pathCounts = filteredVisits.reduce((acc: Record<string, number>, visit) => {
      const domain = extractDomain(visit);
      const fullPath = `${domain}${visit.page_path || '/'}`;
      acc[fullPath] = (acc[fullPath] || 0) + 1;
      return acc;
    }, {});

    const topPaths: TopItem[] = Object.entries(pathCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 15)
      .map(([path, count]) => ({ value: path, count: count as number }));

    // Get top cities (enriched data) - FIXED: Better city/country handling
    const cityCounts = filteredVisits.reduce((acc: Record<string, number>, visit) => {
      if (visit.city && visit.city !== null && visit.city !== 'null') {
        const cityCountry = visit.country && visit.country !== 'null' 
          ? `${visit.city}, ${visit.country}` 
          : visit.city;
        acc[cityCountry] = (acc[cityCountry] || 0) + 1;
      }
      return acc;
    }, {});

    const topCities: TopItem[] = Object.entries(cityCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 15)
      .map(([city, count]) => ({ value: city, count: count as number }));

    // Get top ISPs/Organizations - FIXED: Better org handling
    const orgCounts = filteredVisits.reduce((acc: Record<string, number>, visit) => {
      if (visit.org && visit.org !== null && visit.org !== 'null') {
        // Clean up org names for better display
        let orgName = visit.org.toString();
        if (orgName.length > 40) {
          orgName = orgName.substring(0, 40) + '...';
        }
        acc[orgName] = (acc[orgName] || 0) + 1;
      }
      return acc;
    }, {});

    const topISPs: TopItem[] = Object.entries(orgCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 15)
      .map(([org, count]) => ({ value: org, count: count as number }));

    // Get top referrer domains (excluding null/empty) - FIXED: Better referrer handling
    const referrerCounts = filteredVisits.reduce((acc: Record<string, number>, visit) => {
      if (visit.referrer_domain && 
          visit.referrer_domain !== null && 
          visit.referrer_domain !== 'null' && 
          visit.referrer_domain.trim() !== '') {
        acc[visit.referrer_domain] = (acc[visit.referrer_domain] || 0) + 1;
      }
      return acc;
    }, {});

    const topReferrers: TopItem[] = Object.entries(referrerCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 15)
      .map(([domain, count]) => ({ value: domain, count: count as number }));

    // Get device type distribution - FIXED: Handle numeric device types
    const deviceCounts = filteredVisits.reduce((acc: Record<string, number>, visit) => {
      if (visit.device_type && visit.device_type !== null && visit.device_type !== 'null') {
        let deviceType = visit.device_type.toString();
        
        // Convert numeric device types to readable names
        if (deviceType === '0' || deviceType === 'desktop') deviceType = 'Desktop';
        else if (deviceType === '1' || deviceType === 'mobile') deviceType = 'Mobile';
        else if (deviceType === '2' || deviceType === 'tablet') deviceType = 'Tablet';
        else if (deviceType === 'unknown') deviceType = 'Unknown';
        
        acc[deviceType] = (acc[deviceType] || 0) + 1;
      }
      return acc;
    }, {});

    const deviceTypes: TopItem[] = Object.entries(deviceCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .map(([device, count]) => ({ value: device, count: count as number }));

    // Get raw visits with enriched data (last 100) - FIXED: Better data handling
    const rawVisits: RawVisit[] = filteredVisits.slice(0, 100).map(visit => ({
      id: visit.id,
      timestamp: visit.timestamp,
      ip_address: visit.ip_address || 'Unknown',
      page_path: visit.page_path || '/',
      user_agent: visit.user_agent || 'Unknown',
      country: visit.country || 'Unknown',
      city: visit.city || 'Unknown',
      region: visit.region || 'Unknown',
      org: visit.org || 'Unknown',
      device_type: visit.device_type ? (
        visit.device_type === '0' ? 'Desktop' :
        visit.device_type === '1' ? 'Mobile' :
        visit.device_type === '2' ? 'Tablet' :
        visit.device_type.toString()
      ) : 'Unknown',
      platform: visit.platform || visit.os_name || 'Unknown',
      referrer_domain: visit.referrer_domain || 'Direct',
      time_on_page_ms: visit.time_on_page_ms || 0
    }));

    // Calculate average session duration - FIXED: Better duration calculation
    const validDurations = filteredVisits
      .filter(visit => visit.time_on_page_ms && 
                      visit.time_on_page_ms !== null && 
                      visit.time_on_page_ms > 0 && 
                      visit.time_on_page_ms < 3600000) // Less than 1 hour (filter outliers)
      .map(visit => Number(visit.time_on_page_ms));

    const averageSessionDuration = validDurations.length > 0 
      ? validDurations.reduce((sum, duration) => sum + duration, 0) / validDurations.length
      : 0;

    console.log(`Valid durations found: ${validDurations.length}, Average: ${averageSessionDuration}ms`);

    // Get total visitor count
    const totalVisitors = filteredVisits.length;

    // Return all multi-site analytics data
    const analyticsData = {
      visitorsPerDay,
      topSites,
      topIPs,
      topUserAgents,
      topPaths,
      topCities,
      topISPs,
      topReferrers,
      deviceTypes,
      rawVisits,
      totalVisitors,
      totalSites,
      averageSessionDuration: Math.round(averageSessionDuration)
    };

    console.log('Analytics summary:', {
      totalVisitors,
      totalSites,
      topIPsCount: topIPs.length,
      topCitiesCount: topCities.length,
      averageSessionDuration: Math.round(averageSessionDuration)
    });

    return new Response(
      JSON.stringify(analyticsData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Multi-site analytics function error:', error);
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