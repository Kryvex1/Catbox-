import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  UploadCloud, 
  Clock, 
  Check, 
  Copy, 
  ExternalLink, 
  Eye, 
  AlertCircle, 
  Trash2, 
  CheckCheck,
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  Music as MusicIcon,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  FolderPlus
} from 'lucide-react';
import { animate, stagger } from 'animejs';
import { UploadMode, ExpiryOption, UploadQueueItem, FileRecord, DEFAULT_MASTER_USERHASH } from '../types';
import { animateHeroTypography } from '../lib/animations';

interface UploadZoneProps {
  mode: UploadMode;
  setMode: (mode: UploadMode) => void;
  userhash: string;
  onOpenUserhashModal?: () => void;
  onFileUploaded: (file: FileRecord) => void;
  onPreviewFile: (file: FileRecord) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  mode,
  setMode,
  userhash,
  onOpenUserhashModal,
  onFileUploaded,
  onPreviewFile,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [expiry, setExpiry] = useState<ExpiryOption>('24h');
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [allCopied, setAllCopied] = useState(false);
  const [linkFormat, setLinkFormat] = useState<'direct' | 'markdown' | 'html' | 'bbcode'>('direct');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeHash = userhash.trim() || DEFAULT_MASTER_USERHASH;
  const isMasterHash = !userhash.trim() || userhash.trim() === DEFAULT_MASTER_USERHASH;

  // Kinetic typography entrance on mount
  useEffect(() => {
    animateHeroTypography('#upload-hero-title', '#upload-hero-subtitle');
  }, []);

