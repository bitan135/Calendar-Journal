'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Save, ChevronDown, ChevronUp, Upload, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trade, TradeImage as TradeImageType, ImageType } from '@/lib/types';
import { addTrade, updateTrade } from '@/lib/db/trades';
import { addImage, getImagesByTradeId, deleteImage, getImageUrl } from '@/lib/db/images';
import { calculateRR } from '@/lib/utils/calculations';
import { DEFAULT_ASSETS, SESSIONS, BIAS_OPTIONS, INTRADAY_BIAS_OPTIONS, POI_TYPES, ENTRY_MODELS, NOTE_FIELDS, DIRECTIONS } from '@/lib/utils/constants';

// ============================================================================
// Types
// ============================================================================

interface TradeFormProps {
  mode: 'create' | 'edit';
  initialDate?: string;
  existingTrade?: Trade;
}

interface FormData {
  asset: string;
  direction: 'buy' | 'sell';
  date: string;
  entryTime: string;
  exitTime: string;
  session: string;
  lotSize: string;
  entryPrice: string;
  stopLoss: string;
  takeProfit: string;
  rrRatio: string;
  profitLoss: string;
  bias4H: string;
  bias1H: string;
  bias15M: string;
  inducementPresent: boolean;
  poiType: string;
  entryModel: string;
  tradeReasoning: string;
  marketNarrative: string;
  sessionObservation: string;
  mistakeMade: string;
  lessonLearned: string;
  emotionalState: string;
  importantNote: string;
}

