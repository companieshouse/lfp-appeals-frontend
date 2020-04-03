export type FileMetadata = {
    av_status: 'scanned' | 'not-scanned';
    content_type: string;
    id: string;
    name: string;
    size: number;
}