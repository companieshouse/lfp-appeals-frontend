export type FileMetadata = {
    id: string;
    name: string;
    content_type: string;
    size: number;
    av_status: 'not-scanned' | 'clean' | 'infected';
}
