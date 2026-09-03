import React, { useState } from 'react';
import { 
  Upload, 
  Link as LinkIcon, 
  FolderHeart, 
  History, 
  Code, 
  HelpCircle, 
  Sun, 
  Moon, 
  Key, 
  Coffee, 
  Clock, 
  Check, 
  Sparkles 
} from 'lucide-react';
import { ActiveTab, UploadMode } from '../types';

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

  const handleSaveHash = () => {
    setUserhash(tempHash.trim());
    localStorage.setItem('catbox_userhash', tempHash.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setShowHashModal(false);
    }, 800);
  };

  const handleGenerateRandomHash = () => {
    const chars = 'abcdef0123456789';
    let newHash = '';
    for (let i = 0; i < 16; i++) {
      newHash += chars[Math.floor(Math.random() * chars.length)];
    }
    setTempHash(newHash);
  };

  return (
    <header className="w-full border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-[#1a1e22]/95 backdrop-blur sticky top-0 z-40 transition-colors">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Logo and Mode Switcher */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mascot / Logo */}
            <div 
              onClick={() => setActiveTab('upload')}
              className="cursor-pointer flex items-center gap-2.5 group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-500 p-0.5 shadow-md group-hover:scale-105 transition-transform flex items-center justify-center text-white">
                <div className="w-full h-full bg-white dark:bg-[#1a1e22] rounded-[10px] flex items-center justify-center">
                  <span className="text-xl">🐱</span>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xl tracking-tight text-gray-900 dark:text-white">
                    {mode === 'catbox' ? 'Catbox' : 'Litterbox'}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-950/80 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                    {mode === 'catbox' ? 'Permanent' : 'Temporary'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                  {mode === 'catbox' ? 'Unlimited & Permanent file hosting' : 'Ephemeral storage with auto-expiry'}
                </p>
              </div>
            </div>

            {/* Mode Switcher Toggle */}
            <div className="ml-2 hidden sm:flex items-center bg-gray-100 dark:bg-gray-800/80 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
              <button
                id="btn-switch-catbox"
                onClick={() => setMode('catbox')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  mode === 'catbox'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Catbox
              </button>
              <button
                id="btn-switch-litterbox"
                onClick={() => setMode('litterbox')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1 transition-all ${
                  mode === 'litterbox'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Clock className="w-3 h-3" />
                Litterbox
              </button>
            </div>
          </div>

          {/* Quick controls on mobile */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-gray-700" />}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none text-xs font-medium">
          <button
            id="nav-tab-upload"
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'upload'
                ? 'bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400 font-semibold'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload
          </button>

          <button
            id="nav-tab-url"
            onClick={() => setActiveTab('url')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'url'
                ? 'bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400 font-semibold'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            URL Upload
          </button>

          <button
            id="nav-tab-albums"
            onClick={() => setActiveTab('albums')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'albums'
                ? 'bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400 font-semibold'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <FolderHeart className="w-3.5 h-3.5" />
            Albums
          </button>

          <button
            id="nav-tab-history"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400 font-semibold'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Files
            {filesCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 bg-gray-200 dark:bg-gray-700 text-[10px] rounded-full text-gray-800 dark:text-gray-200">
                {filesCount}
              </span>
            )}
          </button>

          <button
            id="nav-tab-api"
            onClick={() => setActiveTab('api')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'api'
                ? 'bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400 font-semibold'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            API & Tools
          </button>

          <button
            id="nav-tab-faq"
            onClick={() => setActiveTab('faq')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'faq'
                ? 'bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400 font-semibold'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            FAQ
          </button>

          <div className="h-4 w-px bg-gray-300 dark:bg-gray-700 mx-1 hidden sm:block" />

          {/* Userhash Button */}
          <button
            id="btn-userhash-modal"
            onClick={() => {
              setTempHash(userhash);
              setShowHashModal(true);
            }}
            title={userhash ? `Active Userhash: ${userhash}` : 'Set custom userhash for account tracking'}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Key className="w-3.5 h-3.5 text-sky-500" />
            <span className="hidden sm:inline">
              {userhash ? `${userhash.slice(0, 6)}...` : 'Userhash'}
            </span>
          </button>

          {/* Theme Toggle Button */}
          <button
            id="btn-theme-toggle"
            onClick={() => setDarkMode(!darkMode)}
            className="hidden sm:flex items-center p-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Toggle light / dark mode"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-gray-600" />}
          </button>

          {/* Ko-fi cup button like catbox */}
          <a
            href="https://ko-fi.com"
            target="_blank"
            rel="noopener noreferrer"
            title="Support Catbox on Ko-fi"
            className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>Donate</span>
          </a>
        </div>
      </div>

      {/* Userhash Config Modal */}
      {showHashModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#1e2327] border border-gray-200 dark:border-gray-700 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-2 mb-2">
              <Key className="w-5 h-5 text-sky-500" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Catbox Userhash
              </h3>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
              A userhash acts as an anonymous token to tie uploads to your session. It allows you to manage or delete your files, view your private gallery, and create user-associated albums via the API.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Your Hash:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempHash}
                    onChange={(e) => setTempHash(e.target.value)}
                    placeholder="Enter or generate hash..."
                    className="flex-1 px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateRandomHash}
                    className="px-3 py-2 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 flex items-center gap-1"
                    title="Generate random hash"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    New
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setTempHash('');
                    setUserhash('');
                    localStorage.removeItem('catbox_userhash');
                    setShowHashModal(false);
                  }}
                  className="text-xs text-rose-500 hover:underline"
                >
                  Clear Hash (Anonymous)
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowHashModal(false)}
                    className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveHash}
                    className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-1"
                  >
                    {savedSuccess ? <Check className="w-3.5 h-3.5" /> : null}
                    Save Hash
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