  // Animate queue items entrance
  useEffect(() => {
    if (queue.length > 0) {
      animate('.upload-queue-card', {
        translateY: [12, 0],
        opacity: [0, 1],
        ease: 'outExpo',
        duration: 400,
        delay: stagger(40),
      });
    }
  }, [queue.length]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFormatString = (url: string, filename: string) => {
    switch (linkFormat) {
      case 'markdown':
        return `![${filename}](${url})`;
      case 'html':
        return `<img src="${url}" alt="${filename}" />`;
      case 'bbcode':
        return `[img]${url}[/img]`;
      case 'direct':
      default:
        return url;
    }
  };

  const uploadSingleFile = (item: UploadQueueItem) => {
    if (!item.file) return;

    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('files', item.file);
    formData.append('mode', mode);
    formData.append('autoFallback', 'true');
    if (mode === 'litterbox') {
      formData.append('time', expiry);
    }
    if (userhash) {
      formData.append('userhash', userhash);
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, progress: percent } : q))
        );
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          const uploadedRecord = res.files?.[0];
          if (uploadedRecord) {
            setQueue((prev) =>
              prev.map((q) =>
                q.id === item.id
                  ? {
                      ...q,
                      progress: 100,
                      status: 'completed',
                      resultUrl: uploadedRecord.url,
                    }
                  : q
              )
            );
            onFileUploaded(uploadedRecord);
          }
        } catch {
          setQueue((prev) =>
            prev.map((q) =>
              q.id === item.id
                ? { ...q, status: 'error', errorMessage: 'Invalid server response' }
                : q
            )
          );
        }
      } else {
        let errMessage = `Upload failed: ${xhr.statusText || 'Server Error'}`;
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.error) errMessage = res.error;
        } catch {}

        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? {
                  ...q,
                  status: 'error',
                  errorMessage: errMessage,
                }
              : q
          )
        );
      }
    };

    xhr.onerror = () => {
      setQueue((prev) =>
        prev.map((q) =>
          q.id === item.id
            ? { ...q, status: 'error', errorMessage: 'Network connection lost' }
            : q
        )
      );
    };

    xhr.open('POST', '/api/upload');
    xhr.send(formData);
  };

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newItems: UploadQueueItem[] = Array.from(files).map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'uploading',
    }));

    setQueue((prev) => [...newItems, ...prev]);

    newItems.forEach((item) => {
      uploadSingleFile(item);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  }, [mode, expiry, userhash]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(text);
    setTimeout(() => setCopiedUrl(null), 1800);
  };

  const copyAllCompletedLinks = () => {
    const urls = queue
      .filter((q) => q.status === 'completed' && q.resultUrl)
      .map((q) => getFormatString(q.resultUrl!, q.name))
      .join('\n');

    if (!urls) return;
    navigator.clipboard.writeText(urls);
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 2000);
  };

  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif'].includes(ext || '')) {
      return <ImageIcon className="w-5 h-5 text-sky-500" />;
    }
    if (['mp4', 'webm', 'mov', 'mkv'].includes(ext || '')) {
      return <VideoIcon className="w-5 h-5 text-indigo-500" />;
    }
    if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext || '')) {
      return <MusicIcon className="w-5 h-5 text-emerald-500" />;
    }
    return <FileText className="w-5 h-5 text-amber-500" />;
  };

  const completedCount = queue.filter((q) => q.status === 'completed').length;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Official Master Account Active Bar */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Official Catbox Routing Active
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 font-semibold">
                {isMasterHash ? 'Master Account' : 'Custom Account'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Files upload directly to Catbox CDN ({activeHash.slice(0, 10)}...) with direct permanent hotlinks.
            </p>
          </div>
        </div>

        {onOpenUserhashModal && (
          <button
            type="button"
            onClick={onOpenUserhashModal}
            className="self-end sm:self-auto px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            Change Hash
          </button>
        )}
      </div>

      {/* Mode Bar & Expiry Selector (if Litterbox) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className={`p-2.5 rounded-xl ${mode === 'catbox' ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'}`}>
            {mode === 'catbox' ? <Zap className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {mode === 'catbox' ? 'Catbox Permanent Upload' : 'Litterbox Ephemeral Upload'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {mode === 'catbox'
                ? 'Files stay forever on files.catbox.moe. Up to 200MB per file.'
                : 'Files automatically deleted after duration. Up to 1GB per file.'}
            </p>
          </div>
        </div>

        {mode === 'litterbox' ? (
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Expiry:</span>
            <div className="grid grid-cols-4 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              {(['1h', '12h', '24h', '72h'] as ExpiryOption[]).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setExpiry(opt)}
                  className={`px-2.5 py-1 font-semibold rounded-lg transition-all ${
                    expiry === opt
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span>Need temporary storage?</span>
            <button
              onClick={() => setMode('litterbox')}
              className="text-sky-600 dark:text-sky-400 font-semibold hover:underline"
            >
              Switch to Litterbox
            </button>
          </div>
        )}
      </div>

      {/* Main Drag-and-Drop Area */}
      <div
        id="upload-dropzone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-sky-500 bg-sky-50/80 dark:bg-sky-950/40 scale-[1.01]'
            : 'border-slate-300 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xs hover:border-sky-400 dark:hover:border-sky-600 shadow-xs'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFilesSelected(e.target.files)}
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-transform shadow-md ${
            isDragging 
              ? 'scale-110 bg-sky-600 text-white' 
              : 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20'
          }`}>
            <UploadCloud className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 id="upload-hero-title" className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {isDragging ? 'Drop your files here to start upload' : 'Click to select or drag and drop files here'}
            </h3>
            <p id="upload-hero-subtitle" className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              High performance upload pipeline with automatic official Catbox hash routing and multi-format link generation.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
              {mode === 'catbox' ? '200 MB Limit' : '1 GB Limit'}
            </span>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
              Images, Videos, Audio, Archives & Code
            </span>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
              Direct CDN Hotlinks
            </span>
          </div>
        </div>
      </div>

      {/* Upload Queue and Results */}
      {queue.length > 0 && (
        <div className="upload-queue-card bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Header toolbar */}
          <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-950/50">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Upload Queue
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                {completedCount} / {queue.length} completed
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Link format selector */}
              <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-800 p-0.5 rounded-xl text-xs">
                {(['direct', 'markdown', 'html', 'bbcode'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setLinkFormat(fmt)}
                    className={`px-2.5 py-1 rounded-lg font-medium uppercase text-[10px] tracking-wider transition-all ${
                      linkFormat === fmt
                        ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>

              {completedCount > 0 && (
                <button
                  type="button"
                  onClick={copyAllCompletedLinks}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  {allCopied ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {allCopied ? 'All Copied' : 'Copy All'}
                </button>
              )}

              <button
                type="button"
                onClick={() => setQueue([])}
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Clear queue"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Queue Items List */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-96 overflow-y-auto">
            {queue.map((item) => {
              const formattedLink = item.resultUrl ? getFormatString(item.resultUrl, item.name) : '';
              return (
                <div
                  key={item.id}
                  className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                      {getFileIcon(item.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate max-w-xs">
                          {item.name}
                        </p>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          {formatFileSize(item.size)}
                        </span>
                      </div>

                      {/* Progress bar or error message */}
                      {item.status === 'uploading' && (
                        <div className="w-full mt-1.5">
                          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1 font-mono">
                            <span>Uploading to Catbox CDN...</span>
                            <span>{item.progress}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-sky-500 rounded-full transition-all duration-150"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {item.status === 'error' && (
                        <div className="flex items-center gap-1.5 text-xs text-rose-500 mt-1">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{item.errorMessage || 'Failed to upload'}</span>
                        </div>
                      )}

                      {item.status === 'completed' && item.resultUrl && (
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="text-[11px] font-mono text-sky-600 dark:text-sky-400 truncate max-w-sm">
                            {formattedLink}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions for completed item */}
                  {item.status === 'completed' && item.resultUrl && (
                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(formattedLink)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors ${
                          copiedUrl === formattedLink
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                        title="Copy link"
                      >
                        {copiedUrl === formattedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedUrl === formattedLink ? 'Copied' : 'Copy'}</span>
                      </button>

                      <a
                        href={item.resultUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-xl text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Open direct file link"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>

                      <button
                        type="button"
                        onClick={() => {
                          const fn = item.resultUrl!.split('/').pop() || item.name;
                          onPreviewFile({
                            id: item.id,
                            originalName: item.name,
                            filename: fn,
                            url: item.resultUrl!,
                            size: item.size,
                            mimetype: item.file?.type || '',
                            createdAt: Date.now(),
                            expiresAt: null,
                            mode: mode,
                          });
                        }}
                        className="p-1.5 rounded-xl text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Preview file"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
