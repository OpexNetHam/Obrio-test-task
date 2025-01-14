import { Readable } from 'stream';

export interface ResumableFileUploadResult {
  destUrl: string;
  resumableUploadUrl: string;
}

export interface SimpleFileUploadResult {
  destUrl: string;
}

export type FileUploadResult = ResumableFileUploadResult | SimpleFileUploadResult;

export interface FileStorageProvider<T extends FileUploadResult = FileUploadResult> {
  uploadFile(
    fileStream: Readable, 
    fileName: string, 
    mimeType: string, 
    ...args: T extends ResumableFileUploadResult ? [resumableStream: boolean, fileSize: number, bytesUploaded?: number] : []
  ): Promise<T>;
}