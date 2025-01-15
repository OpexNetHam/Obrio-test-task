import { Readable } from 'stream';
import { FileMetaData, ResumeUploadData } from '../types';

export interface FileStorageProvider {
    uploadFile(fileStream: Readable, metaData: FileMetaData, resumableUploadData?: ResumeUploadData): Promise<string>;
}