import React, { useState, useRef, useCallback } from 'react';
import { 
  Upload, 
  FileUp, 
  Clock, 
  Check, 
  Copy, 
  ExternalLink, 
  Eye, 
  AlertCircle, 
  Trash2, 
  CheckCheck,
  FileIcon,
  ImageIcon,
  VideoIcon,
  MusicIcon
} from 'lucide-react';
import { UploadMode, ExpiryOption, UploadQueueItem, FileRecord } from '../types';

interface UploadZoneProps {
  mode: UploadMode;
  setMode: (mode: UploadMode) => void;
  userhash: string;
  onFileUploaded: (file: FileRecord) => void;
  onPreviewFile: (file: FileRecord) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  mode,
  setMode,
  userhash,
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
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? {
                  ...q,
                  status: 'error',
                  errorMessage: `Upload failed: ${xhr.statusText || 'Server Error'}`,
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

    // Start upload for each file immediately
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
    setTimeout(() => setCopiedUrl(null), 2000);
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
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext || '')) {
      return <ImageIcon className="w-5 h-5 text-sky-500" />;
    }
    if (['mp4', 'webm', 'mov', 'mkv'].includes(ext || '')) {
      return <VideoIcon className="w-5 h-5 text-indigo-500" />;
    }
    if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext || '')) {
      return <MusicIcon className="w-5 h-5 text-emerald-500" />;
    }
    return <FileIcon className="w-5 h-5 text-amber-500" />;
  };

  const completedCount = queue.filter((q) => q.status === 'completed').length;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Mode Bar & Expiry Selector (if Litterbox) */}
      <div className="bg-white dark:bg-[#1e2327] rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className={`p-2.5 rounded-xl ${mode === 'catbox' ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400' : 'bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400'}`}>
            {mode === 'catbox' ? <Upload className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              {mode === 'catbox' ? 'Catbox Permanent Upload' : 'Litterbox Ephemeral Upload'}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {mode === 'catbox'
                ? 'Files stay forever. Max 200MB per file.'
                : 'Files automatically deleted after duration. Max 1GB per file.'}
            </p>
          </div>
        </div>

        {mode === 'litterbox' ? (
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Retention:</span>
            <div className="grid grid-cols-4 gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700 text-xs">
              {(['1h', '12h', '24h', '72h'] as ExpiryOption[]).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setExpiry(opt)}
                  className={`px-2.5 py-1 font-semibold rounded-lg transition-all ${
                    expiry === opt
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <span>Want temporary storage?</span>
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
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-sky-500 bg-sky-50/80 dark:bg-sky-950/40 scale-[1.01]'
            : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1e22] hover:border-sky-400 dark:hover:border-sky-600 shadow-sm'
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
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-transform ${
            isDragging ? 'scale-110 bg-sky-500 text-white' : 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400'
          }`}>
            <FileUp className="w-8 h-8 animate-bounce duration-1000" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              {isDragging ? 'Drop your files here to upload!' : 'Select or drop files here to upload'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Drag and drop multiple images, videos, audio, or files directly from your computer
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
              {mode === 'catbox' ? '200 MB Limit' : '1 GB Limit'}
            </span>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
              PNG, JPG, GIF, WebP, MP4, MP3, ZIP & more
            </span>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
              Direct hotlinking enabled
            </span>
          </div>
        </div>
      </div>

      {/* Upload Queue and Results */}
      {queue.length > 0 && (
        <div className="bg-white dark:bg-[#1e2327] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          {/* Header toolbar */}
          <div className="px-5 py-3.5 border-b border-gray-200 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3 bg-gray-50/50 dark:bg-gray-900/40">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                Upload Queue
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                {completedCount} / {queue.length} completed
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Link format selector */}
              <div className="flex items-center gap-1 bg-gray-200 dark:bg-gray-800 p-0.5 rounded-lg text-xs">
                {(['direct', 'markdown', 'html', 'bbcode'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setLinkFormat(fmt)}
                    className={`px-2 py-0.5 rounded-md font-medium capitalize transition-all ${
                      linkFormat === fmt
                        ? 'bg-white dark:bg-gray-700 text-sky-600 dark:text-sky-300 shadow-xs'
                        : 'text-gray-600 dark:text-gray-400'
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
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  {allCopied ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {allCopied ? 'All Copied!' : 'Copy All'}
                </button>
              )}

              <button
                type="button"
                onClick={() => setQueue([])}
                className="p-1.5 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Clear queue"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Queue Items List */}
          <div className="divide-y divide-gray-100 dark:divide-gray-800/60 max-h-96 overflow-y-auto">
            {queue.map((item) => {
              const formattedLink = item.resultUrl ? getFormatString(item.resultUrl, item.name) : '';
              return (
                <div
                  key={item.id}
                  className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                      {getFileIcon(item.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate max-w-xs">
                          {item.name}
                        </p>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400">
                          {formatFileSize(item.size)}
                        </span>
                      </div>

                      {/* Progress bar or error message */}
                      {item.status === 'uploading' && (
                        <div className="w-full mt-1.5">
                          <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 mb-1">
                            <span>Uploading...</span>
                            <span>{item.progress}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-sky-500 rounded-full transition-all duration-150"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {item.status === 'error' && (
                        <div className="flex items-center gap-1.5 text-xs text-rose-500 mt-1">
                          <AlertCircle className="w-3.5 h-3.5" />
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
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
                          copiedUrl === formattedLink
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                        title="Copy formatted link"
                      >
                        {copiedUrl === formattedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedUrl === formattedLink ? 'Copied' : 'Copy'}</span>
                      </button>

                      <a
                        href={item.resultUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-gray-500 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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
                        className="p-1.5 rounded-lg text-gray-500 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        title="Preview media"
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
