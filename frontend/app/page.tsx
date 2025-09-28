import Link from "next/link";
import ThemeToggle from '@/app/components/ThemeToggle';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">👤</span>
              <span className="text-xl font-bold text-gray-900 dark:text-gray-100">TrueFace</span>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle size="sm" />
              <Link
                href="/auth/signup"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Sign Up
              </Link>
              <Link
                href="/auth/login"
                className="text-blue-600 border border-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Welcome to the Future of
            <span className="text-blue-600 dark:text-blue-400 block">Passwordless Authentication</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            TrueFace uses advanced facial recognition technology to provide secure, 
            convenient authentication. No more forgotten passwords – just look at the camera and you're in.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <span>🚀</span>
              <span>Get Started Free</span>
            </Link>
            <button className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Watch Demo
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">Secure Authentication</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Advanced facial recognition technology ensures only you can access your account. 
              Your biometric data is encrypted and stored as secure digital signatures.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">Lightning Fast</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Log in instantly with just a glance. No typing passwords, no remembering 
              complex combinations – authentication in under 2 seconds.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-4xl mb-4">🛡️</div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">Privacy First</h3>
            <p className="text-gray-600 dark:text-gray-300">
              We don't store your photos. Only mathematical representations 
              (embeddings) are kept, ensuring your privacy while maintaining security.
            </p>
          </div>
        </div>

        {/* How it Works */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-12">
            How TrueFace Works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 dark:bg-blue-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📷</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">1. Capture Your Face</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Take a quick photo using your device's camera during registration.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-100 dark:bg-blue-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🧠</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">2. AI Processing</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Our AI creates a unique digital signature from your facial features.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-100 dark:bg-blue-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✅</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">3. Instant Access</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Log in instantly by looking at the camera – no passwords needed!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
