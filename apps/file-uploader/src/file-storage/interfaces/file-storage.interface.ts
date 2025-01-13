import { Readable } from 'stream';

export interface FileStorageProvider {
    uploadFile(fileStream: Readable, fileName: string, mimeType: string, resumableStream?: boolean, fileSize?: number): Promise<string>;
}