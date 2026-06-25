'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Download, Upload, HardDrive, Info, Keyboard, Database, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/layout/page-header';
import { exportBackup, importBackup } from '@/lib/db/backup';
import { getStorageEstimate } from '@/lib/db/database';
import { getTradeCount } from '@/lib/db/trades';
import { APP_CONFIG, KEYBOARD_SHORTCUTS } from '@/lib/utils/constants';

export default function SettingsPage() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importConfirm, setImportConfirm] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [storage, setStorage] = useState<{ usage: number; quota: number } | null>(null);
  const [tradeCount, setTradeCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getStorageEstimate().then(setStorage);
    getTradeCount().then(setTradeCount);
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportBackup();
      toast.success('Backup exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export backup');
    }
    setExporting(false);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingFile(file);
      setImportConfirm(true);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImportConfirm = async () => {
    if (!pendingFile) return;
    setImporting(true);
    setImportConfirm(false);
    try {
      const result = await importBackup(pendingFile);
      toast.success(`Imported ${result.trades} trades and ${result.images} images!`);
      setTradeCount(result.trades);
      getStorageEstimate().then(setStorage);
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import backup. Check the file format.');
    }
    setImporting(false);
    setPendingFile(null);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const storagePercent = storage ? Math.round((storage.usage / storage.quota) * 100) : 0;

  return (
    <>
      <PageHeader title="Settings" subtitle="Manage your journal" />

      <div className="px-4 lg:px-8 py-6 max-w-2xl mx-auto space-y-4">
        {/* Backup & Restore */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-5 border border-white/5 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-3.5">
            <Database className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold tracking-tight text-foreground">Backup & Restore</h3>
          </div>

          <p className="text-xs text-muted-foreground/80 leading-relaxed mb-4">
            Export your journal as a JSON file for safekeeping, or restore from a previous backup.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-primary text-white font-semibold text-xs hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              {exporting ? 'Exporting...' : 'Export Backup'}
            </button>
            <button
              onClick={handleImportClick}
              disabled={importing}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-white/5 border border-white/5 text-foreground font-semibold text-xs hover:bg-white/10 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              {importing ? 'Importing...' : 'Import Backup'}
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
          />
        </motion.div>

        {/* Storage */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card rounded-xl p-5 border border-white/5 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-3.5">
            <HardDrive className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold tracking-tight text-foreground">Storage</h3>
          </div>

          <div className="space-y-3.5">
            <div className="flex items-center justify-between text-xs py-1.5 border-b border-white/5">
              <span className="text-muted-foreground/80 font-medium">Total Trades</span>
              <span className="font-semibold font-mono-num">{tradeCount}</span>
            </div>
            {storage && (
              <>
                <div className="flex items-center justify-between text-xs py-1.5 border-b border-white/5">
                  <span className="text-muted-foreground/80 font-medium">Used Storage</span>
                  <span className="font-semibold font-mono-num">{formatBytes(storage.usage)}</span>
                </div>
                <div className="flex items-center justify-between text-xs py-1.5 border-b border-white/5 last:border-0">
                  <span className="text-muted-foreground/80 font-medium">Available</span>
                  <span className="font-semibold font-mono-num">{formatBytes(storage.quota)}</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1.5 mt-2.5">
                  <div
                    className="h-1.5 rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(storagePercent, 100)}%` }}
                  />
                </div>
                <p className="text-[9px] text-muted-foreground/50 text-right mt-1.5 font-medium">{storagePercent}% used</p>
              </>
            )}
          </div>
        </motion.div>

        {/* Keyboard Shortcuts */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-xl p-5 border border-white/5 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-3.5">
            <Keyboard className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold tracking-tight text-foreground">Keyboard Shortcuts</h3>
          </div>

          <div className="space-y-1.5">
            {KEYBOARD_SHORTCUTS.map((shortcut) => (
              <div key={shortcut.key} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0 text-xs">
                <span className="text-muted-foreground/80 font-medium">{shortcut.description}</span>
                <kbd className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[10px] font-mono text-foreground/90 font-semibold">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
        </motion.div>

        {/* About */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card rounded-xl p-5 border border-white/5 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-3.5">
            <Info className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold tracking-tight text-foreground">About</h3>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-white/5">
              <span className="text-muted-foreground/80 font-medium">Version</span>
              <span className="font-semibold font-mono-num">{APP_CONFIG.version}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-white/5">
              <span className="text-muted-foreground/80 font-medium">Storage</span>
              <div className="flex items-center gap-1 font-semibold text-profit">
                <Shield className="w-3.5 h-3.5" />
                <span>Local Only</span>
              </div>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-white/5 last:border-0">
              <span className="text-muted-foreground/80 font-medium">Data Privacy</span>
              <span className="font-semibold text-profit">100% Private</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Import Confirmation Dialog */}
      <Dialog open={importConfirm} onOpenChange={setImportConfirm}>
        <DialogContent className="glass-strong">
          <DialogHeader>
            <DialogTitle>Import Backup</DialogTitle>
            <DialogDescription>
              This will replace all existing data with the backup. This action cannot be undone. Are you sure?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setImportConfirm(false); setPendingFile(null); }}>Cancel</Button>
            <Button onClick={handleImportConfirm} className="bg-primary text-white hover:opacity-90 transition-all border border-white/10">
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
