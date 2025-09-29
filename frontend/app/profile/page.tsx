'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApi } from '../../hooks/useApi';

interface UserProfile {
  user_id: string;
  name: string;
  email: string;
  face_count: number;
  created_at: string;
}

export default function Profile() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const { getProfile, isLoading, error } = useApi();

  const loadProfile = useCallback(async (userToken: string) => {
    setLoadingProfile(true);
    const profileData = await getProfile(userToken);
    if (profileData) {
      setProfile(profileData);
    }
    setLoadingProfile(false);
  }, [getProfile]);

  useEffect(() => {
    // Check if user is logged in
    const storedToken = localStorage.getItem('truface_token');
    if (!storedToken) {
      router.push('/auth/login');
      return;
    }
    
    setToken(storedToken);
    loadProfile(storedToken);
  }, [router, loadProfile]);

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
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown';
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
                <span className="text-blue-600 font-medium">Profile</span>
                <Link href="/sessions" className="text-gray-600 hover:text-blue-600 font-medium">
                  Sessions
                </Link>
                <Link href="/history" className="text-gray-600 hover:text-blue-600 font-medium">
                  History
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              {profile && (
                <span className="text-sm text-gray-600">Welcome, {profile.name}</span>
              )}
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
            👤 User Profile
          </h1>
          <p className="text-gray-600">
            Manage your account information and security settings
          </p>
        </div>

        {/* Profile Information */}
        {loadingProfile || isLoading ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-center">
              <span className="text-red-500 text-xl mr-3">⚠️</span>
              <div>
                <p className="font-semibold text-red-800">Error Loading Profile</p>
                <p className="text-red-600">{error}</p>
              </div>
            </div>
            <button
              onClick={() => profile && loadProfile(token)}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : profile ? (
          <div className="space-y-6">
            {/* Basic Information Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <span className="text-blue-500 mr-2">ℹ️</span>
                Basic Information
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <div className="bg-gray-50 rounded-lg p-3 border">
                    <p className="text-gray-900 font-medium">{profile.name}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="bg-gray-50 rounded-lg p-3 border">
                    <p className="text-gray-900">{profile.email}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    User ID
                  </label>
                  <div className="bg-gray-50 rounded-lg p-3 border">
                    <p className="text-gray-700 font-mono text-sm">{profile.user_id}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Created
                  </label>
                  <div className="bg-gray-50 rounded-lg p-3 border">
                    <p className="text-gray-900">{formatDate(profile.created_at)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Information Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <span className="text-green-500 mr-2">🔒</span>
                Security & Authentication
              </h2>
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-green-500 text-xl mr-3">✅</span>
                      <div>
                        <p className="font-semibold text-green-800">Face Recognition Active</p>
                        <p className="text-green-600 text-sm">
                          {profile.face_count} face{profile.face_count !== 1 ? 's' : ''} enrolled for authentication
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/dashboard"
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      Manage Faces
                    </Link>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <span className="text-blue-500 text-xl mr-3">🛡️</span>
                      <div>
                        <p className="font-semibold text-blue-800">Session Management</p>
                        <p className="text-blue-600 text-sm">View and manage active sessions</p>
                      </div>
                    </div>
                    <Link
                      href="/sessions"
                      className="mt-3 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      View Sessions
                    </Link>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <span className="text-purple-500 text-xl mr-3">📊</span>
                      <div>
                        <p className="font-semibold text-purple-800">Activity History</p>
                        <p className="text-purple-600 text-sm">View login and authentication logs</p>
                      </div>
                    </div>
                    <Link
                      href="/history"
                      className="mt-3 inline-block bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
                    >
                      View History
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <span className="text-orange-500 mr-2">⚡</span>
                Quick Actions
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                <Link
                  href="/dashboard"
                  className="block bg-gray-50 hover:bg-gray-100 rounded-lg p-4 border-2 border-transparent hover:border-blue-200 transition-all group"
                >
                  <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">🏠</div>
                  <p className="font-semibold text-gray-900 group-hover:text-blue-600">Dashboard</p>
                  <p className="text-gray-600 text-sm">Return to main dashboard</p>
                </Link>

                <Link
                  href="/sessions"
                  className="block bg-gray-50 hover:bg-gray-100 rounded-lg p-4 border-2 border-transparent hover:border-blue-200 transition-all group"
                >
                  <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">🔐</div>
                  <p className="font-semibold text-gray-900 group-hover:text-blue-600">Manage Sessions</p>
                  <p className="text-gray-600 text-sm">View and revoke sessions</p>
                </Link>

                <Link
                  href="/history"
                  className="block bg-gray-50 hover:bg-gray-100 rounded-lg p-4 border-2 border-transparent hover:border-blue-200 transition-all group"
                >
                  <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">📈</div>
                  <p className="font-semibold text-gray-900 group-hover:text-blue-600">View Activity</p>
                  <p className="text-gray-600 text-sm">Check authentication history</p>
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
