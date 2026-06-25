'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  backHref?: string;
  actions?: React.ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  showBack = false,
  backHref,
  actions,
}: PageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="sticky top-0 z-30 glass-nav px-4 lg:px-8 pt-safe pb-3.5"
    >
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={handleBack}
              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white/5 transition-all active:scale-95 cursor-pointer"
              aria-label="Go back"
            >
              <ArrowLeft className="w-4.5 h-4.5 text-muted-foreground hover:text-foreground" />
            </button>
          )}
          <div>
            <h1 className="text-base font-semibold tracking-[-0.015em] text-foreground">{title}</h1>
            {subtitle && (
              <p className="text-[11px] text-muted-foreground/80 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </motion.header>
  );
}
