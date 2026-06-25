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
    <div className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0 text-xs">
      <span className="text-muted-foreground/70 font-medium">{label}</span>
      <span className={`font-semibold text-foreground ${mono ? 'font-mono-num' : ''}`}>{value}</span>
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
          <div className="flex items-center gap-1.5">
            <button 
              onClick={handleDuplicate} 
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-all active:scale-95 cursor-pointer" 
              title="Duplicate"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button 
              onClick={() => router.push(`/trade/${tradeId}/edit`)} 
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-all active:scale-95 cursor-pointer" 
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setDeleteOpen(true)} 
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-loss/10 text-loss transition-all active:scale-95 cursor-pointer" 
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        }
      />

      <div className="px-4 lg:px-8 py-6 max-w-2xl mx-auto space-y-4">
        {/* P&L Hero */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`
            glass-card rounded-xl p-6 text-center border border-white/5 shadow-sm
            ${trade.profitLoss > 0 ? 'glow-profit' : trade.profitLoss < 0 ? 'glow-loss' : ''}
          `}
        >
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground/60 mb-2 font-medium">Profit / Loss</p>
          <p className={`text-2xl lg:text-3xl font-extrabold font-mono-num tracking-tight ${trade.profitLoss >= 0 ? 'text-profit' : 'text-loss'}`}>
            {formatCurrency(trade.profitLoss)}
          </p>
          <div className="flex items-center justify-center gap-3.5 mt-3.5 text-xs text-muted-foreground/80 font-medium">
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase ${trade.direction === 'buy' ? 'bg-profit/10 text-profit' : 'bg-loss/10 text-loss'}`}>
              {trade.direction}
            </span>
            <span>RR {formatRR(trade.rrRatio)}</span>
            <span>{SESSION_LABELS[trade.session]}</span>
          </div>
        </motion.div>

        {/* Basic Info */}
        <div className="glass-card rounded-xl p-4 border border-white/5 shadow-sm">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2.5">Details</h3>
          <InfoRow label="Asset" value={trade.asset} />
          <InfoRow label="Direction" value={trade.direction.toUpperCase()} />
          <InfoRow label="Session" value={SESSION_LABELS[trade.session]} />
          <InfoRow label="Entry Time" value={formatTime(trade.entryTime)} />
          <InfoRow label="Exit Time" value={formatTime(trade.exitTime)} />
          <InfoRow label="Entry Model" value={ENTRY_MODEL_LABELS[trade.entryModel]} />
        </div>

        {/* Risk Management */}
        <div className="glass-card rounded-xl p-4 border border-white/5 shadow-sm">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2.5">Risk Management</h3>
          <InfoRow label="Lot Size" value={trade.lotSize.toString()} mono />
          <InfoRow label="Entry Price" value={trade.entryPrice.toString()} mono />
          <InfoRow label="Stop Loss" value={trade.stopLoss.toString()} mono />
          <InfoRow label="Take Profit" value={trade.takeProfit.toString()} mono />
          <InfoRow label="RR Ratio" value={formatRR(trade.rrRatio)} mono />
        </div>

        {/* Analysis */}
        <div className="glass-card rounded-xl p-4 border border-white/5 shadow-sm">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2.5">Analysis</h3>
          <InfoRow label="4H Bias" value={trade.bias4H?.charAt(0).toUpperCase() + trade.bias4H?.slice(1)} />
          <InfoRow label="1H Bias" value={trade.bias1H?.charAt(0).toUpperCase() + trade.bias1H?.slice(1)} />
          <InfoRow label="15M Bias" value={trade.bias15M?.charAt(0).toUpperCase() + trade.bias15M?.slice(1)} />
          <InfoRow label="Inducement" value={trade.inducementPresent ? 'Yes' : 'No'} />
          <InfoRow label="POI Type" value={trade.poiType === 'extreme' ? 'Extreme POI' : 'Decisional POI'} />
        </div>

        {/* Screenshots */}
        {images.length > 0 && (
          <div className="glass-card rounded-xl p-4 border border-white/5 shadow-sm">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-3">Screenshots</h3>
            <div className="grid grid-cols-2 gap-3.5">
              {images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setViewerImage(img.url)}
                  className="relative rounded-lg overflow-hidden group cursor-pointer border border-white/5 hover:border-white/15 transition-all shadow-sm"
                >
                  <img src={img.url} alt={img.type} className="w-full h-32 object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ImageIcon className="w-4 h-4 text-white" />
                  </div>
                  <span className="absolute bottom-1.5 left-1.5 text-[7px] px-1 py-0.5 rounded bg-black/75 text-white uppercase font-bold tracking-wider">
                    {img.type === 'before_entry' ? 'Before' : 'After'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {NOTE_FIELDS.some((f) => (trade as any)[f.key]?.trim()) && (
          <div className="glass-card rounded-xl p-4 space-y-4 border border-white/5 shadow-sm">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2.5">Notes</h3>
            {NOTE_FIELDS.map((field) => {
              const value = (trade as any)[field.key];
              if (!value?.trim()) return null;
              return (
                <div key={field.key} className="space-y-1">
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/50">{field.label}</p>
                  <div className="bg-[#2c2c2e]/40 border border-white/5 rounded-lg p-3 text-xs text-foreground/90 leading-relaxed">
                    {value}
                  </div>
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
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setViewerImage(null)}
        >
          <button
            onClick={() => setViewerImage(null)}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
          >
            <X className="w-4 h-4 text-white" />
          </button>
          <img src={viewerImage} alt="Screenshot" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl border border-white/5 animate-float" />
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
