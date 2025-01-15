import { Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { Readable } from 'stream';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { FileStorageProvider } from './file-storage/interfaces/file-storage.interface';
import { FilesRepository, UPLOAD_STATUS } from '@app/common';
import { FileMetaData } from './file-storage/types';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FileUploaderService {
  private rabbitMqClient: ClientProxy;
  constructor(
    private readonly configService: ConfigService,
    @Inject('FileStorageProvider') private readonly fileStorageProvider: FileStorageProvider,
    private readonly filesRepository: FilesRepository,
  ){
    this.rabbitMqClient = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [this.configService.get<string>('RABBITMQ_URI')],
        queue: 'uploader',
        queueOptions: { durable: true },
      },
    });
  }


  public async initUpload(url: string, retryCount: number = 2, resumeUploadUrl?: string) {
    let isUploadComplete = false;
    try {
      let isResumable = false;
      let bytesUploaded = 0;

      const metaData = await this.formUploadData(url);

      if(resumeUploadUrl) {
        bytesUploaded = await this.getUploadedBytes(resumeUploadUrl, metaData.fileSize);
        isResumable = await this.checkRangeSupport(url);
      }
      
      const stream: Readable = await this.getFileStream(url, bytesUploaded);
      const destUrl = await this.fileStorageProvider.uploadFile(stream, metaData, isResumable ? {resumeUploadUrl, bytesUploaded} : null);
      isUploadComplete = true;
      await this.filesRepository.findOneAndUpdate({ originalUrl: url }, {
        status: UPLOAD_STATUS.COMPLETED,
        uploaded_at: new Date(),
        destUrl,
        name: metaData.fileName,
      });
    } catch (error) {
      console.error(`Error during file upload: ${error.message}`);
      if (!isUploadComplete) {
        const {
          resumeUploadUrl,
        } = error?.payload
        if (--retryCount > 0) {
          this.rabbitMqClient.emit('upload_file', { url, retryCount, resumeUploadUrl });
          console.log(`Retrying upload for ${url}. Remaining retries: ${retryCount}, resumeUploadUrl ${resumeUploadUrl}`);
        } else {
          await this.filesRepository.findOneAndUpdate({ originalUrl: url }, {
            status: UPLOAD_STATUS.FAILED,
          });
        }
      } else {
        // TODO: handle DB error;
        console.error(`Database update failed for ${url}.`);
      }

    }
  }

  private async formUploadData(
    url: string,
  ): Promise<FileMetaData> {
    try {
      const headResponse: AxiosResponse = await axios.head(url);

      if (headResponse.status !== 200) {
        await this.filesRepository.findOneAndUpdate({originalUrl: url}, {
          status: UPLOAD_STATUS.FAILED,
        });
        throw new HttpException(
          `File not found at URL: ${url}`,
          HttpStatus.NOT_FOUND,
        );
      }

      const {
        fileName,
        mimeType,
        fileSize,
      } = this.parseHeaders(headResponse);

      return {
        fileName,
        mimeType,
        fileSize
      };
    } catch (error) {
      throw new HttpException(
        `Error processing URL: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async checkRangeSupport(url: string): Promise<boolean> {
    try {
      const response = await axios.head(url, {
        headers: {
          Range: 'bytes=0-',
        },
      });
  
      const acceptRanges = response.headers['accept-ranges'];
      return acceptRanges === 'bytes';
    } catch (error) {
      console.error(`Error checking Range support: ${error.message}, lalalalalla`);
      return false;
    }
  }

  private async getFileStream(url: string, bytesUploaded?: number): Promise<Readable> {
    const options: AxiosRequestConfig = {
        responseType: 'stream',
    };

    if (bytesUploaded !== undefined) {
        options.headers = {
            Range: `bytes=${bytesUploaded}-`,
        };
    }

    const response = await axios.get(url, options);
    const stream = response.data as Readable;

    return stream;
}

  private parseHeaders(headResponse: AxiosResponse) {
    const mimeType = headResponse.headers['content-type'] || 'unknown';
    const contentDisposition = headResponse.headers['content-disposition'];
    let fileName = "Unknown";
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?(.+?)"?$/);
      if (match) {
        fileName = match[1];
      }
    }

    const fileSizeHeader = headResponse.headers['content-length'];
    if(!fileSizeHeader){
      throw new HttpException(
        `Error processing URL: Resumable upload not supported due to lack of content-length header`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } 
    const fileSize = parseInt(fileSizeHeader, 10);

    return {
      mimeType,
      fileName,
      fileSize,
    }
  }

  private async getUploadedBytes(resumeUploadUrl: string, fileSize: number): Promise<number> {
    try {
      const response = await axios.put(resumeUploadUrl, null, {
        headers: {
          'Content-Range': `bytes */${fileSize}`,
        },
        validateStatus: (status) => status === 200 || status === 201 || status === 308, // Acceptable statuses
      });
  
      // Handle 200 or 201 (Upload complete)
      if (response.status === 200 || response.status === 201) {
        console.log('Upload is already complete.');
        return fileSize; // Entire file has been uploaded
      }
  
      // Handle 308 (Resume incomplete)
      if (response.status === 308) {
        const rangeHeader = response.headers['range'];
        if (rangeHeader) {
          const match = rangeHeader.match(/bytes=(\d+)-(\d+)/);
          if (match) {
            return parseInt(match[2], 10) + 1; // Return the next byte position
          }
        }
        return 0; // No bytes have been uploaded yet
      }
  
      throw new Error('Unexpected response status.');
    } catch (error: any) {
      console.error('Error querying upload session:', error.response?.data || error.message);
      throw new Error('Failed to query upload session.');
    }
  }
}
