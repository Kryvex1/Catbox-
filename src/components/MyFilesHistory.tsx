import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Search, 
  Copy, 
  Check, 
  ExternalLink, 
  Eye, 
  Trash2, 
  FolderPlus, 
  Image as ImageIcon,
  Film,
  Music,
  FileText,
  Clock,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { animate, stagger } from 'animejs';
import { FileRecord } from '../types';

interface MyFilesHistoryProps {
  files: FileRecord[];
  onPreviewFile: (file: FileRecord) => void;
  onDeleteFile: (filename: string) => void;
  onCreateAlbumFromFiles: (selectedUrls: string[]) => void;
}

export const MyFilesHistory: React.FC<MyFilesHistoryProps> = ({
  files,
  onPreviewFile,
  onDeleteFile,
  onCreateAlbumFromFiles,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video' | 'audio' | 'doc'>('all');
  const [selectedFilenames, setSelectedFilenames] = useState<string[]>([]);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  useEffect(() => {
    animate('.file-row-item', {
      translateY: [10, 0],
      opacity: [0, 1],
      ease: 'outQuad',
      duration: 350,
      delay: stagger(30, { start: 50 }),
    });
  }, [filterType, searchTerm, files.length]);

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCategory = (file: FileRecord) => {
    const ext = file.filename.split('.').pop()?.toLowerCase() || '';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif'].includes(ext) || file.mimetype.startsWith('image/')) return 'image';
    if (['mp4', 'webm', 'mov', 'mkv'].includes(ext) || file.mimetype.startsWith('video/')) return 'video';
    if (['mp3', 'wav', 'ogg', 'flac'].includes(ext) || file.mimetype.startsWith('audio/')) return 'audio';
    return 'doc';
  };

  const filteredFiles = files.filter((f) => {
    const matchesSearch = (f.originalName || f.filename).toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (filterType === 'all') return true;
    return getCategory(f) === filterType;
  });

  const toggleSelect = (filename: string) => {
    setSelectedFilenames((prev) =>
      prev.includes(filename) ? prev.filter((name) => name !== filename) : [...prev, filename]
    );
  };

  const selectAll = () => {
    if (selectedFilenames.length === filteredFiles.length) {
      setSelectedFilenames([]);
    } else {
      setSelectedFilenames(filteredFiles.map((f) => f.filename));
    }
  };

  const copyUrl = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedUrl(link);
    setTimeout(() => setCopiedUrl(null), 1800);
  };

  const handleCreateAlbum = () => {
    const selectedUrls = files
      .filter((f) => selectedFilenames.includes(f.filename))
      .map((f) => f.url);
    if (selectedUrls.length === 0) return;
    onCreateAlbumFromFiles(selectedUrls);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Top Controls Card */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Uploaded Files Archive
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {files.length} active files synced to Catbox CDN
              </p>
            </div>
          </div>

          {selectedFilenames.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">
                {selectedFilenames.length} selected
              </span>
              <button
                type="button"
                onClick={handleCreateAlbum}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                Create Album
              </button>
            </div>
          )}
        </div>

        {/* Filter and Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search files by name..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            {(['all', 'image', 'video', 'audio', 'doc'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFilterType(type)}
                className={`px-3 py-1 rounded-lg font-medium capitalize transition-all whitespace-nowrap ${
                  filterType === type
                    ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {type === 'all' ? 'All' : type === 'image' ? 'Images' : type === 'video' ? 'Videos' : type === 'audio' ? 'Audio' : 'Docs'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Files Grid / List */}
      {filteredFiles.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            No files found
          </p>
          <p className="text-xs text-slate-400">
            {searchTerm ? 'Try searching with another keyword.' : 'Upload your first file using the Upload tab above!'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-slate-950/40">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedFilenames.length === filteredFiles.length && filteredFiles.length > 0}
                onChange={selectAll}
                className="rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
              />
              <span>File Details</span>
            </div>
            <span>Actions</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredFiles.map((file) => {
              const isSelected = selectedFilenames.includes(file.filename);
              const cat = getCategory(file);

              return (
                <div
                  key={file.id}
                  className={`file-row-item p-4 flex items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                    isSelected ? 'bg-sky-50/40 dark:bg-sky-950/20' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(file.filename)}
                      className="rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                    />

                    {/* Thumbnail or Icon */}
                    <div 
                      onClick={() => onPreviewFile(file)}
                      className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center flex-shrink-0 cursor-pointer border border-slate-200 dark:border-slate-700 hover:opacity-80 transition-opacity"
                    >
                      {cat === 'image' ? (
                        <img
                          src={file.url}
                          alt={file.originalName}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : cat === 'video' ? (
                        <Film className="w-5 h-5 text-indigo-500" />
                      ) : cat === 'audio' ? (
                        <Music className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <FileText className="w-5 h-5 text-amber-500" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p
                          onClick={() => onPreviewFile(file)}
                          className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate hover:text-sky-600 dark:hover:text-sky-400 cursor-pointer"
                          title={file.originalName || file.filename}
                        >
                          {file.originalName || file.filename}
                        </p>
                        {file.mode === 'litterbox' ? (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center gap-0.5 font-mono">
                            <Clock className="w-2.5 h-2.5" />
                            Litterbox
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-mono">
                            Catbox CDN
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span className="truncate max-w-[200px]">{file.filename}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => copyUrl(file.url)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-xl flex items-center gap-1 transition-colors ${
                        copiedUrl === file.url
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                      title="Copy Direct Link"
                    >
                      {copiedUrl === file.url ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">{copiedUrl === file.url ? 'Copied' : 'Copy'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onPreviewFile(file)}
                      className="p-1.5 rounded-xl text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Preview Media"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-xl text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Open in new tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Delete file "${file.originalName || file.filename}"?`)) {
                          onDeleteFile(file.filename);
                        }
                      }}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Delete file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
