'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays,
  BarChart3,
  Settings,
} from 'lucide-react';

// ============================================================================
// Navigation Items
// ============================================================================

const NAV_ITEMS = [
  { href: '/', label: 'Calendar', icon: CalendarDays },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

// ============================================================================
// App Shell
// ============================================================================

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-[100dvh] w-full">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-[240px] fixed top-0 left-0 h-full z-40 bg-sidebar border-r border-sidebar-border">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-sidebar-border">
          <img src="/icons/icon-192.png" alt="SMC Journal Logo" className="w-8 h-8 rounded-lg border border-border shadow-sm" />
          <div>
            <h1 className="font-semibold text-sm tracking-tight text-foreground">SMC Journal</h1>
            <p className="text-[10px] text-muted-foreground/60 tracking-wider uppercase font-medium">Trading Terminal</p>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                  transition-all duration-150
                  ${isActive
                    ? 'text-primary-foreground bg-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }
                `}
              >
                <item.icon className="w-[18px] h-[18px] shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom info */}
        <div className="px-6 py-4 border-t border-sidebar-border">
          <p className="text-[10px] text-muted-foreground/40 font-mono">v1.0.0 • Local Only</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-[240px] w-full pb-[90px] lg:pb-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass-nav pb-safe border-t border-border">
        <div className="flex items-center justify-around px-2 py-1.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  relative flex flex-col items-center gap-0.5 py-1 px-4 rounded-xl
                  transition-all duration-150 min-w-[64px]
                  ${isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                  }
                `}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[9px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
