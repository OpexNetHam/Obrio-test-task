import { Readable } from 'stream';
import { FileMetaData } from '../types';

export interface FileStorageProvider {
    uploadFile(fileStream: Readable, metaData: FileMetaData): Promise<string>;
}