// ============================================================================
// Collapsible Section
// ============================================================================

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold hover:bg-white/[0.02] transition-colors"
      >
        <span>{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        <div className="px-4 pb-5 space-y-5">
          {children}
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================================
// Trade Form
// ============================================================================

export default function TradeForm({ mode, initialDate, existingTrade }: TradeFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<{ file?: File; existing?: TradeImageType; type: ImageType; preview: string }[]>([]);

  const defaultDate = initialDate || existingTrade?.date || new Date().toISOString().split('T')[0];

  const [form, setForm] = useState<FormData>({
    asset: existingTrade?.asset || '',
    direction: existingTrade?.direction || 'buy',
    date: defaultDate,
    entryTime: existingTrade?.entryTime || '',
    exitTime: existingTrade?.exitTime || '',
    session: existingTrade?.session || 'london',
    lotSize: existingTrade?.lotSize?.toString() || '0.01',
    entryPrice: existingTrade?.entryPrice?.toString() || '',
    stopLoss: existingTrade?.stopLoss?.toString() || '',
    takeProfit: existingTrade?.takeProfit?.toString() || '',
    rrRatio: existingTrade?.rrRatio?.toString() || '0',
    profitLoss: existingTrade?.profitLoss?.toString() || '0',
    bias4H: existingTrade?.bias4H || 'bullish',
    bias1H: existingTrade?.bias1H || 'bullish',
    bias15M: existingTrade?.bias15M || 'continuation',
    inducementPresent: existingTrade?.inducementPresent || false,
    poiType: existingTrade?.poiType || 'extreme',
    entryModel: existingTrade?.entryModel || 'two_leg_protocol',
    tradeReasoning: existingTrade?.tradeReasoning || '',
    marketNarrative: existingTrade?.marketNarrative || '',
    sessionObservation: existingTrade?.sessionObservation || '',
    mistakeMade: existingTrade?.mistakeMade || '',
    lessonLearned: existingTrade?.lessonLearned || '',
    emotionalState: existingTrade?.emotionalState || '',
    importantNote: existingTrade?.importantNote || '',
  });

  // Load existing images
  useEffect(() => {
    if (mode === 'edit' && existingTrade?.id) {
      getImagesByTradeId(existingTrade.id).then((imgs) => {
        setImages(
          imgs.map((img) => ({
            existing: img,
            type: img.type,
            preview: getImageUrl(img),
          }))
        );
      });
    }
  }, [mode, existingTrade?.id]);

  // Auto-calculate RR
  useEffect(() => {
    const entry = parseFloat(form.entryPrice);
    const sl = parseFloat(form.stopLoss);
    const tp = parseFloat(form.takeProfit);

    if (!isNaN(entry) && !isNaN(sl) && !isNaN(tp) && entry > 0 && sl > 0 && tp > 0) {
      const rr = calculateRR(entry, sl, tp);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm((prev) => ({ ...prev, rrRatio: rr.toString() }));
    }
  }, [form.entryPrice, form.stopLoss, form.takeProfit]);

  const updateField = (field: keyof FormData, value: string | boolean | null) => {
    setForm((prev) => ({ ...prev, [field]: value ?? '' }));
  };

  const handleImageUpload = (type: ImageType) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const preview = URL.createObjectURL(file);
        setImages((prev) => [...prev, { file, type, preview }]);
      }
    };
    input.click();
  };

  const removeImage = async (index: number) => {
    const img = images[index];
    if (img.existing?.id) {
      await deleteImage(img.existing.id);
    }
    if (img.preview) URL.revokeObjectURL(img.preview);
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!form.asset.trim()) {
      toast.error('Please enter an asset');
      return;
    }

    setSaving(true);
    try {
      const tradeData = {
        asset: form.asset.toUpperCase().trim(),
        direction: form.direction as 'buy' | 'sell',
        date: form.date,
        entryTime: form.entryTime,
        exitTime: form.exitTime,
        session: form.session as Trade['session'],
        lotSize: parseFloat(form.lotSize) || 0.01,
        entryPrice: parseFloat(form.entryPrice) || 0,
        stopLoss: parseFloat(form.stopLoss) || 0,
        takeProfit: parseFloat(form.takeProfit) || 0,
        rrRatio: parseFloat(form.rrRatio) || 0,
        profitLoss: parseFloat(form.profitLoss) || 0,
        bias4H: form.bias4H as Trade['bias4H'],
        bias1H: form.bias1H as Trade['bias1H'],
        bias15M: form.bias15M as Trade['bias15M'],
        inducementPresent: form.inducementPresent,
        poiType: form.poiType as Trade['poiType'],
        entryModel: form.entryModel as Trade['entryModel'],
        tradeReasoning: form.tradeReasoning,
        marketNarrative: form.marketNarrative,
        sessionObservation: form.sessionObservation,
        mistakeMade: form.mistakeMade,
        lessonLearned: form.lessonLearned,
        emotionalState: form.emotionalState,
        importantNote: form.importantNote,
      };

      let tradeId: number;

      if (mode === 'edit' && existingTrade?.id) {
        await updateTrade(existingTrade.id, tradeData);
        tradeId = existingTrade.id;
      } else {
        tradeId = await addTrade(tradeData);
      }

      // Save new images
      for (const img of images) {
        if (img.file) {
          await addImage(tradeId, img.file, img.type);
        }
      }

      toast.success(mode === 'edit' ? 'Trade updated!' : 'Trade logged!');
      router.push(`/day/${form.date}`);
    } catch (error) {
      console.error('Error saving trade:', error);
      toast.error('Failed to save trade');
    }
    setSaving(false);
  };

  const beforeImages = images.filter((img) => img.type === 'before_entry');
  const afterImages = images.filter((img) => img.type === 'after_trade');

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* ================================================================
          Basic Information
          ================================================================ */}
      <Section title="Basic Information" defaultOpen={true}>
        {/* Asset */}
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Asset</Label>
          <Select value={form.asset} onValueChange={(v) => updateField('asset', v)}>
            <SelectTrigger className="bg-white/[0.03] border-white/10">
              <SelectValue placeholder="Select asset" />
            </SelectTrigger>
            <SelectContent>
              {DEFAULT_ASSETS.map((asset) => (
                <SelectItem key={asset} value={asset}>{asset}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Direction Toggle */}
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Direction</Label>
          <div className="grid grid-cols-2 gap-2">
            {DIRECTIONS.map((dir) => (
              <button
                key={dir.value}
                type="button"
                onClick={() => updateField('direction', dir.value)}
                className={`
                  py-2.5 rounded-xl text-sm font-bold uppercase tracking-wide transition-all
                  ${form.direction === dir.value
                    ? dir.value === 'buy'
                      ? 'bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/30'
                      : 'bg-red-500/20 text-red-400 ring-1 ring-red-500/30'
                    : 'bg-white/[0.03] text-muted-foreground hover:bg-white/[0.06]'
                  }
                `}
              >
                {dir.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date & Times */}
        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Date</Label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => updateField('date', e.target.value)}
              className="bg-white/[0.05] border-white/10 [color-scheme:dark] w-full max-w-full"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="min-w-0">
              <Label className="text-xs text-muted-foreground mb-1.5 block">Entry Time</Label>
              <Input
                type="time"
                value={form.entryTime}
                onChange={(e) => updateField('entryTime', e.target.value)}
                className="bg-white/[0.05] border-white/10 [color-scheme:dark] w-full max-w-full"
              />
            </div>
            <div className="min-w-0">
              <Label className="text-xs text-muted-foreground mb-1.5 block">Exit Time</Label>
              <Input
                type="time"
                value={form.exitTime}
                onChange={(e) => updateField('exitTime', e.target.value)}
                className="bg-white/[0.05] border-white/10 [color-scheme:dark] w-full max-w-full"
              />
            </div>
          </div>
        </div>
      </Section>

      {/* ================================================================
          Session
          ================================================================ */}
      <Section title="Session" defaultOpen={true}>
        <div className="grid grid-cols-3 gap-2">
          {SESSIONS.map((session) => (
            <button
              key={session.value}
              type="button"
              onClick={() => updateField('session', session.value)}
              className={`
                py-3 rounded-xl text-sm font-semibold transition-all
                ${form.session === session.value
                  ? 'ring-1 ring-white/20 bg-white/10 text-foreground'
                  : 'bg-white/[0.03] text-muted-foreground hover:bg-white/[0.06]'
                }
              `}
            >
              <div className="text-center">
                <span className="block">{session.label}</span>
                <span className="text-[9px] text-muted-foreground/60 mt-0.5 block">{session.timeRange}</span>
              </div>
            </button>
          ))}
        </div>
      </Section>

      {/* ================================================================
          Risk Management
          ================================================================ */}
      <Section title="Risk Management" defaultOpen={true}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Lot Size</Label>
            <Input
              type="number"
              inputMode="decimal"
              step="0.01"
              value={form.lotSize}
              onChange={(e) => updateField('lotSize', e.target.value)}
              className="bg-white/[0.03] border-white/10 font-mono"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Entry Price</Label>
            <Input
              type="number"
              inputMode="decimal"
              step="0.00001"
              value={form.entryPrice}
              onChange={(e) => updateField('entryPrice', e.target.value)}
              className="bg-white/[0.03] border-white/10 font-mono"
              placeholder="0.00000"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Stop Loss</Label>
            <Input
              type="number"
              inputMode="decimal"
              step="0.00001"
              value={form.stopLoss}
              onChange={(e) => updateField('stopLoss', e.target.value)}
              className="bg-white/[0.03] border-white/10 font-mono"
              placeholder="0.00000"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Take Profit</Label>
            <Input
              type="number"
              inputMode="decimal"
              step="0.00001"
              value={form.takeProfit}
              onChange={(e) => updateField('takeProfit', e.target.value)}
              className="bg-white/[0.03] border-white/10 font-mono"
              placeholder="0.00000"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">RR Ratio</Label>
            <Input
              type="number"
              step="0.01"
              value={form.rrRatio}
              readOnly
              className="bg-white/[0.02] border-white/5 font-mono text-muted-foreground"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Profit / Loss ($)</Label>
            <Input
              type="number"
              inputMode="decimal"
              step="0.01"
              value={form.profitLoss}
              onChange={(e) => updateField('profitLoss', e.target.value)}
              className="bg-white/[0.03] border-white/10 font-mono"
              placeholder="0.00"
            />
          </div>
        </div>
      </Section>

      {/* ================================================================
          Higher Timeframe Analysis
          ================================================================ */}
      <Section title="Higher Timeframe Analysis" defaultOpen={false}>
        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">4H Bias</Label>
            <div className="grid grid-cols-2 gap-2">
              {BIAS_OPTIONS.map((bias) => (
                <button
                  key={bias.value}
                  type="button"
                  onClick={() => updateField('bias4H', bias.value)}
                  className={`
                    py-2 rounded-xl text-sm font-semibold transition-all
                    ${form.bias4H === bias.value
                      ? bias.value === 'bullish'
                        ? 'bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/30'
                        : 'bg-red-500/20 text-red-400 ring-1 ring-red-500/30'
                      : 'bg-white/[0.03] text-muted-foreground hover:bg-white/[0.06]'
                    }
                  `}
                >
                  {bias.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">1H Bias</Label>
            <div className="grid grid-cols-2 gap-2">
              {BIAS_OPTIONS.map((bias) => (
                <button
                  key={bias.value}
                  type="button"
                  onClick={() => updateField('bias1H', bias.value)}
                  className={`
                    py-2 rounded-xl text-sm font-semibold transition-all
                    ${form.bias1H === bias.value
                      ? bias.value === 'bullish'
                        ? 'bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/30'
                        : 'bg-red-500/20 text-red-400 ring-1 ring-red-500/30'
                      : 'bg-white/[0.03] text-muted-foreground hover:bg-white/[0.06]'
                    }
                  `}
                >
                  {bias.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ================================================================
          Intraday Analysis
          ================================================================ */}
      <Section title="Intraday Analysis (15M)" defaultOpen={false}>
        <div className="grid grid-cols-2 gap-2">
          {INTRADAY_BIAS_OPTIONS.map((bias) => (
            <button
              key={bias.value}
              type="button"
              onClick={() => updateField('bias15M', bias.value)}
              className={`
                py-2 rounded-xl text-sm font-semibold transition-all
                ${form.bias15M === bias.value
                  ? 'bg-white/10 text-foreground ring-1 ring-white/20'
                  : 'bg-white/[0.03] text-muted-foreground hover:bg-white/[0.06]'
                }
              `}
            >
              {bias.label}
            </button>
          ))}
        </div>
      </Section>

      {/* ================================================================
          SMC Execution
          ================================================================ */}
      <Section title="Execution Checklist" defaultOpen={false}>
        <div className="space-y-4">
          {/* Inducement */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02]">
            <Checkbox
              id="inducement"
              checked={form.inducementPresent}
              onCheckedChange={(checked) => updateField('inducementPresent', !!checked)}
            />
            <Label htmlFor="inducement" className="text-sm font-medium cursor-pointer">
              Inducement Present
            </Label>
          </div>

          {/* POI Type */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">POI Type</Label>
            <Select value={form.poiType} onValueChange={(v) => updateField('poiType', v)}>
              <SelectTrigger className="bg-white/[0.03] border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POI_TYPES.map((poi) => (
                  <SelectItem key={poi.value} value={poi.value}>{poi.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Entry Model */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Entry Model</Label>
            <Select value={form.entryModel} onValueChange={(v) => updateField('entryModel', v)}>
              <SelectTrigger className="bg-white/[0.03] border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ENTRY_MODELS.map((model) => (
                  <SelectItem key={model.value} value={model.value}>{model.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Section>

      {/* ================================================================
          Screenshots
          ================================================================ */}
      <Section title="Screenshots" defaultOpen={false}>
        <div className="grid grid-cols-2 gap-4">
          {/* Before Entry */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Before Entry</Label>
            {beforeImages.map((img, i) => (
              <div key={i} className="relative mb-2 rounded-lg overflow-hidden group">
                <img src={img.preview} alt="Before entry" className="w-full h-24 object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={() => removeImage(images.indexOf(img))}
                  className="absolute -top-2 -right-2 p-2 w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <div className="w-6 h-6 rounded-full bg-black/80 flex items-center justify-center">
                    <X className="w-3.5 h-3.5 text-white" />
                  </div>
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => handleImageUpload('before_entry')}
              className="w-full py-4 rounded-xl border border-dashed border-white/10 flex flex-col items-center gap-1 text-muted-foreground hover:bg-white/[0.02] transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span className="text-[10px]">Upload</span>
            </button>
          </div>

          {/* After Trade */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">After Trade</Label>
            {afterImages.map((img, i) => (
              <div key={i} className="relative mb-2 rounded-lg overflow-hidden group">
                <img src={img.preview} alt="After trade" className="w-full h-24 object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={() => removeImage(images.indexOf(img))}
                  className="absolute -top-2 -right-2 p-2 w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <div className="w-6 h-6 rounded-full bg-black/80 flex items-center justify-center">
                    <X className="w-3.5 h-3.5 text-white" />
                  </div>
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => handleImageUpload('after_trade')}
              className="w-full py-4 rounded-xl border border-dashed border-white/10 flex flex-col items-center gap-1 text-muted-foreground hover:bg-white/[0.02] transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span className="text-[10px]">Upload</span>
            </button>
          </div>
        </div>
      </Section>

      {/* ================================================================
          Trade Notes
          ================================================================ */}
      <Section title="Trade Notes" defaultOpen={false}>
        <div className="space-y-3">
          {NOTE_FIELDS.map((field) => (
            <div key={field.key}>
              <Label className="text-xs text-muted-foreground mb-1.5 block">{field.label}</Label>
              <Textarea
                value={form[field.key as keyof FormData] as string}
                onChange={(e) => updateField(field.key as keyof FormData, e.target.value)}
                placeholder={field.placeholder}
                rows={2}
                className="bg-white/[0.03] border-white/10 resize-none text-sm min-h-[56px]"
              />
            </div>
          ))}
        </div>
      </Section>

      {/* ================================================================
          Save Button
          ================================================================ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="sticky bottom-[90px] lg:bottom-4 z-20 pt-2"
      >
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-bold text-sm flex items-center justify-center gap-2 hover:from-cyan-400 hover:to-blue-400 transition-all disabled:opacity-50 shadow-lg shadow-cyan-500/20"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : mode === 'edit' ? 'Update Trade' : 'Save Trade'}
        </button>
      </motion.div>
    </div>
  );
}
