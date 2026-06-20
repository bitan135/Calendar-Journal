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

      <div className="px-4 lg:px-8 py-6 max-w-2xl mx-auto space-y-6">
        {/* Backup & Restore */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold">Backup & Restore</h3>
          </div>

          <p className="text-xs text-muted-foreground mb-4">
            Export your journal as a JSON file for safekeeping, or restore from a previous backup.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-cyan-500/10 text-cyan-400 font-semibold text-sm hover:bg-cyan-500/20 transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {exporting ? 'Exporting...' : 'Export Backup'}
            </button>
            <button
              onClick={handleImportClick}
              disabled={importing}
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 text-foreground font-semibold text-sm hover:bg-white/10 transition-all disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
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
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card rounded-xl p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <HardDrive className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold">Storage</h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Trades</span>
              <span className="font-mono-num">{tradeCount}</span>
            </div>
            {storage && (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Used Storage</span>
                  <span className="font-mono-num">{formatBytes(storage.usage)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Available</span>
                  <span className="font-mono-num">{formatBytes(storage.quota)}</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2 mt-2">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all"
                    style={{ width: `${Math.min(storagePercent, 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground/60 text-right">{storagePercent}% used</p>
              </>
            )}
          </div>
        </motion.div>

        {/* Keyboard Shortcuts */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-xl p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Keyboard className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold">Keyboard Shortcuts</h3>
          </div>

          <div className="space-y-2">
            {KEYBOARD_SHORTCUTS.map((shortcut) => (
              <div key={shortcut.key} className="flex items-center justify-between py-1.5">
                <span className="text-sm text-muted-foreground">{shortcut.description}</span>
                <kbd className="px-2 py-1 rounded-lg bg-white/5 text-xs font-mono text-foreground">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
        </motion.div>

        {/* About */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card rounded-xl p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold">About</h3>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Version</span>
              <span className="font-mono-num">{APP_CONFIG.version}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Storage</span>
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-green-400" />
                <span className="text-green-400 text-xs">Local Only</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span>Data Privacy</span>
              <span className="text-xs text-green-400">100% Private</span>
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
            <Button onClick={handleImportConfirm} className="bg-cyan-500 text-black hover:bg-cyan-400">
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
