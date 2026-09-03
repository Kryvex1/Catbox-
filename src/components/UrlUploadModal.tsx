import React, { useState } from 'react';
import { Link as LinkIcon, Loader2, Check, Copy, ExternalLink, AlertCircle, Clock } from 'lucide-react';
import { UploadMode, ExpiryOption, FileRecord } from '../types';

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
          userhash: userhash || undefined,
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
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="bg-white dark:bg-[#1e2327] rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-gray-800 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <LinkIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Remote URL Upload
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Download and mirror direct files from external websites or image hosts
            </p>
          </div>
        </div>

        {mode === 'litterbox' && (
          <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900/60">
            <div className="flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300 font-medium">
              <Clock className="w-4 h-4" />
              <span>Temporary Expiration:</span>
            </div>
            <div className="flex gap-1">
              {(['1h', '12h', '24h', '72h'] as ExpiryOption[]).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setExpiry(opt)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                    expiry === opt
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-white/60 dark:bg-black/30'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleUrlSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Direct File URL:
            </label>
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/pictures/cat.png"
              className="w-full px-4 py-3 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono focus:outline-hidden focus:ring-2 focus:ring-sky-500 transition-all"
            />
          </div>

          <div className="flex flex-wrap gap-2 text-[11px] text-gray-500 dark:text-gray-400">
            <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">e.g. .png, .jpg, .gif, .mp4, .pdf</span>
            <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">Max 200MB</span>
          </div>

          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white shadow-sm flex items-center justify-center gap-2 transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Downloading & Storing File...</span>
              </>
            ) : (
              <>
                <LinkIcon className="w-4 h-4" />
                <span>Upload From URL</span>
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {uploadedFile && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                File mirrored successfully!
              </span>
              <button
                type="button"
                onClick={() => onPreviewFile(uploadedFile)}
                className="text-xs text-emerald-700 dark:text-emerald-300 hover:underline font-semibold"
              >
                Preview Media
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={uploadedFile.url}
                className="flex-1 px-3 py-2 text-xs font-mono rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => copyUrl(uploadedFile.url)}
                className="px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <a
                href={uploadedFile.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
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

export { UrlUpload as UrlUploadModal };
