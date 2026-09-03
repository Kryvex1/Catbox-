import React, { useState, useEffect } from 'react';
import { 
  FileRecord, 
  UploadMode, 
  ActiveTab, 
  ServerStats,
  DEFAULT_MASTER_USERHASH
} from './types';
import { Header } from './components/Header';
import { UploadZone } from './components/UploadZone';
import { UrlUpload } from './components/UrlUploadModal';
import { FilePreviewModal } from './components/FilePreviewModal';
import { MyFilesHistory } from './components/MyFilesHistory';
import { AlbumManager } from './components/AlbumManager';
import { ApiDocs } from './components/ApiDocs';
import { FaqSection } from './components/FaqSection';
import { 
  CheckCircle2, 
  Heart, 
  Terminal, 
  ShieldCheck,
  Zap,
  Globe
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('upload');
  const [mode, setMode] = useState<UploadMode>('catbox');
  const [userhash, setUserhash] = useState<string>(() => {
    return localStorage.getItem('catbox_userhash') || '';
  });

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('catbox_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [files, setFiles] = useState<FileRecord[]>(() => {
    try {
      const cached = localStorage.getItem('catbox_cached_files');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [stats, setStats] = useState<ServerStats | null>(null);
  const [previewFile, setPreviewFile] = useState<FileRecord | null>(null);
  const [albumInitialUrls, setAlbumInitialUrls] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('catbox_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('catbox_theme', 'light');
    }
  }, [darkMode]);

  // Save and fetch on userhash changes
  const handleUserhashChange = (newHash: string) => {
    setUserhash(newHash);
    localStorage.setItem('catbox_userhash', newHash);
    fetchFiles(newHash);
  };

  // Fetch files from server
  const fetchFiles = async (uh = userhash) => {
    try {
      const queryHash = uh || DEFAULT_MASTER_USERHASH;
      const url = queryHash ? `/api/files?userhash=${encodeURIComponent(queryHash)}` : '/api/files';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.files && Array.isArray(data.files)) {
          setFiles(data.files);
          localStorage.setItem('catbox_cached_files', JSON.stringify(data.files));
        }
      }
    } catch {
      // Local fallback
    }
  };

  // Fetch server stats
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchFiles();
    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleFileUploaded = (newFile: FileRecord) => {
    setFiles((prev) => {
      const updated = [newFile, ...prev.filter((f) => f.id !== newFile.id && f.filename !== newFile.filename)];
      localStorage.setItem('catbox_cached_files', JSON.stringify(updated));
      return updated;
    });
    fetchStats();
    showToast(`Uploaded ${newFile.originalName} to Catbox successfully!`);
  };

  const handleDeleteFile = async (filename: string) => {
    try {
      const effectiveHash = userhash || DEFAULT_MASTER_USERHASH;
      const res = await fetch('/api/files/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, userhash: effectiveHash }),
      });

      if (res.ok) {
        setFiles((prev) => {
          const filtered = prev.filter((f) => f.filename !== filename);
          localStorage.setItem('catbox_cached_files', JSON.stringify(filtered));
          return filtered;
        });
        if (previewFile && previewFile.filename === filename) {
          setPreviewFile(null);
        }
        fetchStats();
        showToast('File deleted successfully');
      } else {
        const data = await res.json();
        showToast(`Deletion failed: ${data.error || 'Server error'}`);
      }
    } catch {
      setFiles((prev) => {
        const filtered = prev.filter((f) => f.filename !== filename);
        localStorage.setItem('catbox_cached_files', JSON.stringify(filtered));
        return filtered;
      });
      if (previewFile && previewFile.filename === filename) {
        setPreviewFile(null);
      }
      showToast('File removed from local list');
    }
  };

  const handleCreateAlbumFromFiles = (selectedUrls: string[]) => {
    setAlbumInitialUrls(selectedUrls);
    setActiveTab('albums');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200 selection:bg-sky-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-semibold shadow-xl border border-slate-700 dark:border-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-sky-400 dark:text-sky-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header */}
      <Header
        mode={mode}
        setMode={setMode}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        userhash={userhash}
        setUserhash={handleUserhashChange}
        filesCount={files.length}
      />

      {/* Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Upload View */}
        {activeTab === 'upload' && (
          <UploadZone
            mode={mode}
            setMode={setMode}
            userhash={userhash}
            onFileUploaded={handleFileUploaded}
            onPreviewFile={(f) => setPreviewFile(f)}
          />
        )}

        {/* URL Upload View */}
        {activeTab === 'url' && (
          <UrlUpload
            mode={mode}
            userhash={userhash}
            onFileUploaded={handleFileUploaded}
            onPreviewFile={(f) => setPreviewFile(f)}
          />
        )}

        {/* My Files History View */}
        {activeTab === 'history' && (
          <MyFilesHistory
            files={files}
            onPreviewFile={(f) => setPreviewFile(f)}
            onDeleteFile={handleDeleteFile}
            onCreateAlbumFromFiles={handleCreateAlbumFromFiles}
          />
        )}

        {/* Albums View */}
        {activeTab === 'albums' && (
          <AlbumManager
            files={files}
            initialSelectedUrls={albumInitialUrls}
            onPreviewFile={(f) => setPreviewFile(f)}
            userhash={userhash}
          />
        )}

        {/* API Docs View */}
        {activeTab === 'api' && (
          <ApiDocs userhash={userhash} />
        )}

        {/* FAQ View */}
        {activeTab === 'faq' && (
          <FaqSection />
        )}
      </main>

      {/* File Preview Modal */}
      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        onDeleteFile={handleDeleteFile}
      />

      {/* Modern High-End Footer */}
      <footer className="w-full border-t border-slate-200/90 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md py-6 mt-12 transition-colors">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-slate-800 dark:text-slate-200">Catbox.moe</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              Master Hash 7e283b65... Active
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('api')}
              className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors font-medium"
            >
              API & Integration
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('faq')}
              className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors font-medium"
            >
              FAQ & Limits
            </button>
            <a
              href={`/api/sharex?userhash=${userhash || DEFAULT_MASTER_USERHASH}`}
              download="Catbox.sxcu"
              className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors font-medium flex items-center gap-1"
            >
              ShareX .sxcu
            </a>
            <a
              href="https://files.catbox.moe"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors font-medium flex items-center gap-1"
            >
              <Globe className="w-3.5 h-3.5" />
              files.catbox.moe
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
