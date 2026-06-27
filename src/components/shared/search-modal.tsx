'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useSearchTrades } from '@/lib/hooks/use-trades';
import { formatCurrency, formatDate, getPnLColor } from '@/lib/utils/formatters';
import { SESSION_LABELS } from '@/lib/utils/constants';

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const { results, loading } = useSearchTrades(query);
  const router = useRouter();

  // Reset query when closed
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!open) setQuery('');
  }, [open]);

  const handleSelect = (tradeId: number) => {
    onOpenChange(false);
    router.push(`/trade/${tradeId}`);
  };

  // Group results by date
  const groupedResults = results.reduce((groups, trade) => {
    const date = trade.date;
    if (!groups[date]) groups[date] = [];
    groups[date].push(trade);
    return groups;
  }, {} as Record<string, typeof results>);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search trades by asset, notes, date..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {loading ? 'Searching...' : query ? 'No trades found.' : 'Type to search your trades...'}
        </CommandEmpty>

        {Object.entries(groupedResults).slice(0, 5).map(([date, trades]) => (
          <CommandGroup key={date} heading={formatDate(date)}>
            {trades.map((trade) => (
              <CommandItem
                key={trade.id}
                value={`${trade.asset}-${trade.id}`}
                onSelect={() => handleSelect(trade.id!)}
                className="flex items-center justify-between py-3 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    trade.profitLoss >= 0 ? 'bg-profit/10' : 'bg-loss/10'
                  }`}>
                    {trade.profitLoss >= 0 
                      ? <TrendingUp className="w-4 h-4 text-profit" />
                      : <TrendingDown className="w-4 h-4 text-loss" />
                    }
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground tracking-tight">{trade.asset}</p>
                    <p className="text-[10px] text-muted-foreground/60 font-medium">
                      {trade.direction.toUpperCase()} • {SESSION_LABELS[trade.session]}
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-mono-num font-semibold ${getPnLColor(trade.profitLoss)}`}>
                  {formatCurrency(trade.profitLoss)}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
