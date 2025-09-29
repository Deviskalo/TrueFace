'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useApi } from '../../../hooks/useApi';
import CameraCapture from '../../../components/CameraCapture';
import ThemeToggle from '../../components/ThemeToggle';

export default function LoginPage() {
  const { login, isLoading, error, clearError } = useApi();
  const router = useRouter();
  
  const [currentStep, setCurrentStep] = useState<"intro" | "camera" | "processing">("intro");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const handleStartLogin = () => {
    clearError();
    setCurrentStep("camera");
  };

  const handleCameraCapture = async (imageSrc: string, imageBlob: Blob) => {
    setCapturedImage(imageSrc);
    setCurrentStep("processing");

    try {
      const result = await login(imageBlob);
      
      if (result?.match) {
        // Store authentication details
        localStorage.setItem('truface_token', result.match.token);
        localStorage.setItem('truface_user_id', result.match.user_id);
        
        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        // No match found - show error and reset
        setCurrentStep("intro");
        setCapturedImage(null);
      }
    } catch (err) {
      console.error('Login failed:', err);
      setCurrentStep("intro");
      setCapturedImage(null);
    }
  };

  const handleCameraError = (errorMessage: string) => {
    console.error('Camera error:', errorMessage);
  };

  const resetLogin = () => {
    setCurrentStep("intro");
    setCapturedImage(null);
    clearError();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Theme Toggle */}
        <div className="flex justify-end mb-6">
          <ThemeToggle />
        </div>
        
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-3 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors mb-6">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-2xl text-white">👤</span>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white dark:border-gray-800 animate-pulse"></div>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">TrueFace</span>
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3">Welcome Back!</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Secure, instant access with just a look ✨
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/20 p-8">
          {/* Progress Steps */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-6">
              <div className="flex flex-col items-center space-y-2">
                <div className={`flex items-center justify-center w-12 h-12 rounded-2xl text-sm font-bold transition-all duration-300 ${ 
                  currentStep === "intro" 
                    ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg scale-110" 
                    : "bg-green-500 text-white shadow-md"
                }`}>
                  {currentStep !== "intro" ? "✓" : "🔑"}
                </div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Ready</span>
              </div>
              <div className={`h-1 w-16 rounded-full transition-all duration-500 ${ 
                ["camera", "processing"].includes(currentStep) ? "bg-gradient-to-r from-green-400 to-green-500" : "bg-gray-200 dark:bg-gray-600"
              }`}></div>
              <div className="flex flex-col items-center space-y-2">
                <div className={`flex items-center justify-center w-12 h-12 rounded-2xl text-sm font-bold transition-all duration-300 ${
                  currentStep === "camera" 
                    ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg scale-110"
                    : currentStep === "processing" 
                    ? "bg-green-500 text-white shadow-md"
                    : "bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                }`}>
                  {currentStep === "processing" ? "✓" : currentStep === "camera" ? "📷" : "🔍"}
                </div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Scan</span>
              </div>
              <div className={`h-1 w-16 rounded-full transition-all duration-500 ${ 
                currentStep === "processing" ? "bg-gradient-to-r from-green-400 to-green-500" : "bg-gray-200 dark:bg-gray-600"
              }`}></div>
              <div className="flex flex-col items-center space-y-2">
                <div className={`flex items-center justify-center w-12 h-12 rounded-2xl text-sm font-bold transition-all duration-300 ${
                  currentStep === "processing" ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg scale-110" : "bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                }`}>
                  {currentStep === "processing" ? "⚙️" : "✓"}
                </div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Verify</span>
              </div>
            </div>
          </div>

          {/* Step Content */}
          {currentStep === "intro" && (
            <div className="text-center space-y-8">
              <div className="relative">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-3xl mb-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center">
                    <span className="text-3xl text-white">🔒</span>
                  </div>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-400 rounded-full border-3 border-white flex items-center justify-center">
                  <span className="text-sm">✨</span>
                </div>
              </div>
              
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">Instant Access</h2>
                <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto text-lg leading-relaxed">
                  Look at your camera for secure, passwordless authentication in seconds.
                </p>
              </div>
              
              {error && (
                <div className="bg-red-50/80 dark:bg-red-900/80 backdrop-blur-sm border border-red-200 dark:border-red-700 rounded-2xl p-6 max-w-md mx-auto">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-red-100 dark:bg-red-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-red-600 dark:text-red-300 text-sm">⚠️</span>
                    </div>
                    <div>
                      <p className="text-red-800 dark:text-red-200 font-medium mb-1">Authentication Failed</p>
                      <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                <button
                  onClick={handleStartLogin}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-8 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 active:scale-[0.98] flex items-center justify-center space-x-3"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-xl">📷</span>
                      <span>Start Face Login</span>
                      <span className="text-xl">➡️</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center space-x-4 pt-4">
                  <div className="h-px bg-gray-200 dark:bg-gray-600 flex-1"></div>
                  <span className="text-gray-400 dark:text-gray-500 text-sm font-medium">or</span>
                  <div className="h-px bg-gray-200 dark:bg-gray-600 flex-1"></div>
                </div>

                <div className="text-center">
                  <Link 
                    href="/auth/signup" 
                    className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-semibold group"
                  >
                    <span>🆕</span>
                    <span>Create new account</span>
                    <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {currentStep === "camera" && (
            <div className="space-y-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-800 dark:to-blue-800 rounded-2xl mb-4">
                  <span className="text-3xl">📷</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">Face Recognition</h2>
                <p className="text-gray-600 dark:text-gray-300 text-lg max-w-md mx-auto leading-relaxed">
                  Center your face in the frame and click capture when ready
                </p>
              </div>
              
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 rounded-3xl blur-xl opacity-20 animate-pulse"></div>
                <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-4 rounded-3xl shadow-2xl border border-white/30 dark:border-gray-700/30">
                  <CameraCapture
                    onCapture={handleCameraCapture}
                    onError={handleCameraError}
                    className="w-full rounded-2xl overflow-hidden"
                  />
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900 dark:to-purple-900 rounded-2xl p-6">
                <div className="flex items-center justify-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Camera Active</span>
                  </div>
                  <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"></div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Ready to Capture</span>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={resetLogin}
                  className="inline-flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors font-medium group bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm px-6 py-3 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 hover:bg-white/70 dark:hover:bg-gray-800/70 hover:shadow-lg"
                >
                  <span className="transform group-hover:-translate-x-1 transition-transform">←</span>
                  <span>Back to Start</span>
                </button>
              </div>
            </div>
          )}

          {currentStep === "processing" && (
            <div className="text-center space-y-8">
              <div className="relative">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-800 dark:to-blue-800 rounded-3xl mb-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center animate-pulse">
                    <span className="text-3xl text-white">⚙️</span>
                  </div>
                </div>
                <div className="absolute -inset-2 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full blur-md opacity-20 animate-ping"></div>
              </div>
              
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">Processing...</h2>
                <p className="text-gray-600 dark:text-gray-300 text-lg max-w-md mx-auto leading-relaxed">
                  Analyzing your facial features for secure authentication
                </p>
              </div>
              
              {capturedImage && (
                <div className="flex justify-center">
                  <div className="relative">
                    <Image 
                      src={capturedImage} 
                      alt="Captured face" 
                      width={128}
                      height={128}
                      className="w-32 h-32 rounded-3xl border-4 border-blue-200 dark:border-blue-600 object-cover shadow-xl"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl animate-pulse"></div>
                    <div className="absolute -inset-2 border-2 border-blue-400 dark:border-blue-500 rounded-3xl border-dashed opacity-60 animate-spin" style={{animationDuration: '3s'}}></div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-center">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 dark:border-blue-700">
                    <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 animate-spin"></div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900 dark:to-purple-900 rounded-2xl p-6">
                <div className="flex items-center justify-center space-x-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                    <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                    <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Secure verification in progress</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <div className="inline-flex items-center space-x-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm px-6 py-3 rounded-2xl border border-white/30 dark:border-gray-700/30 shadow-lg">
            <span className="text-green-500">🔒</span>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Your privacy is protected. Images are not stored after authentication.
            </p>
            <span className="text-blue-500">✨</span>
          </div>
        </div>
      </div>
    </div>
  );
}
