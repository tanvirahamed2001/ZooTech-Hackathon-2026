import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Shield, 
  Users, 
  Globe, 
  Monitor, 
  Calendar,
  AlertTriangle,
  Loader2,
  MapPin,
  Building,
  Clock,
  ExternalLink,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Eye,
  Network
} from 'lucide-react';

const ADMIN_TOKEN = 'SECRET123';

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

interface AnalyticsData {
  visitorsPerDay: VisitorData[];
  topSites: SiteData[];
  topIPs: TopItem[];
  topUserAgents: TopItem[];
  topPaths: TopItem[];
  topCities: TopItem[];
  topISPs: TopItem[];
  topReferrers: TopItem[];
  deviceTypes: TopItem[];
  rawVisits: RawVisit[];
  totalVisitors: number;
  totalSites: number;
  averageSessionDuration: number;
}

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];

const AnalyticsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const adminToken = searchParams.get('admin_token');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedSite, setSelectedSite] = useState<string>('all');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    visitorsPerDay: [],
    topSites: [],
    topIPs: [],
    topUserAgents: [],
    topPaths: [],
    topCities: [],
    topISPs: [],
    topReferrers: [],
    deviceTypes: [],
    rawVisits: [],
    totalVisitors: 0,
    totalSites: 0,
    averageSessionDuration: 0
  });

  // Check admin token
  if (adminToken !== ADMIN_TOKEN) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <motion.div 
          className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-800 mb-2">Access Denied</h1>
          <p className="text-red-600 mb-4">
            You need a valid admin token to access this dashboard.
          </p>
          <p className="text-sm text-red-500">
            Error 403: Forbidden
          </p>
        </motion.div>
      </div>
    );
  }

  // Fetch analytics data from visitor_analytics table
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        setError('');

        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analytics-data-multi-site?admin_token=${adminToken}&site=${selectedSite}`;
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        const data: AnalyticsData = await response.json();
        setAnalyticsData(data);

      } catch (error) {
        console.error('Error fetching analytics data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [adminToken, selectedSite]);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleIPClick = (ip: string) => {
    // Open Google DNS lookup in new tab
    window.open(`https://dns.google/query?name=${ip}`, '_blank');
  };

  const handleDomainClick = (domain: string) => {
    // Open domain in new tab
    window.open(`https://${domain}`, '_blank');
  };

  const handleISPClick = (org: string) => {
    // Search for ISP information
    window.open(`https://www.google.com/search?q="${encodeURIComponent(org)}" ISP`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-blue-50 flex items-center justify-center">
        <motion.div 
          className="bg-white rounded-xl shadow-lg p-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-neutral-800 mb-2">Loading VARK Analytics</h2>
          <p className="text-neutral-600">Fetching visitor intelligence from production data...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <motion.div 
          className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-800 mb-2">Error Loading Data</h1>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Retry
          </button>
        </motion.div>
      </div>
    );
  }

  const { 
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
    averageSessionDuration
  } = analyticsData;

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    return `${Math.round(ms / 60000)}m`;
  };

  const extractDomain = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-blue-50 p-4">
      <motion.div 
        className="max-w-7xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-neutral-800">VARK Analytics Dashboard</h1>
                <p className="text-neutral-600">Production visitor intelligence system</p>
              </div>
            </div>
            
            {/* Site Filter */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-neutral-500" />
                <select
                  value={selectedSite}
                  onChange={(e) => setSelectedSite(e.target.value)}
                  className="bg-white border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Sites</option>
                  {topSites.map((site) => (
                    <option key={site.domain} value={site.domain}>
                      {site.domain} ({site.count} visits)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm text-neutral-600">Total Visitors</p>
                <p className="text-2xl font-bold text-neutral-800">{totalVisitors.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center">
              <Globe className="w-8 h-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm text-neutral-600">Active Sites</p>
                <p className="text-2xl font-bold text-neutral-800">{totalSites}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-purple-500 mr-3" />
              <div>
                <p className="text-sm text-neutral-600">Avg Session</p>
                <p className="text-2xl font-bold text-neutral-800">{formatDuration(averageSessionDuration)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center">
              <MapPin className="w-8 h-8 text-amber-500 mr-3" />
              <div>
                <p className="text-sm text-neutral-600">Cities Reached</p>
                <p className="text-2xl font-bold text-neutral-800">{topCities.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center">
              <Network className="w-8 h-8 text-red-500 mr-3" />
              <div>
                <p className="text-sm text-neutral-600">Unique IPs</p>
                <p className="text-2xl font-bold text-neutral-800">{topIPs.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sites Overview */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-800">Sites Overview</h3>
            <button
              onClick={() => toggleSection('sites')}
              className="flex items-center text-blue-600 hover:text-blue-700"
            >
              {expandedSections.has('sites') ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <span className="ml-1">Details</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topSites.slice(0, 6).map((site, index) => (
              <div key={site.domain} className="border border-neutral-200 rounded-lg p-4 hover:bg-neutral-50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <button
                    onClick={() => handleDomainClick(site.domain)}
                    className="text-blue-600 hover:text-blue-700 font-medium flex items-center"
                  >
                    <Globe className="w-4 h-4 mr-1" />
                    {site.domain}
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </button>
                  <span className="text-sm font-bold text-neutral-800">{site.count}</span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${(site.count / topSites[0]?.count || 1) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  {((site.count / totalVisitors) * 100).toFixed(1)}% of total traffic
                </p>
              </div>
            ))}
          </div>

          {expandedSections.has('sites') && (
            <motion.div 
              className="mt-6 border-t border-neutral-200 pt-6"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
            >
              <h4 className="font-medium text-neutral-800 mb-4">Top Pages by Site</h4>
              <div className="space-y-4">
                {topSites.slice(0, 3).map((site) => (
                  <div key={site.domain} className="bg-neutral-50 rounded-lg p-4">
                    <h5 className="font-medium text-neutral-800 mb-2">{site.domain}</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {site.paths?.slice(0, 4).map((path, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <span className="text-neutral-600 truncate">{path.value}</span>
                          <span className="text-neutral-800 font-medium">{path.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Visitors per Day */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-neutral-800 mb-4">Visitors per Day (Last 30 Days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={visitorsPerDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="visitors" stroke="#0ea5e9" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Device Types */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-neutral-800 mb-4">Device Types</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={deviceTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ value, percent }) => `${value} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {deviceTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Interactive Data Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Top IPs with DNS Lookup */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-neutral-800 mb-4">Top IP Addresses</h3>
            <div className="space-y-2">
              {topIPs.slice(0, 10).map((ip, index) => (
                <div key={ip.value} className="flex justify-between items-center p-2 hover:bg-neutral-50 rounded group">
                  <button
                    onClick={() => handleIPClick(ip.value)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-mono flex items-center"
                  >
                    <Search className="w-3 h-3 mr-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    #{index + 1} {ip.value}
                  </button>
                  <span className="text-sm font-medium text-neutral-800">{ip.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top ISPs with Search */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-neutral-800 mb-4">Top ISPs/Organizations</h3>
            <div className="space-y-2">
              {topISPs.slice(0, 10).map((isp, index) => (
                <div key={isp.value} className="flex justify-between items-center p-2 hover:bg-neutral-50 rounded group">
                  <button
                    onClick={() => handleISPClick(isp.value)}
                    className="text-sm text-neutral-700 hover:text-blue-600 truncate flex items-center"
                  >
                    <Building className="w-3 h-3 mr-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    #{index + 1} {isp.value}
                  </button>
                  <span className="text-sm font-medium text-neutral-800">{isp.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Referrers with Links */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-neutral-800 mb-4">Top Referral Domains</h3>
            <div className="space-y-2">
              {topReferrers.slice(0, 10).map((referrer, index) => (
                <div key={referrer.value} className="flex justify-between items-center p-2 hover:bg-neutral-50 rounded group">
                  <button
                    onClick={() => handleDomainClick(referrer.value)}
                    className="text-sm text-blue-600 hover:text-blue-700 truncate flex items-center"
                  >
                    <ExternalLink className="w-3 h-3 mr-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    #{index + 1} {referrer.value}
                  </button>
                  <span className="text-sm font-medium text-neutral-800">{referrer.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Enhanced Raw Visit Log */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-800">Recent Visits (Last 100) - Production Intelligence</h3>
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4 text-neutral-500" />
              <span className="text-sm text-neutral-600">Click IPs for DNS lookup</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left p-2 text-neutral-600">Time</th>
                  <th className="text-left p-2 text-neutral-600">Site</th>
                  <th className="text-left p-2 text-neutral-600">IP Address</th>
                  <th className="text-left p-2 text-neutral-600">Location</th>
                  <th className="text-left p-2 text-neutral-600">ISP</th>
                  <th className="text-left p-2 text-neutral-600">Device</th>
                  <th className="text-left p-2 text-neutral-600">Page</th>
                  <th className="text-left p-2 text-neutral-600">Duration</th>
                </tr>
              </thead>
              <tbody>
                {rawVisits.map((visit) => (
                  <tr key={visit.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <td className="p-2 text-neutral-700">
                      {new Date(visit.timestamp).toLocaleString()}
                    </td>
                    <td className="p-2">
                      <button
                        onClick={() => handleDomainClick(extractDomain(visit.page_path))}
                        className="text-blue-600 hover:text-blue-700 text-xs flex items-center"
                      >
                        {extractDomain(visit.page_path)}
                        <ExternalLink className="w-2 h-2 ml-1" />
                      </button>
                    </td>
                    <td className="p-2">
                      <button
                        onClick={() => handleIPClick(visit.ip_address)}
                        className="text-blue-600 hover:text-blue-700 font-mono text-xs flex items-center"
                      >
                        {visit.ip_address}
                        <Search className="w-2 h-2 ml-1" />
                      </button>
                    </td>
                    <td className="p-2 text-neutral-700">
                      {visit.city && visit.country ? `${visit.city}, ${visit.country}` : 
                       visit.country || 'Unknown'}
                    </td>
                    <td className="p-2">
                      {visit.org ? (
                        <button
                          onClick={() => handleISPClick(visit.org)}
                          className="text-neutral-700 hover:text-blue-600 text-xs"
                        >
                          {visit.org.substring(0, 20) + (visit.org.length > 20 ? '...' : '')}
                        </button>
                      ) : 'Unknown'}
                    </td>
                    <td className="p-2 text-neutral-700">
                      {visit.platform || visit.device_type || 'Unknown'}
                    </td>
                    <td className="p-2 text-neutral-700">{visit.page_path}</td>
                    <td className="p-2 text-neutral-700">
                      {visit.time_on_page_ms ? formatDuration(visit.time_on_page_ms) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-neutral-500 text-sm">
          <p>VARK Analytics Dashboard • Powered by visitor_analytics table • Last updated: {new Date().toLocaleString()}</p>
          <p className="mt-1">Tracking {totalSites} active sites • {totalVisitors.toLocaleString()} total visitors • Production data only</p>
        </div>
      </motion.div>
    </div>
  );
};

export default AnalyticsPage;