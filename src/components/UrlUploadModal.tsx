import React, { useState } from 'react';
import { Link2, Loader2, Check, Copy, ExternalLink, AlertCircle, Clock, ShieldCheck, Zap } from 'lucide-react';
import { UploadMode, ExpiryOption, FileRecord, DEFAULT_MASTER_USERHASH } from '../types';

interface UrlUploadProps {
  mode: UploadMode;
  userhash: string;
  onFileUploaded: (file: FileRecord) => void;
  onPreviewFile: (file: FileRecord) => void;
}

export const UrlUpload: React.FC<UrlUploadProps> = ({
  mode,
  userhash,
  onFileUploaded,
  onPreviewFile,
}) => {
  const [url, setUrl] = useState('');
  const [expiry, setExpiry] = useState<ExpiryOption>('24h');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<FileRecord | null>(null);
  const [copied, setCopied] = useState(false);

  const effectiveHash = userhash.trim() || DEFAULT_MASTER_USERHASH;

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setUploadedFile(null);

    try {
      const res = await fetch('/api/url-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
          mode,
          time: expiry,
          userhash: effectiveHash,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload from URL');
      }

      setUploadedFile(data.file);
      onFileUploaded(data.file);
      setUrl('');
    } catch (err: any) {
      setError(err.message || 'Error occurred while processing URL');
    } finally {
      setLoading(false);
    }
  };

  const copyUrl = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 flex items-center justify-center">
            <Link2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Remote URL Mirroring
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Fetch remote web files directly into Catbox CDN ({effectiveHash.slice(0, 10)}...)
            </p>
          </div>
        </div>

        {/* Master Account notice */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 text-xs flex items-center justify-between text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Target Account: <code className="font-mono text-slate-800 dark:text-slate-200">{effectiveHash.slice(0, 12)}...</code></span>
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Catbox Official
          </span>
        </div>

        <form onSubmit={handleUrlSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Direct File URL:
            </label>
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/images/wallpaper.png"
              className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500 transition-all"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Supports raw file links: JPG, PNG, GIF, WebP, MP4, MP3, PDF, etc.
            </p>
          </div>

          {mode === 'litterbox' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                Litterbox Expiry:
              </label>
              <div className="grid grid-cols-4 gap-2 text-xs">
                {(['1h', '12h', '24h', '72h'] as ExpiryOption[]).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setExpiry(opt)}
                    className={`py-2 rounded-xl font-semibold border transition-all ${
                      expiry === opt
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Downloading & Mirroring to Catbox...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Upload to Catbox</span>
              </>
            )}
          </button>
        </form>

        {uploadedFile && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-500" />
                Upload Successful!
              </span>
              <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
                files.catbox.moe
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={uploadedFile.url}
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-slate-900 font-mono text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => copyUrl(uploadedFile.url)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <a
                href={uploadedFile.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
