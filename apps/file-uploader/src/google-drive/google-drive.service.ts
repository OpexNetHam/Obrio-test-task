import { Inject, Injectable } from '@nestjs/common';
import { Readable } from 'stream';
import { google } from 'googleapis';
import axios from 'axios';
import { GoogleDriveConfig } from './types';
import { FileStorageProvider } from '../file-storage/interfaces/file-storage.interface';
import { GoogleAuth } from 'google-auth-library';
import { FileMetaData } from '../file-storage/types';
import { ErrorWithPayload } from '@app/common/errors/custom-error.util';

@Injectable()
export class GoogleDriveService implements FileStorageProvider {
  private folderId: string;
  private auth: GoogleAuth;
  private readonly CHUNK_SIZE = 256 * 1024;

  constructor(@Inject('CONFIG') private readonly config: GoogleDriveConfig) {
    this.folderId = this.config.folder_id;
    this.auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: this.config.client_email,
        private_key: this.config.private_key,
      },
      scopes: ['https://www.googleapis.com/auth/drive'],
    });
  }

  public async uploadFile(
    fileStream: Readable,
    metaData: FileMetaData
  ): Promise<string> {
    console.log('Starting uploadFile to Google Drive in chunked mode');
    let resumableUploadUrl: string | null = null;
    let bytesUploaded: number | null = null;

    return new Promise(async (resolve, reject) => {
      try {
        const {
          fileName,
          mimeType,
          fileSize,
        } = metaData;
  
        const accessToken = await this.getAuthToken();
  
        const fileMetadata = {
          name: fileName,
          mimeType,
          parents: [this.folderId],
        };
  
        resumableUploadUrl = await this.initResumableUpload(accessToken, fileMetadata, fileSize);
  
        fileStream.on('error', (error) => {
          console.error('Stream error during upload:', error);
          reject(new ErrorWithPayload(`Stream error: ${error.message}`, {
            resumableUploadUrl,
            bytesUploaded
          }));
        });
  
        const finalUploadResponse = await this.performChunkedUpload(fileStream, resumableUploadUrl, fileSize, mimeType);
        const fileId = finalUploadResponse?.data?.id;
        if (!fileId) {
          throw new Error('Failed to retrieve file ID from the final upload response.');
        }
        console.log(`File successfully uploaded. File ID: ${fileId}`);
  
        resolve(`https://drive.google.com/uc?id=${fileId}&export=download`);
      } catch (e: any) {
        reject(new Error(`Error uploading file: ${e.message}`));
      }
    });
  }

  private async performChunkedUpload(
    fileStream: Readable,
    resumableUploadUrl: string,
    fileSize: number,
    mimeType: string
  ) {
    let bytesUploaded = 0;
    let buffer = Buffer.alloc(0);
    let finalUploadResponse: any = null;
  
    try {
      for await (const data of fileStream) {
        buffer = Buffer.concat([buffer, data]);
  
        while (buffer.length >= this.CHUNK_SIZE) {
          const chunk = buffer.subarray(0, this.CHUNK_SIZE);
          const start = bytesUploaded;
          const end = bytesUploaded + chunk.length - 1;
  
          finalUploadResponse = await this.uploadChunk(
            resumableUploadUrl,
            buffer,
            start,
            end,
            fileSize,
            mimeType
          );
          bytesUploaded += chunk.length;
          buffer = buffer.subarray(this.CHUNK_SIZE);
        }
      }
  
      if (buffer.length > 0) {
        const start = bytesUploaded;
        const end = bytesUploaded + buffer.length - 1;
        finalUploadResponse = await this.uploadChunk(
          resumableUploadUrl,
          buffer,
          start,
          end,
          fileSize,
          mimeType
        );
        bytesUploaded += buffer.length;
      }
  
      if (bytesUploaded !== fileSize) {
        throw new Error(`Uploaded bytes (${bytesUploaded}) do not match file size (${fileSize}).`);
      }
  
      return finalUploadResponse;
    } catch (error) {
      throw new ErrorWithPayload(`Chunk upload interrupted: ${error.message}`, {
        bytesUploaded,
        resumableUploadUrl,
      });
    }
  }

  private async uploadChunk(
    resumableUploadUrl: string,
    chunk: Buffer,
    start: number,
    end: number,
    total: number,
    mimeType: string,
  ) {
    console.log(`Uploading chunk: bytes ${start}-${end}`);

    return await axios.put(resumableUploadUrl, chunk, {
      headers: {
        'Content-Length': chunk.length.toString(),
        'Content-Type': mimeType,
        'Content-Range': `bytes ${start}-${end}/${total}`,
      },
      onUploadProgress: (evt) => {
        console.log(`Chunk progress: ${evt.loaded}/${evt.total} bytes`);
      },
      validateStatus: (status) => status >= 200 && status < 300 || status === 308,
    });
  }

  private async initResumableUpload(accessToken: string, fileMetadata: any, fileSize: number) {
    const sessionInitResponse = await axios.post(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable',
      fileMetadata,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Upload-Content-Type': fileMetadata.mimeType,
          'X-Upload-Content-Length': fileSize.toString(),
        },
        validateStatus: (status) => status >= 200 && status < 300,
      },
    );

    const resumableUploadUrl = sessionInitResponse.headers.location;
    if (!resumableUploadUrl) {
      throw new ErrorWithPayload(`Failed to obtain resumable session URL from Google Drive`, {});
    }
    console.log(`Resumable session initiated. URL: ${resumableUploadUrl}`);
    return resumableUploadUrl;
  }

  private async getAuthToken() {
    const accessToken = await this.auth.getAccessToken();
    if (!accessToken) {
      throw new ErrorWithPayload(`Failed to obtain resumable session URL from Google Drive`, {});
    }
    return accessToken;
  }
}
