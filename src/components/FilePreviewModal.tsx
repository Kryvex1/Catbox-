import React, { useState } from 'react';
import { 
  X, 
  Download, 
  ExternalLink, 
  Copy, 
  Check, 
  Clock, 
  Trash2, 
  FileText, 
  Image as ImageIcon,
  Film,
  Music
} from 'lucide-react';
import { FileRecord } from '../types';

interface FilePreviewModalProps {
  file: FileRecord | null;
  onClose: () => void;
  onDeleteFile: (filename: string) => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  file,
  onClose,
  onDeleteFile,
}) => {
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  if (!file) return null;

  const ext = file.filename.split('.').pop()?.toLowerCase() || '';
  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(ext) || file.mimetype.startsWith('image/');
  const isVideo = ['mp4', 'webm', 'mov', 'mkv'].includes(ext) || file.mimetype.startsWith('video/');
  const isAudio = ['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext) || file.mimetype.startsWith('audio/');
  const isPdf = ext === 'pdf' || file.mimetype.includes('pdf');

  const formatFileSize = (bytes: number) => {
    if (!bytes) return 'Unknown size';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const copyText = (text: string, formatName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(formatName);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  const getTimeRemaining = (expiresAt: number | null) => {
    if (!expiresAt) return null;
    const diff = expiresAt - Date.now();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m remaining`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#1e2327] border border-gray-200 dark:border-gray-700 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-900/40">
          <div className="flex items-center gap-2.5 min-w-0 pr-4">
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
              {isImage ? <ImageIcon className="w-5 h-5" /> : isVideo ? <Film className="w-5 h-5" /> : isAudio ? <Music className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                {file.originalName || file.filename}
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {formatFileSize(file.size)} • {file.mode === 'catbox' ? 'Permanent' : 'Litterbox'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={file.url}
              download={file.originalName || file.filename}
              className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Download file"
            >
              <Download className="w-4 h-4" />
            </a>
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Open direct URL"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Media Container */}
        <div className="p-6 flex-1 overflow-y-auto flex items-center justify-center bg-gray-100/50 dark:bg-black/30 min-h-[260px]">
          {isImage ? (
            <img
              src={file.url}
              alt={file.originalName}
              className="max-h-[50vh] max-w-full rounded-xl object-contain shadow-sm"
            />
          ) : isVideo ? (
            <video
              src={file.url}
              controls
              className="max-h-[50vh] max-w-full rounded-xl shadow-sm"
            />
          ) : isAudio ? (
            <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-500 flex items-center justify-center">
                  <Music className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                    {file.originalName}
                  </p>
                  <p className="text-xs text-gray-500">Audio playback</p>
                </div>
              </div>
              <audio src={file.url} controls className="w-full" />
            </div>
          ) : isPdf ? (
            <iframe
              src={file.url}
              title={file.originalName}
              className="w-full h-[50vh] rounded-xl border border-gray-200 dark:border-gray-700"
            />
          ) : (
            <div className="text-center p-8 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 mx-auto flex items-center justify-center">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {file.originalName}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Preview not available for this file type.
                </p>
              </div>
              <a
                href={file.url}
                download={file.originalName}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download File
              </a>
            </div>
          )}
        </div>

        {/* Info & Copy Formats Bar */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-800 space-y-4 bg-white dark:bg-[#1e2327]">
          {file.expiresAt && (
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/60">
              <Clock className="w-4 h-4" />
              <span>Litterbox Expiry: {getTimeRemaining(file.expiresAt)}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Direct Link:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={file.url}
                className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => copyText(file.url, 'direct')}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-1.5 transition-colors"
              >
                {copiedFormat === 'direct' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedFormat === 'direct' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Quick embed formats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => copyText(`![${file.originalName}](${file.url})`, 'markdown')}
              className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-left transition-colors flex items-center justify-between"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Markdown</span>
                <span className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate block">![name](url)</span>
              </div>
              {copiedFormat === 'markdown' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
            </button>

            <button
              type="button"
              onClick={() => copyText(`<img src="${file.url}" alt="${file.originalName}" />`, 'html')}
              className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-left transition-colors flex items-center justify-between"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">HTML Embed</span>
                <span className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate block">&lt;img src="..." /&gt;</span>
              </div>
              {copiedFormat === 'html' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
            </button>

            <button
              type="button"
              onClick={() => copyText(`[img]${file.url}[/img]`, 'bbcode')}
              className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-left transition-colors flex items-center justify-between"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">BBCode (Forums)</span>
                <span className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate block">[img]url[/img]</span>
              </div>
              {copiedFormat === 'bbcode' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800/80">
            <span className="text-[11px] text-gray-400 font-mono">
              File: {file.filename}
            </span>
            <button
              type="button"
              onClick={() => {
                if (confirm('Are you sure you want to delete this file?')) {
                  onDeleteFile(file.filename);
                  onClose();
                }
              }}
              className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-1 font-medium transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
