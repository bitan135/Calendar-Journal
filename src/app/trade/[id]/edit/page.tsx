'use client';

import { use } from 'react';
import PageHeader from '@/components/layout/page-header';
import TradeForm from '@/components/trade/trade-form';
import { useTrade } from '@/lib/hooks/use-trades';

export default function EditTradePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const tradeId = parseInt(id);
  const { trade, loading } = useTrade(tradeId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-shimmer w-full max-w-2xl mx-auto h-96 rounded-xl" />
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Trade not found.</p>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Edit Trade"
        subtitle={trade.asset}
        showBack
        backHref={`/trade/${tradeId}`}
      />
      <div className="px-4 lg:px-8 py-6">
        <TradeForm mode="edit" existingTrade={trade} />
      </div>
    </>
  );
}
