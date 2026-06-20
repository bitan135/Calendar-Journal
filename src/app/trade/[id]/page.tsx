'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Edit, Trash2, Copy, TrendingUp, TrendingDown, ChevronRight, X, ImageIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/layout/page-header';
import { useTrade } from '@/lib/hooks/use-trades';
import { deleteTrade, duplicateTrade } from '@/lib/db/trades';
import { getImagesByTradeId, getImageUrl } from '@/lib/db/images';
import { TradeImage } from '@/lib/types';
import { formatCurrency, formatDateFull, formatTime, formatRR, getPnLColor } from '@/lib/utils/formatters';
import { SESSION_LABELS, ENTRY_MODEL_LABELS, NOTE_FIELDS } from '@/lib/utils/constants';
import { toast } from 'sonner';

export default function TradeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const tradeId = parseInt(id);
  const router = useRouter();
  const { trade, loading } = useTrade(tradeId);
  const [images, setImages] = useState<(TradeImage & { url: string })[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  useEffect(() => {
    if (tradeId) {
      getImagesByTradeId(tradeId).then((imgs) => {
        setImages(imgs.map((img) => ({ ...img, url: getImageUrl(img) })));
      });
    }
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.url));
    };
  }, [tradeId]);

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

  const handleDelete = async () => {
    await deleteTrade(tradeId);
    toast.success('Trade deleted');
    router.push(`/day/${trade.date}`);
  };

  const handleDuplicate = async () => {
    const newId = await duplicateTrade(tradeId);
    if (newId) {
      toast.success('Trade duplicated');
      router.push(`/trade/${newId}/edit`);
    }
  };

  const InfoRow = ({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) => (
    <div className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium ${mono ? 'font-mono-num' : ''}`}>{value}</span>
    </div>
  );

  const beforeImages = images.filter((img) => img.type === 'before_entry');
  const afterImages = images.filter((img) => img.type === 'after_trade');

  return (
    <>
      <PageHeader
        title={trade.asset}
        subtitle={formatDateFull(trade.date)}
        showBack
        backHref={`/day/${trade.date}`}
        actions={
          <div className="flex items-center gap-1">
            <button onClick={handleDuplicate} className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground" title="Duplicate">
              <Copy className="w-4 h-4" />
            </button>
            <button onClick={() => router.push(`/trade/${tradeId}/edit`)} className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground" title="Edit">
              <Edit className="w-4 h-4" />
            </button>
            <button onClick={() => setDeleteOpen(true)} className="p-2 rounded-lg hover:bg-red-500/10 text-red-400" title="Delete">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        }
      />

      <div className="px-4 lg:px-8 py-6 max-w-2xl mx-auto space-y-4">
        {/* P&L Hero */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`
            glass-card rounded-2xl p-6 text-center
            ${trade.profitLoss > 0 ? 'glow-profit' : trade.profitLoss < 0 ? 'glow-loss' : ''}
          `}
        >
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Profit / Loss</p>
          <p className={`text-3xl font-bold font-mono-num ${trade.profitLoss >= 0 ? 'text-gradient-profit' : 'text-gradient-loss'}`}>
            {formatCurrency(trade.profitLoss)}
          </p>
          <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${trade.direction === 'buy' ? 'bg-cyan-500/15 text-cyan-400' : 'bg-red-500/15 text-red-400'}`}>
              {trade.direction}
            </span>
            <span>RR {formatRR(trade.rrRatio)}</span>
            <span>{SESSION_LABELS[trade.session]}</span>
          </div>
        </motion.div>

        {/* Basic Info */}
        <div className="glass-card rounded-xl p-4">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Details</h3>
          <InfoRow label="Asset" value={trade.asset} />
          <InfoRow label="Direction" value={trade.direction.toUpperCase()} />
          <InfoRow label="Session" value={SESSION_LABELS[trade.session]} />
          <InfoRow label="Entry Time" value={formatTime(trade.entryTime)} />
          <InfoRow label="Exit Time" value={formatTime(trade.exitTime)} />
          <InfoRow label="Entry Model" value={ENTRY_MODEL_LABELS[trade.entryModel]} />
        </div>

        {/* Risk Management */}
        <div className="glass-card rounded-xl p-4">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Risk Management</h3>
          <InfoRow label="Lot Size" value={trade.lotSize.toString()} mono />
          <InfoRow label="Entry Price" value={trade.entryPrice.toString()} mono />
          <InfoRow label="Stop Loss" value={trade.stopLoss.toString()} mono />
          <InfoRow label="Take Profit" value={trade.takeProfit.toString()} mono />
          <InfoRow label="RR Ratio" value={formatRR(trade.rrRatio)} mono />
        </div>

        {/* Analysis */}
        <div className="glass-card rounded-xl p-4">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Analysis</h3>
          <InfoRow label="4H Bias" value={trade.bias4H?.charAt(0).toUpperCase() + trade.bias4H?.slice(1)} />
          <InfoRow label="1H Bias" value={trade.bias1H?.charAt(0).toUpperCase() + trade.bias1H?.slice(1)} />
          <InfoRow label="15M Bias" value={trade.bias15M?.charAt(0).toUpperCase() + trade.bias15M?.slice(1)} />
          <InfoRow label="Inducement" value={trade.inducementPresent ? 'Yes' : 'No'} />
          <InfoRow label="POI Type" value={trade.poiType === 'extreme' ? 'Extreme POI' : 'Decisional POI'} />
        </div>

        {/* Screenshots */}
        {images.length > 0 && (
          <div className="glass-card rounded-xl p-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Screenshots</h3>
            <div className="grid grid-cols-2 gap-3">
              {images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setViewerImage(img.url)}
                  className="relative rounded-xl overflow-hidden group cursor-pointer"
                >
                  <img src={img.url} alt={img.type} className="w-full h-32 object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 text-white" />
                  </div>
                  <span className="absolute bottom-1 left-1 text-[8px] px-1.5 py-0.5 rounded bg-black/60 text-white uppercase font-bold">
                    {img.type === 'before_entry' ? 'Before' : 'After'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {NOTE_FIELDS.some((f) => (trade as any)[f.key]?.trim()) && (
          <div className="glass-card rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Notes</h3>
            {NOTE_FIELDS.map((field) => {
              const value = (trade as any)[field.key];
              if (!value?.trim()) return null;
              return (
                <div key={field.key}>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 mb-1">{field.label}</p>
                  <p className="text-sm text-foreground/80 leading-relaxed">{value}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Full-screen Image Viewer */}
      {viewerImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setViewerImage(null)}
        >
          <button
            onClick={() => setViewerImage(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <img src={viewerImage} alt="Screenshot" className="max-w-full max-h-full object-contain rounded-lg" />
        </motion.div>
      )}

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="glass-strong">
          <DialogHeader>
            <DialogTitle>Delete Trade</DialogTitle>
            <DialogDescription>
              Are you sure? This will permanently delete this trade and its screenshots.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
