'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApi } from '../../hooks/useApi';

interface UserSession {
  session_id: string;
  issued_at: string;
  expires_at: string | null;
  is_current: boolean;
}

export default function Sessions() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [revokingAll, setRevokingAll] = useState(false);
  const { getSessions, revokeAllSessions, isLoading, error } = useApi();

  const loadSessions = useCallback(async (userToken: string) => {
    setLoadingSessions(true);
    const sessionsData = await getSessions(userToken);
    if (sessionsData) {
      setSessions(sessionsData);
    }
    setLoadingSessions(false);
  }, [getSessions]);

  useEffect(() => {
    // Check if user is logged in
    const storedToken = localStorage.getItem('truface_token');
    if (!storedToken) {
      router.push('/auth/login');
      return;
    }
    
    setToken(storedToken);
    loadSessions(storedToken);
  }, [router, loadSessions]);

  const handleRevokeAll = async () => {
    if (!token) return;
    
    setRevokingAll(true);
    const revokedCount = await revokeAllSessions(token);
    if (revokedCount !== null) {
      // Refresh sessions list
      await loadSessions(token);
      
      // Show success message
      alert(`Successfully revoked ${revokedCount} session${revokedCount !== 1 ? 's' : ''}!`);
    }
    setRevokingAll(false);
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
        minute: '2-digit'
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
                <span className="text-blue-600 font-medium">Sessions</span>
                <Link href="/history" className="text-gray-600 hover:text-blue-600 font-medium">
                  History
                </Link>
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
            🛡️ Session Management
          </h1>
          <p className="text-gray-600">
            View and manage your active authentication sessions
          </p>
        </div>

        {/* Sessions Information */}
        {loadingSessions || isLoading ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading sessions...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-center">
              <span className="text-red-500 text-xl mr-3">⚠️</span>
              <div>
                <p className="font-semibold text-red-800">Error Loading Sessions</p>
                <p className="text-red-600">{error}</p>
              </div>
            </div>
            <button
              onClick={() => token && loadSessions(token)}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Session Controls */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <span className="text-blue-500 mr-2">🔐</span>
                  Active Sessions ({sessions.length})
                </h2>
                {sessions.length > 1 && (
                  <button
                    onClick={handleRevokeAll}
                    disabled={revokingAll}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {revokingAll ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Revoking...
                      </>
                    ) : (
                      'Revoke Other Sessions'
                    )}
                  </button>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <span className="text-blue-500 text-xl mr-3">ℹ️</span>
                  <div>
                    <p className="font-semibold text-blue-800">Session Security</p>
                    <p className="text-blue-600 text-sm">
                      Each session represents a login from a device or browser. Revoking sessions will log out those devices immediately.
                    </p>
                  </div>
                </div>
              </div>

              {/* Sessions List */}
              {sessions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🔒</div>
                  <p className="text-gray-600">No active sessions found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <div
                      key={session.session_id}
                      className={`border rounded-lg p-4 ${
                        session.is_current 
                          ? 'border-green-200 bg-green-50' 
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`text-2xl ${
                            session.is_current ? 'text-green-500' : 'text-gray-400'
                          }`}>
                            {session.is_current ? '🟢' : '💻'}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <p className="font-semibold text-gray-900">
                                {session.is_current ? 'Current Session' : 'Active Session'}
                              </p>
                              {session.is_current && (
                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                  Current
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600 text-sm">
                              Started: {formatDate(session.issued_at)} • {getRelativeTime(session.issued_at)}
                            </p>
                            {session.expires_at ? (
                              <p className="text-gray-500 text-xs">
                                Expires: {formatDate(session.expires_at)}
                              </p>
                            ) : (
                              <p className="text-gray-500 text-xs">No expiration</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-500 text-xs font-mono">
                            ID: {session.session_id.substring(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Security Tips */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className="text-yellow-500 mr-2">💡</span>
                Security Tips
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <span className="text-yellow-500 text-lg mr-2">🔒</span>
                    <p className="font-semibold text-yellow-800">Regular Cleanup</p>
                  </div>
                  <p className="text-yellow-700 text-sm">
                    Regularly revoke unused sessions to maintain security, especially if you&apos;ve used public computers.
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <span className="text-blue-500 text-lg mr-2">🛡️</span>
                    <p className="font-semibold text-blue-800">Suspicious Activity</p>
                  </div>
                  <p className="text-blue-700 text-sm">
                    If you notice unfamiliar sessions, revoke them immediately and consider changing your access patterns.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
