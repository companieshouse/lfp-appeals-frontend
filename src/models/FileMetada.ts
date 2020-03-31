export type FileMetada = {
    av_status: 'scanned' | 'not-scanned';
    content_type: string;
    id: string;
    links: {
        download: string;
        self: string;
    },
    name: string;
    size: number;
}