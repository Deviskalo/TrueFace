'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDownIcon, ChevronRightIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

interface NavItem {
  title: string;
  href: string;
  children?: NavItem[];
}

const navigation: NavItem[] = [
  {
    title: 'Getting Started',
    href: '/docs',
    children: [
      { title: 'Introduction', href: '/docs' },
      { title: 'Installation', href: '/docs/getting-started' },
      { title: 'Quick Start', href: '/docs/quick-start' },
    ],
  },
  {
    title: 'API Reference',
    href: '/docs/api-reference',
    children: [
      { title: 'Authentication', href: '/docs/api-reference/auth' },
      { title: 'User Management', href: '/docs/api-reference/users' },
      { title: 'Face Processing', href: '/docs/api-reference/face' },
      { title: 'Admin', href: '/docs/api-reference/admin' },
    ],
  },
  {
    title: 'Components',
    href: '/docs/components',
    children: [
      { title: 'CameraCapture', href: '/docs/components/camera-capture' },
      { title: 'AuthLayout', href: '/docs/components/auth-layout' },
      { title: 'API Hooks', href: '/docs/components/api-hooks' },
    ],
  },
  {
    title: 'Deployment',
    href: '/docs/deployment',
    children: [
      { title: 'Docker Setup', href: '/docs/deployment/docker' },
      { title: 'Environment Config', href: '/docs/deployment/environment' },
      { title: 'Production', href: '/docs/deployment/production' },
    ],
  },
  {
    title: 'Troubleshooting',
    href: '/docs/troubleshooting',
  },
];

interface NavItemComponentProps {
  item: NavItem;
  pathname: string;
  level?: number;
}

function NavItemComponent({ item, pathname, level = 0 }: NavItemComponentProps) {
  const [isOpen, setIsOpen] = useState(
    pathname.startsWith(item.href) || 
    item.children?.some(child => pathname.startsWith(child.href))
  );
  
  const isActive = pathname === item.href;
  const hasChildren = item.children && item.children.length > 0;

  return (
    <li>
      <div className="flex items-center">
        <Link
          href={item.href}
          className={`flex-1 block px-3 py-2 text-sm rounded-lg transition-colors ${
            isActive
              ? 'bg-blue-50 text-blue-700 font-medium'
              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
          } ${level > 0 ? 'ml-4' : ''}`}
        >
          {item.title}
        </Link>
        {hasChildren && (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            {isOpen ? (
              <ChevronDownIcon className="w-4 h-4" />
            ) : (
              <ChevronRightIcon className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
      {hasChildren && isOpen && (
        <ul className="mt-1 space-y-1">
          {item.children?.map((child) => (
            <NavItemComponent
              key={child.href}
              item={child}
              pathname={pathname}
              level={level + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

interface DocsLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export default function DocsLayout({ children, title, description }: DocsLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black/20" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
          <div className="flex items-center justify-between p-4 border-b">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">TF</span>
              </div>
              <span className="font-semibold text-gray-900">TrueFace</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          <nav className="p-4">
            <ul className="space-y-1">
              {navigation.map((item) => (
                <NavItemComponent key={item.href} item={item} pathname={pathname} />
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="lg:flex">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
          <div className="flex flex-col flex-1 bg-white border-r border-gray-200">
            <div className="flex items-center p-4 border-b">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">TF</span>
                </div>
                <span className="font-semibold text-gray-900">TrueFace</span>
              </Link>
            </div>
            <nav className="flex-1 p-4 overflow-y-auto">
              <ul className="space-y-1">
                {navigation.map((item) => (
                  <NavItemComponent key={item.href} item={item} pathname={pathname} />
                ))}
              </ul>
            </nav>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:pl-64 flex-1">
          {/* Top header */}
          <header className="bg-white border-b border-gray-200 lg:border-none">
            <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-1 text-gray-400 hover:text-gray-600 lg:hidden"
                >
                  <Bars3Icon className="w-5 h-5" />
                </button>
                <div>
                  {title && <h1 className="text-2xl font-bold text-gray-900">{title}</h1>}
                  {description && <p className="text-gray-600 mt-1">{description}</p>}
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  href="/dashboard"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/"
                  className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Back to App
                </Link>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="px-4 py-8 sm:px-6 lg:px-8 max-w-4xl">
            <div className="prose prose-blue max-w-none">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
