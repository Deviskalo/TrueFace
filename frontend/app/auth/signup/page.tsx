"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import CameraCapture from "../../../components/CameraCapture";
import { useApi } from "../../../hooks/useApi";
import ThemeToggle from "../../components/ThemeToggle";

export default function SignupPage() {
  const router = useRouter();
  const { signup, isLoading, error, clearError } = useApi();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });
  const [capturedImage, setCapturedImage] = useState<{
    src: string;
    blob: Blob;
  } | null>(null);
  const [currentStep, setCurrentStep] = useState<"form" | "camera" | "review">(
    "form"
  );
  const [success, setSuccess] = useState(false);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email) {
      setCurrentStep("camera");
      clearError();
    }
  };

  const handleCapture = (imageSrc: string, imageBlob: Blob) => {
    setCapturedImage({ src: imageSrc, blob: imageBlob });
    setCurrentStep("review");
  };

  const handleRetakePhoto = () => {
    setCapturedImage(null);
    setCurrentStep("camera");
  };

  const handleSubmitSignup = async () => {
    if (!capturedImage) return;

    const result = await signup(
      formData.name,
      formData.email,
      capturedImage.blob
    );

    if (result) {
      // Store token in localStorage (you might want to use a more secure method)
      localStorage.setItem("truface_token", result.token);
      localStorage.setItem("truface_user_id", result.user_id);
      setSuccess(true);

      // Redirect to dashboard after a brief success message
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    }
  };

  const handleBackToForm = () => {
    setCurrentStep("form");
    setCapturedImage(null);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900 dark:to-blue-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-green-800 dark:text-green-400 mb-4">
            Registration Successful!
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Welcome to TrueFace, {formData.name}! You can now log in using your
            face.
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 dark:border-green-400 border-t-transparent mx-auto"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-pink-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Theme Toggle */}
        <div className="flex justify-end mb-6">
          <ThemeToggle />
        </div>
        
        {/* Logo Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-3 mb-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-2xl text-white">👤</span>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white dark:border-gray-800"></div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
              TrueFace
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Join the future of passwordless authentication
          </p>
        </div>

        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 overflow-hidden">
          {/* Progress indicator */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
            <div className="flex justify-center">
              <div className="flex items-center space-x-8">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    currentStep === "form"
                      ? "bg-white text-blue-600 shadow-lg scale-110"
                      : ["camera", "review"].includes(currentStep)
                      ? "bg-blue-300/50 text-white"
                      : "bg-blue-500/30 text-blue-200"
                  }`}>
                    {currentStep !== "form" && ["camera", "review"].includes(currentStep) ? "✓" : "1"}
                  </div>
                  <span className="text-white font-medium">Details</span>
                </div>
                <div className={`h-0.5 w-16 transition-all duration-500 ${
                  ["camera", "review"].includes(currentStep) ? "bg-white/80" : "bg-white/30"
                }`}></div>
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    currentStep === "camera"
                      ? "bg-white text-blue-600 shadow-lg scale-110"
                      : currentStep === "review"
                      ? "bg-blue-300/50 text-white"
                      : "bg-blue-500/30 text-blue-200"
                  }`}>
                    {currentStep === "review" ? "✓" : currentStep === "camera" ? "📷" : "2"}
                  </div>
                  <span className="text-white font-medium">Face Scan</span>
                </div>
                <div className={`h-0.5 w-16 transition-all duration-500 ${
                  currentStep === "review" ? "bg-white/80" : "bg-white/30"
                }`}></div>
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    currentStep === "review"
                      ? "bg-white text-blue-600 shadow-lg scale-110"
                      : "bg-blue-500/30 text-blue-200"
                  }`}>
                    {currentStep === "review" ? "🎯" : "3"}
                  </div>
                  <span className="text-white font-medium">Complete</span>
                </div>
              </div>
            </div>
          </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg">
              <p className="text-red-800 dark:text-red-200">{error}</p>
              <button
                onClick={clearError}
                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm mt-2 underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {currentStep === "form" && (
            <div className="space-y-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl mb-4">
                  <span className="text-2xl text-white">✏️</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Let&apos;s Get Started
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Tell us a bit about yourself to create your secure account
                </p>
              </div>
              
              <form onSubmit={handleFormSubmit} className="space-y-6">
                <div className="space-y-6">
                  <div className="group">
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <input
                        id="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 group-hover:border-gray-300 dark:group-hover:border-gray-500 text-gray-900 dark:text-gray-100"
                        placeholder="Enter your full name"
                      />
                      <div className="absolute right-4 top-4 text-gray-400 dark:text-gray-500">
                        <span className="text-lg">👤</span>
                      </div>
                    </div>
                  </div>

                  <div className="group">
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        id="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 group-hover:border-gray-300 dark:group-hover:border-gray-500 text-gray-900 dark:text-gray-100"
                        placeholder="Enter your email address"
                      />
                      <div className="absolute right-4 top-4 text-gray-400 dark:text-gray-500">
                        <span className="text-lg">📧</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 active:scale-[0.98]"
                  >
                    Continue to Face Capture 📸
                  </button>
                </div>

                <div className="text-center pt-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Already have an account?{' '}
                    <a href="/auth/login" className="font-semibold text-blue-600 dark:text-blue-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                      Sign in here
                    </a>
                  </p>
                </div>
              </form>
            </div>
          )}

          {currentStep === "camera" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  Step 2: Capture Your Face
                </h2>
                <button
                  onClick={handleBackToForm}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                >
                  ← Back to Form
                </button>
              </div>

              <div className="text-center">
                <CameraCapture
                  onCapture={handleCapture}
                  onError={(error) => console.error("Camera error:", error)}
                  className="mx-auto"
                />
              </div>
            </div>
          )}

          {currentStep === "review" && capturedImage && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  Step 3: Review & Submit
                </h2>
                <button
                  onClick={handleRetakePhoto}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                >
                  ← Retake Photo
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* User Info */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                    Your Information
                  </h3>
                  <div className="space-y-3 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-600 dark:text-gray-300">Name:</span>
                      <span className="ml-2 text-gray-900 dark:text-gray-100">{formData.name}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600 dark:text-gray-300">Email:</span>
                      <span className="ml-2 text-gray-900 dark:text-gray-100">{formData.email}</span>
                    </div>
                  </div>
                </div>

                {/* Captured Photo */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                    Your Face Photo
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <Image
                      src={capturedImage.src}
                      alt="Your captured face"
                      width={320}
                      height={192}
                      className="w-full h-48 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-600"
                      unoptimized
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <div className="text-sm text-gray-600 dark:text-gray-300 bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                  <p className="mb-2">
                    <strong>Privacy Notice:</strong>
                  </p>
                  <p>
                    Your face image will be processed to create a secure digital
                    signature (embedding) and then discarded. Only the digital
                    signature is stored, not your actual photo.
                  </p>
                </div>

                <button
                  onClick={handleSubmitSignup}
                  disabled={isLoading}
                  className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>🚀</span>
                      <span>Create My Account</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
