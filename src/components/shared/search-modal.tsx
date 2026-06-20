'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Search, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { useSearchTrades } from '@/lib/hooks/use-trades';
import { formatCurrency, formatDate, getPnLColor } from '@/lib/utils/formatters';
import { SESSION_LABELS, ENTRY_MODEL_LABELS } from '@/lib/utils/constants';

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
                    trade.profitLoss >= 0 ? 'bg-cyan-500/15' : 'bg-red-500/15'
                  }`}>
                    {trade.profitLoss >= 0 
                      ? <TrendingUp className="w-4 h-4 text-cyan-400" />
                      : <TrendingDown className="w-4 h-4 text-red-400" />
                    }
                  </div>
                  <div>
                    <p className="text-sm font-medium">{trade.asset}</p>
                    <p className="text-xs text-muted-foreground">
                      {trade.direction.toUpperCase()} • {SESSION_LABELS[trade.session]}
                    </p>
                  </div>
                </div>
                <span className={`text-sm font-mono-num font-semibold ${getPnLColor(trade.profitLoss)}`}>
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
