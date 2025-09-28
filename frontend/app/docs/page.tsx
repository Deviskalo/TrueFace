import DocsLayout from '@/components/DocsLayout';
import Link from 'next/link';
import { 
  RocketLaunchIcon, 
  CodeBracketIcon, 
  CubeIcon, 
  CloudIcon,
  WrenchScrewdriverIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';

const features = [
  {
    title: 'Face Recognition',
    description: 'State-of-the-art ML models for accurate and secure face recognition authentication.',
    icon: CodeBracketIcon,
  },
  {
    title: 'Modern UI',
    description: 'Beautiful, responsive interface built with Next.js, React, and Tailwind CSS.',
    icon: CubeIcon,
  },
  {
    title: 'Production Ready',
    description: 'Docker deployment, monitoring, security hardening, and operational tools included.',
    icon: CloudIcon,
  },
  {
    title: 'Developer Friendly',
    description: 'Comprehensive APIs, TypeScript support, and extensive documentation.',
    icon: WrenchScrewdriverIcon,
  },
];

const quickLinks = [
  {
    title: 'Getting Started',
    description: 'Learn how to install and set up TrueFace in your environment.',
    href: '/docs/getting-started',
    icon: RocketLaunchIcon,
  },
  {
    title: 'API Reference',
    description: 'Complete API documentation with examples and code samples.',
    href: '/docs/api-reference',
    icon: CodeBracketIcon,
  },
  {
    title: 'Components',
    description: 'Frontend component documentation and usage examples.',
    href: '/docs/components',
    icon: CubeIcon,
  },
  {
    title: 'Deployment',
    description: 'Production deployment guides and configuration options.',
    href: '/docs/deployment',
    icon: CloudIcon,
  },
  {
    title: 'Troubleshooting',
    description: 'Common issues and their solutions.',
    href: '/docs/troubleshooting',
    icon: WrenchScrewdriverIcon,
  },
];

export default function DocsPage() {
  return (
    <DocsLayout
      title="TrueFace Documentation"
      description="Learn how to build secure face recognition authentication with TrueFace"
    >
      <div className="not-prose mb-8">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 mb-12">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to TrueFace
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              TrueFace is a modern face recognition authentication platform that provides secure, 
              passwordless authentication using cutting-edge machine learning technology.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/docs/getting-started"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Get Started
              </Link>
              <Link
                href="/docs/api-reference"
                className="bg-white text-gray-700 px-6 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors font-medium"
              >
                API Reference
              </Link>
            </div>
          </div>
        </div>

        {/* Key Features */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-3">
                  <feature.icon className="w-6 h-6 text-blue-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                </div>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Start */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Start</h2>
          <div className="bg-gray-50 rounded-lg p-6">
            <p className="text-gray-700 mb-4">
              Get TrueFace running in under 5 minutes with our development mode:
            </p>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-md font-mono text-sm overflow-x-auto">
              <div className="mb-2"># Clone the repository</div>
              <div className="mb-2">git clone &lt;repository-url&gt;</div>
              <div className="mb-2">cd TrueFace</div>
              <div className="mb-4"></div>
              <div className="mb-2"># Start backend (terminal 1)</div>
              <div className="mb-2">cd backend && DEV_MODE_NO_DB=true uvicorn main:app --reload</div>
              <div className="mb-4"></div>
              <div className="mb-2"># Start frontend (terminal 2)</div>
              <div className="mb-2">cd frontend && npm run dev</div>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              Visit <code className="bg-gray-200 px-2 py-1 rounded text-sm">http://localhost:3000</code> to see TrueFace in action!
            </p>
          </div>
        </section>

        {/* Documentation Sections */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Documentation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all hover:border-blue-200 group"
              >
                <div className="flex items-center mb-3">
                  <link.icon className="w-6 h-6 text-blue-600 mr-3 group-hover:text-blue-700" />
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-900">
                    {link.title}
                  </h3>
                </div>
                <p className="text-gray-600 group-hover:text-gray-700">{link.description}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Architecture Overview */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Architecture</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <p className="text-gray-700 mb-4">
              TrueFace follows a modern, scalable architecture with clear separation of concerns:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Frontend</h4>
                <p className="text-sm text-blue-700">Next.js, React, TypeScript</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-2">Backend</h4>
                <p className="text-sm text-green-700">FastAPI, Python, ML Models</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <h4 className="font-semibold text-purple-900 mb-2">Database</h4>
                <p className="text-sm text-purple-700">MongoDB, Redis</p>
              </div>
            </div>
          </div>
        </section>

        {/* Community & Support */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Community & Support</h2>
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Need Help?</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Check the <Link href="/docs/troubleshooting" className="text-blue-600 hover:underline">troubleshooting guide</Link></li>
                  <li>• Review our <Link href="/docs/api-reference" className="text-blue-600 hover:underline">API documentation</Link></li>
                  <li>• Search existing GitHub issues</li>
                  <li>• Create a new issue with detailed information</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Contributing</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• 🐛 Report bugs and issues</li>
                  <li>• 💡 Suggest new features</li>
                  <li>• 🔧 Submit pull requests</li>
                  <li>• 📚 Improve documentation</li>
                  <li>• 💬 Help other users</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
    </DocsLayout>
  );
}
