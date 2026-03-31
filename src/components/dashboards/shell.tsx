'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, LogOut, Settings, LayoutDashboard, FileText, FolderOpen, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/store/ui-store';

interface DashboardShellProps {
  children: ReactNode;
  user: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
}

/**
 * Main dashboard shell component
 * Provides sidebar, header, and layout for dashboard pages
 */
export default function DashboardShell({ children, user }: DashboardShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  
  // Only access store after hydration to prevent mismatch
  const notifications = useUIStore((state) => state.notifications);
  const hasNotifications = mounted && notifications.length > 0;

  useEffect(() => {
    setMounted(true);
  }, []);

  const navigationItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      active: pathname === '/dashboard',
    },
    {
      label: 'Projects',
      href: '/dashboard/projects',
      icon: FolderOpen,
      active: pathname.startsWith('/dashboard/projects'),
    },
    {
      label: 'Specifications',
      href: '/dashboard/specs',
      icon: FileText,
      active: pathname.startsWith('/dashboard/specs'),
    },
    {
      label: 'Settings',
      href: '/dashboard/settings',
      icon: Settings,
      active: pathname.startsWith('/dashboard/settings'),
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#FFF8F0]">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 transform border-r border-[#E0DCD4] bg-white/95 backdrop-blur-sm transition-all duration-300 ease-in-out shadow-xl',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-6 py-6 bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] border-b border-white/20">
            <Link href="/" className="block">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-white rounded-xl shadow-lg flex items-center justify-center transform hover:scale-105 transition-transform p-1.5">
                  <img src="/logos/favicon-96x96.png" alt="SeqForge" className="w-full h-full" />
                </div>
                <div>
                  <span className="text-white text-lg font-semibold block leading-tight" style={{ fontFamily: 'var(--font-ibm-plex-mono)' }}>SeqForge</span>
                  <span className="text-[11px] uppercase tracking-widest text-white/90 block">Portal</span>
                </div>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'group relative flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-250 rounded-xl',
                    item.active
                      ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] text-white shadow-lg shadow-orange-200'
                      : 'text-[#2A2A2A] hover:bg-[#FFF8F0] hover:shadow-md'
                  )}
                  style={{ fontFamily: 'var(--font-ibm-plex-mono)' }}
                >
                  <Icon className={cn("h-5 w-5 transition-transform group-hover:scale-110", item.active ? "text-white" : "text-[#FF6B35]")} />
                  <span>{item.label}</span>
                  {item.active && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-sm"></div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-[#E0DCD4] p-5 bg-gradient-to-b from-[#F4F1EA] to-[#FFF8F0] space-y-3">
            <div className="flex items-center gap-3 px-2">
              <div className="relative">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF8C42] flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-400 border-2 border-white rounded-full"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#2A2A2A] truncate" style={{ fontFamily: 'var(--font-ibm-plex-mono)' }}>
                  {user.username}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.location.href = '/api/auth/logout';
              }}
              className="w-full border border-[#E0DCD4] hover:bg-[#2A2A2A] hover:text-white hover:border-[#2A2A2A] transition-all duration-200 text-xs font-medium rounded-lg"
              style={{ fontFamily: 'var(--font-ibm-plex-mono)' }}
            >
              <LogOut className="h-3.5 w-3.5 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={cn("flex-1 transition-all duration-300", sidebarOpen ? "ml-64" : "ml-0")}>
        {/* Top header */}
        <header className="sticky top-0 z-40 border-b border-[#E0DCD4] bg-white/80 backdrop-blur-md shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="inline-flex items-center justify-center p-2.5 text-[#2A2A2A] hover:bg-[#F4F1EA] transition-all duration-200 rounded-lg border border-[#E0DCD4] hover:shadow-md"
            >
              {sidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>

            <div className="flex items-center gap-3">
              {/* Notifications bell */}
              <button className="relative p-2.5 text-[#2A2A2A] border border-[#E0DCD4] hover:bg-[#F4F1EA] transition-all duration-200 rounded-lg hover:shadow-md">
                <Bell className="h-5 w-5" />
                {hasNotifications && (
                  <span className="absolute top-1 right-1 h-2 w-2 bg-[#FF6B35] border-2 border-white rounded-full animate-pulse" />
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="relative gradient-mesh noise-texture paper-texture">
          <div className="px-6 py-10 lg:px-12 min-h-screen">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
