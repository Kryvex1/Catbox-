import React from 'react';
import { Sparkles, Heart, Coffee, ShieldCheck } from 'lucide-react';

export const CatboxMascot: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto my-4 bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-pink-500/10 dark:from-sky-950/40 dark:via-indigo-950/40 dark:to-pink-950/30 rounded-3xl p-5 border border-sky-100 dark:border-sky-900/50 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
      <div className="flex items-center gap-4">
        {/* Cat Avatar / Mascot Graphic */}
        <div className="relative flex-shrink-0">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-300 via-pink-400 to-sky-400 p-0.5 shadow-md flex items-center justify-center">
            <div className="w-full h-full bg-white dark:bg-gray-900 rounded-[14px] flex items-center justify-center text-3xl">
              🐱
            </div>
          </div>
          <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full border-2 border-white dark:border-gray-900">
            Online
          </span>
        </div>

        <div className="space-y-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">
              Nyaa~! Welcome to Catbox
            </h3>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300">
              Free forever
            </span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-300 max-w-md">
            Fast, clean, no-bullshit file host. Upload anything and grab permanent or temporary raw direct links instantly.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <a
          href="https://ko-fi.com"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <Coffee className="w-3.5 h-3.5 text-amber-500" />
          <span>Support Catbox</span>
        </a>
      </div>
    </div>
  );
};
