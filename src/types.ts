export type UploadMode = 'catbox' | 'litterbox';

export type ExpiryOption = '1h' | '12h' | '24h' | '72h';
export type LitterboxRetention = ExpiryOption;

export interface FileRecord {
  id: string;
  originalName: string;
  filename: string;
  url: string;
  size: number;
  mimetype: string;
  createdAt: number;
  expiresAt: number | null;
  mode: UploadMode;
  userhash?: string;
}

export interface AlbumRecord {
  id: string;
  title: string;
  description: string;
  files: string[];
  createdAt: number;
  userhash?: string;
  fileRecords?: FileRecord[];
}

export interface UploadQueueItem {
  id: string;
  file?: File;
  name: string;
  size: number;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  resultUrl?: string;
  errorMessage?: string;
}

export type ActiveTab = 'upload' | 'url' | 'albums' | 'history' | 'api' | 'faq';

export interface ServerStats {
  totalFiles: number;
  totalSizeBytes: number;
  catboxFiles: number;
  litterboxFiles: number;
  albumsCount: number;
  serverTime: number;
}
