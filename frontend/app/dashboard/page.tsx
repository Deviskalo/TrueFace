'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApi } from '../../hooks/useApi';
import CameraCapture from '../../components/CameraCapture';

export default function Dashboard() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<'enroll' | 'verify' | null>(null);
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const { enrollFace, verifyFace, isLoading, error, clearError } = useApi();

  useEffect(() => {
    // Check if user is logged in
    const storedToken = localStorage.getItem('truface_token');
    const storedUserId = localStorage.getItem('truface_user_id');
    
    if (!storedToken || !storedUserId) {
      router.push('/auth/login');
      return;
    }
    
    setToken(storedToken);
    setUserId(storedUserId);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('truface_token');
    localStorage.removeItem('truface_user_id');
    router.push('/');
  };

  const handleEnrollCapture = async (imageSrc: string, imageBlob: Blob) => {
    if (!token) return;
    const success = await enrollFace(imageBlob, token);
    if (success) {
      setModalMessage('✅ Face enrolled successfully! Your account now has additional face data for improved recognition.');
      setTimeout(() => {
        setActiveModal(null);
        setModalMessage(null);
      }, 3000);
    }
  };

  const handleVerifyCapture = async (imageSrc: string, imageBlob: Blob) => {
    if (!token) return;
    const result = await verifyFace(imageBlob, token);
    if (result) {
      const confidence = Math.round(result.confidence * 100);
      if (result.verified) {
        setModalMessage(`✅ Identity verified successfully! Confidence: ${confidence}%`);
      } else {
        setModalMessage(`❌ Identity verification failed. Confidence: ${confidence}% (below threshold)`);
      }
      setTimeout(() => {
        setActiveModal(null);
        setModalMessage(null);
      }, 4000);
    }
  };

  const handleCameraError = (errorMessage: string) => {
    setModalMessage(`❌ ${errorMessage}`);
  };

  if (!token || !userId) {
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
            <div className="flex items-center space-x-2">
              <span className="text-2xl">👤</span>
              <span className="text-xl font-bold text-gray-900">TrueFace</span>
              <span className="text-sm text-gray-500">Dashboard</span>
            </div>
            <div className="flex items-center space-x-6">
              <nav className="hidden md:flex space-x-6">
                <span className="text-blue-600 font-medium">Dashboard</span>
                <Link href="/profile" className="text-gray-600 hover:text-blue-600 font-medium">
                  Profile
                </Link>
                <Link href="/sessions" className="text-gray-600 hover:text-blue-600 font-medium">
                  Sessions
                </Link>
                <Link href="/history" className="text-gray-600 hover:text-blue-600 font-medium">
                  History
                </Link>
              </nav>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">User: {userId}</span>
                <button
                  onClick={handleLogout}
                  className="text-red-600 hover:text-red-800 font-medium"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to Your Dashboard! 🎉
          </h1>
          <p className="text-gray-600 mb-4">
            Congratulations! You've successfully registered with TrueFace and are now logged in using facial recognition.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <span className="text-green-500 text-xl mr-3">✅</span>
              <div>
                <p className="font-semibold text-green-800">Face Authentication Active</p>
                <p className="text-green-600 text-sm">Your account is secured with biometric authentication</p>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="text-3xl mb-4">🔒</div>
            <h3 className="text-lg font-semibold mb-2">Face Enrollment</h3>
            <p className="text-gray-600 mb-4">
              Add additional face photos to improve recognition accuracy.
            </p>
            <button 
              onClick={() => setActiveModal('enroll')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Enroll New Face
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="text-3xl mb-4">✅</div>
            <h3 className="text-lg font-semibold mb-2">Identity Verification</h3>
            <p className="text-gray-600 mb-4">
              Verify your identity with a quick face scan.
            </p>
            <button 
              onClick={() => setActiveModal('verify')}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              Verify Identity
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="text-lg font-semibold mb-2">Activity History</h3>
            <p className="text-gray-600 mb-4">
              View your authentication history and activity logs.
            </p>
            <Link href="/history" className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors block text-center">
              View History
            </Link>
          </div>
        </div>

        {/* New Quick Access Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="text-3xl mb-4">👤</div>
            <h3 className="text-lg font-semibold mb-2">User Profile</h3>
            <p className="text-gray-600 mb-4">
              View and manage your account information and settings.
            </p>
            <Link href="/profile" className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors block text-center">
              View Profile
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="text-3xl mb-4">🛡️</div>
            <h3 className="text-lg font-semibold mb-2">Session Management</h3>
            <p className="text-gray-600 mb-4">
              Manage active sessions and secure your account.
            </p>
            <Link href="/sessions" className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors block text-center">
              Manage Sessions
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="text-3xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold mb-2">Recognition Analytics</h3>
            <p className="text-gray-600 mb-4">
              View detailed analytics of your face recognition performance.
            </p>
            <Link href="/history" className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors block text-center">
              View Analytics
            </Link>
          </div>
        </div>

        {/* Success Section */}
        <div className="bg-green-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-green-900 mb-4">🎉 TrueFace is Fully Functional!</h2>
          <p className="text-green-800 mb-4">
            Congratulations! You've successfully used facial recognition to authenticate. Here's what's working:
          </p>
          <ul className="list-disc list-inside text-green-700 space-y-2">
            <li>✅ Face-based user registration</li>
            <li>✅ Face-based login authentication</li>
            <li>✅ Camera integration with webcam</li>
            <li>✅ Intelligent face recognition backend (FastAPI + mock embeddings)</li>
            <li>✅ Development mode with in-memory database</li>
            <li>✅ JWT token authentication & session management</li>
            <li>✅ Complete authentication flow (signup → login → dashboard)</li>
            <li>✅ Enhanced camera permissions handling</li>
            <li>✅ Cross-browser compatibility</li>
          </ul>
          <div className="mt-4 p-4 bg-white rounded-lg">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">
                  <strong>🚀 Production Ready Features:</strong><br/>
                  • MongoDB Atlas support<br/>
                  • Real face recognition (with ML models)<br/>
                  • HTTPS deployment ready<br/>
                  • Comprehensive error handling
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  <strong>🛠️ Development Mode Active:</strong><br/>
                  • Mock face embeddings for testing<br/>
                  • In-memory user database<br/>
                  • No external dependencies<br/>
                  • Perfect for demos and development
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Camera Actions */}
      {activeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">
                {activeModal === 'enroll' ? '📷 Enroll Additional Face' : '🔍 Verify Your Identity'}
              </h2>
              <button
                onClick={() => {
                  setActiveModal(null);
                  setModalMessage(null);
                  clearError();
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-600 text-center">
                {activeModal === 'enroll' 
                  ? 'Adding multiple face photos improves recognition accuracy. Position your face in the circle and capture.' 
                  : 'Look at the camera to verify your identity. This will confirm you are the account holder.'}
              </p>
            </div>

            {modalMessage ? (
              <div className="text-center p-6">
                <div className="text-4xl mb-4">
                  {modalMessage.startsWith('✅') ? '🎉' : '⚠️'}
                </div>
                <p className={`text-lg ${modalMessage.startsWith('✅') ? 'text-green-700' : 'text-red-700'}`}>
                  {modalMessage}
                </p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-700">{error}</p>
              </div>
            ) : (
              <CameraCapture
                onCapture={activeModal === 'enroll' ? handleEnrollCapture : handleVerifyCapture}
                onError={handleCameraError}
                className="w-full"
              />
            )}

            {isLoading && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mx-auto mb-2"></div>
                <p className="text-gray-600">Processing...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
