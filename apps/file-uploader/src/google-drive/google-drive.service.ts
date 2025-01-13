import { Inject, Injectable } from '@nestjs/common';
import { drive_v3, google } from 'googleapis';
import { Readable } from 'stream';
import { GoogleDriveConfig } from './types';
import { FileStorageProvider } from '../file-storage/interfaces/file-storage.interface';

@Injectable()
export class GoogleDriveService implements FileStorageProvider {
  private drive: drive_v3.Drive;
  private folderId: string;
  constructor(
    @Inject('CONFIG') private readonly config: GoogleDriveConfig,
  ) {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: this.config.client_email,
        private_key: this.config.private_key,
      },
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    this.drive = google.drive({ version: 'v3', auth });
    console.log(this.config.folder_id);
    this.folderId = this.config.folder_id;
  }

  public async uploadFile(
    fileStream: Readable,
    fileName: string,
    mimeType: string,
    resumable: boolean = false,
    totalBytes?: number,
  ): Promise<string> {
    console.log('Inside uploadFile to Google Drive');
    try {
      const fileMetadata = {
        name: fileName,
        mimeType,
        parents: [this.folderId],
      };

      const media = {
        mimeType,
        body: fileStream,
      };

      const driveResponse = await this.drive.files.create(
        {
          requestBody: fileMetadata,
          media,
          fields: 'id',
          uploadType: 'resumable',
        },
        {
          onUploadProgress: (evt: { bytesRead: number }) => {
            if (totalBytes) {
              const progress = ((evt.bytesRead / totalBytes) * 100).toFixed(2);
              console.log(`Resumable upload progress: ${progress}%`);
            } else {
              console.log(`Uploaded ${evt.bytesRead} bytes...`);
            }
          },
        },
        );

      const fileId = driveResponse.data.id;

      if (!fileId) {
        throw new Error('Failed to retrieve file ID from Google Drive response.');
      }

      await this.drive.permissions.create({
        fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });

      return `https://drive.google.com/uc?id=${fileId}&export=download`;
    } catch (e: any) {
      throw new Error(`Error uploading file: ${e.message}`);
    }
  }
}