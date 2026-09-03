import React, { useState, useEffect } from 'react';
import { 
  FolderHeart, 
  Plus, 
  Check, 
  Copy, 
  ExternalLink, 
  Eye, 
  Image as ImageIcon, 
  Share2,
  Calendar,
  Layers,
  ArrowLeft
} from 'lucide-react';
import { AlbumRecord, FileRecord } from '../types';

interface AlbumManagerProps {
  files: FileRecord[];
  initialSelectedUrls?: string[];
  onPreviewFile: (file: FileRecord) => void;
  userhash: string;
}

export const AlbumManager: React.FC<AlbumManagerProps> = ({
  files,
  initialSelectedUrls = [],
  onPreviewFile,
  userhash,
}) => {
  const [albums, setAlbums] = useState<AlbumRecord[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(initialSelectedUrls.length > 0);
  const [activeAlbum, setActiveAlbum] = useState<AlbumRecord | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedUrls, setSelectedUrls] = useState<string[]>(initialSelectedUrls);
  const [loading, setLoading] = useState(false);
  const [copiedAlbumId, setCopiedAlbumId] = useState<string | null>(null);

  const fetchAlbums = async () => {
    try {
      const res = await fetch('/api/stats');
      // If we want to fetch user albums, we can use an endpoint or track in localStorage
      const saved = localStorage.getItem('catbox_albums');
      if (saved) {
        setAlbums(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchAlbums();
  }, []);

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || selectedUrls.length === 0) return;

    setLoading(true);
    try {
      const res = await fetch('/api/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          files: selectedUrls,
          userhash: userhash || undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.album) {
        const updated = [data.album, ...albums];
        setAlbums(updated);
        localStorage.setItem('catbox_albums', JSON.stringify(updated));
        setShowCreateModal(false);
        setTitle('');
        setDescription('');
        setSelectedUrls([]);
        setActiveAlbum(data.album);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyAlbumUrl = (albumId: string) => {
    const url = `${window.location.origin}/c/${albumId}`;
    navigator.clipboard.writeText(url);
    setCopiedAlbumId(albumId);
    setTimeout(() => setCopiedAlbumId(null), 2000);
  };

  const toggleUrl = (url: string) => {
    setSelectedUrls((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    );
  };

  // If viewing a specific album
  if (activeAlbum) {
    const albumFileRecords = activeAlbum.files.map((url) => {
      const existing = files.find((f) => f.url === url || f.filename === url.split('/').pop());
      return existing || {
        id: Math.random().toString(),
        originalName: url.split('/').pop() || 'file',
        filename: url.split('/').pop() || 'file',
        url,
        size: 0,
        mimetype: 'image/jpeg',
        createdAt: Date.now(),
        expiresAt: null,
        mode: 'catbox',
      };
    });

    return (
      <div className="w-full max-w-5xl mx-auto space-y-6">
        <div className="bg-white dark:bg-[#1e2327] rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
          <button
            type="button"
            onClick={() => setActiveAlbum(null)}
            className="flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to all albums
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {activeAlbum.title}
              </h2>
              {activeAlbum.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {activeAlbum.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => copyAlbumUrl(activeAlbum.id)}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-1.5 shadow-xs transition-colors"
              >
                {copiedAlbumId === activeAlbum.id ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copiedAlbumId === activeAlbum.id ? 'Album Link Copied!' : 'Share Album'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-2">
            {albumFileRecords.map((f, idx) => (
              <div
                key={idx}
                onClick={() => onPreviewFile(f)}
                className="group relative aspect-square rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 cursor-pointer border border-gray-200 dark:border-gray-700 shadow-xs hover:shadow-md transition-all"
              >
                <img
                  src={f.url}
                  alt={f.originalName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                  <p className="text-white text-xs font-medium truncate">
                    {f.originalName}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Top Card */}
      <div className="bg-white dark:bg-[#1e2327] rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <FolderHeart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Catbox Albums
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Create and share collections of your images and media
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-1.5 shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create New Album
        </button>
      </div>

      {/* Albums Grid */}
      {albums.length === 0 ? (
        <div className="bg-white dark:bg-[#1e2327] rounded-3xl p-12 text-center border border-gray-200 dark:border-gray-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-400 mx-auto flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            No albums created yet
          </p>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Group your uploaded artwork, photos, or screenshots into an album with a single shareable link.
          </p>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-sky-600 text-white hover:bg-sky-700"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Your First Album
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {albums.map((album) => (
            <div
              key={album.id}
              className="bg-white dark:bg-[#1e2327] rounded-3xl border border-gray-200 dark:border-gray-800 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">
                    {album.title}
                  </h3>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 flex-shrink-0">
                    {album.files.length} items
                  </span>
                </div>
                {album.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                    {album.description}
                  </p>
                )}
              </div>

              {/* Preview thumbnails strip */}
              <div className="grid grid-cols-3 gap-1.5 h-20 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 p-1">
                {album.files.slice(0, 3).map((url, i) => (
                  <div key={i} className="h-full rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
                    <img
                      src={url}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveAlbum(album)}
                  className="font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View Album
                </button>

                <button
                  type="button"
                  onClick={() => copyAlbumUrl(album.id)}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  title="Share album link"
                >
                  {copiedAlbumId === album.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Album Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-[#1e2327] border border-gray-200 dark:border-gray-700 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FolderHeart className="w-5 h-5 text-sky-500" />
              Create Catbox Album
            </h3>

            <form onSubmit={handleCreateAlbum} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Album Title:
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. My Wallpaper Collection"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Description (Optional):
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A short note about this album..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                />
              </div>

              {/* Select files from history */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Select Files ({selectedUrls.length} selected):
                </label>
                {files.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">
                    No uploaded files available yet. Upload files first or paste direct links below.
                  </p>
                ) : (
                  <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                    {files.map((file) => {
                      const isSelected = selectedUrls.includes(file.url);
                      return (
                        <div
                          key={file.id}
                          onClick={() => toggleUrl(file.url)}
                          className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                            isSelected
                              ? 'border-sky-500 ring-2 ring-sky-500/30'
                              : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <img
                            src={file.url}
                            alt={file.originalName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          {isSelected && (
                            <div className="absolute top-1 right-1 bg-sky-500 text-white rounded-full p-0.5 shadow-sm">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-2 text-xs rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !title.trim() || selectedUrls.length === 0}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white"
                >
                  {loading ? 'Creating...' : 'Create Album'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
