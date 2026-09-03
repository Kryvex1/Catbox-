import React, { useState } from 'react';
import { 
  UploadCloud, 
  Link2, 
  FolderKanban, 
  Layers, 
  Terminal, 
  HelpCircle, 
  Sun, 
  Moon, 
  KeyRound, 
  Clock, 
  Check, 
  Sparkles,
  ShieldCheck,
  Zap,
  Globe2
} from 'lucide-react';
import { ActiveTab, UploadMode, DEFAULT_MASTER_USERHASH } from '../types';

interface HeaderProps {
  mode: UploadMode;
  setMode: (mode: UploadMode) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  userhash: string;
  setUserhash: (hash: string) => void;
  filesCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  setMode,
  activeTab,
  setActiveTab,
  darkMode,
  setDarkMode,
  userhash,
  setUserhash,
  filesCount,
}) => {
  const [showHashModal, setShowHashModal] = useState(false);
  const [tempHash, setTempHash] = useState(userhash);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const activeEffectiveHash = userhash.trim() || DEFAULT_MASTER_USERHASH;
  const isUsingMaster = !userhash.trim() || userhash.trim() === DEFAULT_MASTER_USERHASH;

  const handleSaveHash = () => {
    const trimmed = tempHash.trim();
    setUserhash(trimmed);
    if (trimmed) {
      localStorage.setItem('catbox_userhash', trimmed);
    } else {
      localStorage.removeItem('catbox_userhash');
    }
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setShowHashModal(false);
    }, 700);
  };

  const handleResetToMaster = () => {
    setTempHash('');
    setUserhash('');
    localStorage.removeItem('catbox_userhash');
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setShowHashModal(false);
    }, 600);
  };

  return (
    <header className="w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand & Mode Switcher */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Minimalist Futuristic Vector Logo (No Emojis) */}
            <div 
              onClick={() => setActiveTab('upload')}
              className="cursor-pointer flex items-center gap-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 via-cyan-400 to-indigo-600 p-[1.5px] shadow-sm shadow-sky-500/20 group-hover:shadow-sky-500/40 group-hover:scale-105 transition-all">
                <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                  <Zap className="w-5 h-5 text-sky-400 fill-sky-400/20" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
                    {mode === 'catbox' ? 'Catbox' : 'Litterbox'}
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800">
                    {mode === 'catbox' ? 'Permanent' : 'Temporary'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {mode === 'catbox' ? 'Permanent High-Speed CDN' : 'Auto-expiring file storage'}
                </p>
              </div>
            </div>

            {/* Mode Switcher Toggle */}
            <div className="ml-2 hidden sm:flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              <button
                id="btn-switch-catbox"
                type="button"
                onClick={() => setMode('catbox')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  mode === 'catbox'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Catbox
              </button>
              <button
                id="btn-switch-litterbox"
                type="button"
                onClick={() => setMode('litterbox')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center gap-1 transition-all ${
                  mode === 'litterbox'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Litterbox
              </button>
            </div>
          </div>

          {/* Quick controls on mobile */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none text-xs font-medium">
          <button
            id="nav-tab-upload"
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'upload'
                ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 font-semibold shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            Upload
          </button>

          <button
            id="nav-tab-url"
            type="button"
            onClick={() => setActiveTab('url')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'url'
                ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 font-semibold shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Link2 className="w-4 h-4" />
            URL Upload
          </button>

          <button
            id="nav-tab-albums"
            type="button"
            onClick={() => setActiveTab('albums')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'albums'
                ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 font-semibold shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FolderKanban className="w-4 h-4" />
            Albums
          </button>

          <button
            id="nav-tab-history"
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 font-semibold shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            Files
            {filesCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 bg-slate-200 dark:bg-slate-800 text-[10px] rounded-full font-mono text-slate-800 dark:text-slate-200">
                {filesCount}
              </span>
            )}
          </button>

          <button
            id="nav-tab-api"
            type="button"
            onClick={() => setActiveTab('api')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'api'
                ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 font-semibold shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Terminal className="w-4 h-4" />
            API & CLI
          </button>

          <button
            id="nav-tab-faq"
            type="button"
            onClick={() => setActiveTab('faq')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'faq'
                ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 font-semibold shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            FAQ
          </button>

          {/* Official Network Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Official CDN</span>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

          {/* Userhash Settings Button */}
          <button
            id="btn-userhash-modal"
            type="button"
            onClick={() => {
              setTempHash(userhash);
              setShowHashModal(true);
            }}
            title={isUsingMaster ? `Active Master Hash: ${DEFAULT_MASTER_USERHASH}` : `Custom Hash: ${userhash}`}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all ${
              !isUsingMaster
                ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-750'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-sky-500" />
            <span className="font-mono text-[11px] hidden sm:inline">
              {isUsingMaster ? `${DEFAULT_MASTER_USERHASH.slice(0, 6)}...` : `${userhash.slice(0, 6)}...`}
            </span>
          </button>

          {/* Theme Toggle Button */}
          <button
            id="btn-theme-toggle"
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            className="hidden sm:flex items-center p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Toggle light / dark mode"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </div>

      {/* Userhash Config Modal */}
      {showHashModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 flex items-center justify-center text-sky-500">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Catbox Master Account Hash
              </h3>
            </div>

            <div className="p-3 mb-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Master User Hash:</span>
                <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                  {DEFAULT_MASTER_USERHASH}
                </span>
              </div>
              <p className="leading-relaxed">
                Aapko login karne ki zaroorat nahi hai. Sabhi permanent uploads automatically is official Catbox master hash mein link ho rahe hain!
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Custom User Hash (Optional):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempHash}
                    onChange={(e) => setTempHash(e.target.value)}
                    placeholder={DEFAULT_MASTER_USERHASH}
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                  {tempHash && (
                    <button
                      type="button"
                      onClick={handleResetToMaster}
                      className="px-2.5 py-1 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Reset to Master Account"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Apne personal Catbox account ka hash lagane ke liye{' '}
                  <a
                    href="https://catbox.moe/user/manage.php"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-600 dark:text-sky-400 underline font-semibold"
                  >
                    catbox.moe/user/manage.php
                  </a>{' '}
                  se copy karein.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowHashModal(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveHash}
                  className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-1.5 transition-colors"
                >
                  {savedSuccess ? <Check className="w-3.5 h-3.5" /> : null}
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
