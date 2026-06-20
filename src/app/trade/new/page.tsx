'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import PageHeader from '@/components/layout/page-header';
import TradeForm from '@/components/trade/trade-form';

function NewTradeContent() {
  const searchParams = useSearchParams();
  const date = searchParams.get('date') || undefined;

  return (
    <>
      <PageHeader title="Log Trade" subtitle="Record your trade details" showBack />
      <div className="px-4 lg:px-8 py-6">
        <TradeForm mode="create" initialDate={date} />
      </div>
    </>
  );
}

export default function NewTradePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><div className="animate-shimmer w-full max-w-2xl mx-auto h-96 rounded-xl" /></div>}>
      <NewTradeContent />
    </Suspense>
  );
}
