'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApi } from '../../hooks/useApi';

interface HistoryEntry {
  _id: string;
  action: string;
  confidence: number | null;
  timestamp: string;
  metadata: Record<string, any>;
  success: boolean;
}

export default function History() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [limit, setLimit] = useState(50);
  const { getHistory, isLoading, error, clearError } = useApi();

  useEffect(() => {
    // Check if user is logged in
    const storedToken = localStorage.getItem('truface_token');
    if (!storedToken) {
      router.push('/auth/login');
      return;
    }
    
    setToken(storedToken);
    loadHistory(storedToken, limit);
  }, [router, limit]);

  const loadHistory = async (userToken: string, recordLimit: number) => {
    setLoadingHistory(true);
    const historyData = await getHistory(userToken, recordLimit);
    if (historyData) {
      setHistory(historyData);
    }
    setLoadingHistory(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('truface_token');
    localStorage.removeItem('truface_user_id');
    router.push('/');
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return 'Unknown';
    }
  };

  const getRelativeTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${diffDays}d ago`;
    } catch {
      return '';
    }
  };

  const getActionEmoji = (action: string) => {
    switch (action) {
      case 'signup': return '📝';
      case 'login': return '🔑';
      case 'logout': return '🚪';
      case 'enroll': return '📷';
      case 'verify': return '✅';
      case 'recognize': return '🔍';
      default: return '📊';
    }
  };

  const getActionColor = (action: string, success: boolean) => {
    if (action === 'logout') return 'bg-gray-100 text-gray-800 border-gray-200';
    if (success) {
      switch (action) {
        case 'signup':
        case 'enroll': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'login':
        case 'verify': return 'bg-green-100 text-green-800 border-green-200';
        case 'recognize': return 'bg-purple-100 text-purple-800 border-purple-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    }
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getActionDescription = (action: string) => {
    switch (action) {
      case 'signup': return 'Account created';
      case 'login': return 'Logged in';
      case 'logout': return 'Logged out';
      case 'enroll': return 'Face enrolled';
      case 'verify': return 'Identity verified';
      case 'recognize': return 'Face recognized';
      default: return action.charAt(0).toUpperCase() + action.slice(1);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-6">
              <Link href="/dashboard" className="flex items-center space-x-2 hover:text-blue-600">
                <span className="text-2xl">👤</span>
                <span className="text-xl font-bold text-gray-900">TrueFace</span>
              </Link>
              <nav className="hidden md:flex space-x-6">
                <Link href="/dashboard" className="text-gray-600 hover:text-blue-600 font-medium">
                  Dashboard
                </Link>
                <Link href="/profile" className="text-gray-600 hover:text-blue-600 font-medium">
                  Profile
                </Link>
                <Link href="/sessions" className="text-gray-600 hover:text-blue-600 font-medium">
                  Sessions
                </Link>
                <span className="text-blue-600 font-medium">History</span>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLogout}
                className="text-red-600 hover:text-red-800 font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📊 Authentication History
          </h1>
          <p className="text-gray-600">
            View your recent authentication and recognition activity
          </p>
        </div>

        {/* History Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <span className="text-purple-500 mr-2">⏱️</span>
              Activity Log
            </h2>
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Show:</label>
              <select
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value={25}>Last 25</option>
                <option value={50}>Last 50</option>
                <option value={100}>Last 100</option>
              </select>
            </div>
          </div>
        </div>

        {/* History Information */}
        {loadingHistory || isLoading ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading history...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-center">
              <span className="text-red-500 text-xl mr-3">⚠️</span>
              <div>
                <p className="font-semibold text-red-800">Error Loading History</p>
                <p className="text-red-600">{error}</p>
              </div>
            </div>
            <button
              onClick={() => token && loadHistory(token, limit)}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* History List */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              {history.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📝</div>
                  <p className="text-gray-600">No activity history found</p>
                  <p className="text-gray-500 text-sm mt-2">
                    Your authentication activities will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((entry) => (
                    <div
                      key={entry._id}
                      className={`border rounded-lg p-4 ${getActionColor(entry.action, entry.success)}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">
                            {getActionEmoji(entry.action)}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <p className="font-semibold">
                                {getActionDescription(entry.action)}
                              </p>
                              <span className={`text-xs px-2 py-1 rounded-full border ${
                                entry.success 
                                  ? 'bg-green-100 text-green-700 border-green-300' 
                                  : 'bg-red-100 text-red-700 border-red-300'
                              }`}>
                                {entry.success ? 'Success' : 'Failed'}
                              </span>
                            </div>
                            <p className="text-sm opacity-75">
                              {formatDate(entry.timestamp)} • {getRelativeTime(entry.timestamp)}
                            </p>
                            {entry.confidence !== null && (
                              <p className="text-xs opacity-75">
                                Confidence: {Math.round(entry.confidence * 100)}%
                              </p>
                            )}
                            {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                              <div className="text-xs opacity-75 mt-1">
                                {Object.entries(entry.metadata).map(([key, value]) => (
                                  <span key={key} className="mr-2">
                                    {key}: {String(value)}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs opacity-60 font-mono">
                            {entry._id.substring(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Summary Statistics */}
            {history.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="text-green-500 mr-2">📈</span>
                  Activity Summary
                </h2>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <div className="text-2xl text-blue-600 mb-1">
                      {history.filter(e => e.action === 'login').length}
                    </div>
                    <p className="text-blue-800 text-sm font-medium">Logins</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <div className="text-2xl text-green-600 mb-1">
                      {history.filter(e => e.success).length}
                    </div>
                    <p className="text-green-800 text-sm font-medium">Successful</p>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                    <div className="text-2xl text-purple-600 mb-1">
                      {history.filter(e => e.action === 'enroll').length}
                    </div>
                    <p className="text-purple-800 text-sm font-medium">Face Enrollments</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                    <div className="text-2xl text-gray-600 mb-1">
                      {history.length}
                    </div>
                    <p className="text-gray-800 text-sm font-medium">Total Events</p>
                  </div>
                </div>
                
                {history.filter(e => e.confidence !== null).length > 0 && (
                  <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800 font-medium mb-1">Average Confidence</p>
                    <p className="text-yellow-700 text-2xl">
                      {Math.round(
                        history
                          .filter(e => e.confidence !== null)
                          .reduce((sum, e) => sum + (e.confidence || 0), 0) /
                        history.filter(e => e.confidence !== null).length * 100
                      )}%
                    </p>
                    <p className="text-yellow-600 text-sm">
                      Based on {history.filter(e => e.confidence !== null).length} recognition events
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
