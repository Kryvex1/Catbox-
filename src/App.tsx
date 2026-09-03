import React, { useState, useEffect } from 'react';
import { 
  FileRecord, 
  UploadMode, 
  LitterboxRetention, 
  ServerStats 
} from './types';
import { Header } from './components/Header';
import { UploadZone } from './components/UploadZone';
import { UrlUploadModal } from './components/UrlUploadModal';
import { FilePreviewModal } from './components/FilePreviewModal';
import { MyFilesHistory } from './components/MyFilesHistory';
import { AlbumManager } from './components/AlbumManager';
import { ApiDocs } from './components/ApiDocs';
import { FaqSection } from './components/FaqSection';
import { 
  Sparkles, 
  Heart, 
  ExternalLink, 
  Terminal, 
  Server, 
  CheckCircle2, 
  ShieldCheck, 
  Layers,
  Cat
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'upload' | 'files' | 'albums' | 'api' | 'faq'>('upload');
  const [mode, setMode] = useState<UploadMode>('catbox');
  const [retention, setRetention] = useState<LitterboxRetention>('24h');
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
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileRecord | null>(null);
  const [albumInitialUrls, setAlbumInitialUrls] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync theme
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('catbox_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('catbox_theme', 'light');
    }
  }, [darkMode]);

  // Save userhash
  const handleUserhashChange = (newHash: string) => {
    setUserhash(newHash);
    localStorage.setItem('catbox_userhash', newHash);
    fetchFiles(newHash);
  };

  // Fetch files from server
  const fetchFiles = async (uh = userhash) => {
    try {
      const url = uh ? `/api/files?userhash=${encodeURIComponent(uh)}` : '/api/files';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.files && Array.isArray(data.files)) {
          setFiles(data.files);
          localStorage.setItem('catbox_cached_files', JSON.stringify(data.files));
        }
      }
    } catch {
      // Local fallback is already active
    }
  };

  // Fetch stats from server
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
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleUploadComplete = (newFiles: FileRecord[]) => {
    setFiles((prev) => {
      const merged = [...newFiles, ...prev.filter((p) => !newFiles.some((n) => n.id === p.id))];
      localStorage.setItem('catbox_cached_files', JSON.stringify(merged));
      return merged;
    });
    fetchStats();
    showToast(`${newFiles.length} file(s) uploaded successfully!`);
  };

  const handleDeleteFile = async (file: FileRecord) => {
    try {
      const res = await fetch('/api/files/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.filename, userhash: userhash || undefined }),
      });

      if (res.ok) {
        setFiles((prev) => {
          const filtered = prev.filter((f) => f.id !== file.id);
          localStorage.setItem('catbox_cached_files', JSON.stringify(filtered));
          return filtered;
        });
        fetchStats();
        showToast('File removed successfully');
      } else {
        const data = await res.json();
        showToast(`Failed: ${data.error || 'Could not delete'}`);
      }
    } catch {
      // If offline/error, remove locally
      setFiles((prev) => {
        const filtered = prev.filter((f) => f.id !== file.id);
        localStorage.setItem('catbox_cached_files', JSON.stringify(filtered));
        return filtered;
      });
      showToast('File removed from history');
    }
  };

  const handleOpenAlbumWithSelected = (urls: string[]) => {
    setAlbumInitialUrls(urls);
    setActiveTab('albums');
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] dark:bg-[#13171a] text-gray-900 dark:text-gray-100 flex flex-col font-sans transition-colors duration-200">
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-950 text-xs font-semibold shadow-xl border border-gray-700 dark:border-gray-200 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-sky-400 dark:text-sky-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userhash={userhash}
        setUserhash={handleUserhashChange}
        fileCount={files.length}
        darkMode={darkMode}
        toggleDarkMode={() => setDarkMode(!darkMode)}
      />

      {/* Main Content Body */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Upload Screen */}
        {activeTab === 'upload' && (
          <div className="space-y-6">
            {/* Notification notice card */}
            <div className="bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/50 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 text-sky-900 dark:text-sky-200">
                <Cat className="w-4 h-4 text-sky-600 dark:text-sky-400 flex-shrink-0" />
                <span>
                  <strong>Welcome to Catbox!</strong> Permanent and Litterbox disposable file hosting with raw direct URLs and zero bandwidth throttling.
                </span>
              </div>
              <div className="flex items-center gap-3 self-end sm:self-auto flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('api')}
                  className="font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  API & ShareX
                </button>
              </div>
            </div>

            <UploadZone
              mode={mode}
              setMode={setMode}
              retention={retention}
              setRetention={setRetention}
              userhash={userhash}
              onUploadComplete={handleUploadComplete}
              onOpenUrlModal={() => setShowUrlModal(true)}
              onPreviewFile={(f) => setPreviewFile(f)}
            />
          </div>
        )}

        {/* Files History Screen */}
        {activeTab === 'files' && (
          <MyFilesHistory
            files={files}
            onDeleteFile={handleDeleteFile}
            onPreviewFile={(f) => setPreviewFile(f)}
            onCreateAlbumWithSelected={handleOpenAlbumWithSelected}
            onRefresh={fetchFiles}
            userhash={userhash}
          />
        )}

        {/* Album Manager */}
        {activeTab === 'albums' && (
          <AlbumManager
            files={files}
            initialSelectedUrls={albumInitialUrls}
            onPreviewFile={(f) => setPreviewFile(f)}
            userhash={userhash}
          />
        )}

        {/* API Docs Screen */}
        {activeTab === 'api' && (
          <ApiDocs userhash={userhash} />
        )}

        {/* FAQ Screen */}
        {activeTab === 'faq' && (
          <FaqSection />
        )}
      </main>

      {/* URL Upload Modal */}
      {showUrlModal && (
        <UrlUploadModal
          userhash={userhash}
          onClose={() => setShowUrlModal(false)}
          onUploadComplete={(newFile) => {
            handleUploadComplete([newFile]);
            setShowUrlModal(false);
          }}
        />
      )}

      {/* File Preview Modal */}
      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
          onDelete={(f) => {
            handleDeleteFile(f);
            setPreviewFile(null);
          }}
        />
      )}

      {/* Global Clean Minimal Footer */}
      <footer className="w-full border-t border-gray-200 dark:border-gray-800/80 bg-white/70 dark:bg-[#181c1f]/70 backdrop-blur-xs py-6 mt-12 transition-colors">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-700 dark:text-gray-300">Catbox.moe</span>
            <span>— Free Anonymous Media & File Hosting</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('api')}
              className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
            >
              API & Tools
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('faq')}
              className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
            >
              FAQ / Rules
            </button>
            <a
              href={`/api/sharex?userhash=${userhash}`}
              download="Catbox.sxcu"
              className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors font-medium flex items-center gap-1"
            >
              ShareX .sxcu
            </a>
            <a
              href="https://www.patreon.com/catbox"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-rose-500 transition-colors flex items-center gap-1 font-medium"
            >
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" />
              Support on Patreon
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
