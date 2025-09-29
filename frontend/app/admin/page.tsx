'use client';

import { useState, useEffect } from 'react';

// Types for admin data
interface AdminUser {
  username: string;
  email: string;
  last_login: string | null;
}

interface SystemStats {
  total_users: number;
  active_sessions: number;
  recent_signups_7d: number;
  recent_logins_24h: number;
  total_authentications: number;
  success_rate: number;
}

interface UserData {
  user_id: string;
  name: string;
  email: string;
  face_count: number;
  created_at: string | null;
  disabled: boolean;
  disabled_reason?: string;
  disabled_at?: string | null;
}

interface AnalyticsData {
  user_growth: Array<{ date: string; count: number }>;
  authentication_trends: Array<{ date: string; successful: number; failed: number }>;
  confidence_distribution: { high: number; medium: number; low: number };
  popular_actions: Array<{ action: string; count: number }>;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function AdminDashboard() {
  // const router = useRouter(); // Commented out as it's not used
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  
  // Login form state
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Dashboard data state
  const [currentView, setCurrentView] = useState<'overview' | 'users' | 'analytics' | 'logs'>('overview');
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing admin session
    const storedToken = localStorage.getItem('admin_token');
    const storedUser = localStorage.getItem('admin_user');
    
    if (storedToken && storedUser) {
      try {
        setAdminToken(storedToken);
        setAdminUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
        loadDashboardData(storedToken);
      } catch {
        // Clear invalid stored data
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
      }

      const data = await response.json();
      
      // Store admin session
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_user', JSON.stringify(data.admin));
      
      setAdminToken(data.token);
      setAdminUser(data.admin);
      setIsAuthenticated(true);
      
      // Load dashboard data
      await loadDashboardData(data.token);
      
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const loadDashboardData = async (token: string) => {
    setLoading(true);
    try {
      // Load system stats
      const statsResponse = await fetch(`${API_BASE_URL}/api/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setSystemStats(statsData.stats);
      }

      // Load users
      const usersResponse = await fetch(`${API_BASE_URL}/api/admin/users?limit=50`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.users);
      }

      // Load analytics
      const analyticsResponse = await fetch(`${API_BASE_URL}/api/admin/analytics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        setAnalytics(analyticsData.analytics);
      }

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setIsAuthenticated(false);
    setAdminUser(null);
    setAdminToken(null);
    setSystemStats(null);
    setUsers([]);
    setAnalytics(null);
  };

  const disableUser = async (userId: string, reason: string) => {
    if (!adminToken) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/disable`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_id: userId, reason })
      });

      if (response.ok) {
        // Reload users data
        await loadDashboardData(adminToken);
        alert('User disabled successfully');
      } else {
        const errorData = await response.json();
        alert(`Failed to disable user: ${errorData.detail}`);
      }
    } catch {
      alert('Error disabling user');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/20">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl text-white">👑</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">TrueFace Admin</h1>
            <p className="text-blue-200">Administrative Dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-white font-medium mb-2">Username</label>
              <input
                type="text"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                className="w-full bg-white/20 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Enter admin username"
                required
              />
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Password</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="w-full bg-white/20 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Enter admin password"
                required
              />
            </div>

            {loginError && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
                <p className="text-red-200 text-sm">{loginError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-bold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoggingIn ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  Authenticating...
                </div>
              ) : (
                'Login to Dashboard'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-blue-200 text-sm">
              Default credentials: admin / admin123
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Main dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
                <span className="text-xl text-white">👑</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">TrueFace Admin</h1>
                <p className="text-sm text-gray-500">Administrative Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, <strong>{adminUser?.username}</strong>
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { key: 'overview', label: 'Overview', icon: '📊' },
              { key: 'users', label: 'Users', icon: '👥' },
              { key: 'analytics', label: 'Analytics', icon: '📈' },
              { key: 'logs', label: 'Logs', icon: '📝' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setCurrentView(tab.key as 'overview' | 'users' | 'analytics' | 'logs')}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  currentView === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard data...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Overview Tab */}
        {currentView === 'overview' && systemStats && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">System Overview</h2>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-3xl">👥</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{systemStats.total_users}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-3xl">🔐</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Active Sessions</p>
                    <p className="text-2xl font-bold text-gray-900">{systemStats.active_sessions}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-3xl">📈</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Success Rate</p>
                    <p className="text-2xl font-bold text-gray-900">{Math.round(systemStats.success_rate * 100)}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-3xl">🆕</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">New Users (7d)</p>
                    <p className="text-2xl font-bold text-gray-900">{systemStats.recent_signups_7d}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-3xl">🔑</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Logins (24h)</p>
                    <p className="text-2xl font-bold text-gray-900">{systemStats.recent_logins_24h}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-3xl">📊</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Events</p>
                    <p className="text-2xl font-bold text-gray-900">{systemStats.total_authentications}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {currentView === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
              <p className="text-gray-600">{users.length} users total</p>
            </div>
            
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Face Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.user_id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {user.face_count} face{user.face_count !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.disabled ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Disabled
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {!user.disabled && (
                          <button
                            onClick={() => {
                              const reason = prompt('Reason for disabling user:');
                              if (reason) disableUser(user.user_id, reason);
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            Disable
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {users.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No users found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {currentView === 'analytics' && analytics && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Analytics & Reports</h2>
            
            {/* User Growth Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">User Growth (Last 7 Days)</h3>
              <div className="flex items-end space-x-2 h-32">
                {analytics.user_growth.map((day) => (
                  <div key={day.date} className="flex-1 flex flex-col items-center">
                    <div 
                      className="bg-blue-500 w-full rounded-t"
                      style={{ height: `${(day.count / Math.max(...analytics.user_growth.map(d => d.count))) * 100}%` }}
                    ></div>
                    <span className="text-xs text-gray-500 mt-1">
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Confidence Distribution */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recognition Confidence Distribution</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{analytics.confidence_distribution.high}%</div>
                  <div className="text-sm text-gray-500">High (≥90%)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{analytics.confidence_distribution.medium}%</div>
                  <div className="text-sm text-gray-500">Medium (70-89%)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{analytics.confidence_distribution.low}%</div>
                  <div className="text-sm text-gray-500">Low (&lt;70%)</div>
                </div>
              </div>
            </div>

            {/* Popular Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Popular Actions</h3>
              <div className="space-y-3">
                {analytics.popular_actions.map((action) => (
                  <div key={action.action} className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900 capitalize">{action.action}</span>
                    <span className="text-sm text-gray-500">{action.count} times</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Logs Tab */}
        {currentView === 'logs' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">System Logs</h2>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600">System logs functionality coming soon...</p>
              <p className="text-sm text-gray-500 mt-2">
                This will show detailed system logs, admin actions, and security events.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
