import { Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { Readable } from 'stream';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { FileStorageProvider } from './file-storage/interfaces/file-storage.interface';
import { FilesRepository, UPLOAD_STATUS } from '@app/common';

@Injectable()
export class FileUploaderService {
  constructor(
    @Inject('FileStorageProvider') private readonly fileStorageProvider: FileStorageProvider,
    private readonly filesRepository: FilesRepository,
  ){}


  public async initUpload(url: string) {
    const resumable = await this.checkRangeSupport(url);
    const { stream, name, mimeType, fileSize } = await this.formUploadData(url);
    const destUrl = await this.fileStorageProvider.uploadFile(stream, name, mimeType, resumable, fileSize);
    await this.filesRepository.findOneAndUpdate({originalUrl: url}, {
      status: UPLOAD_STATUS.COMPLETED,
      uploaded_at: new Date(),
      destUrl,
      name,
    });
  }

  private async formUploadData(
    url: string,
  ): Promise<{ name: string; mimeType: string; stream: Readable, resumableStream: boolean, fileSize: number }> {
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

      const resumableStream = await this.checkRangeSupport(url);
      const {
        fileName,
        mimeType,
        fileSize,
      } = this.parseHeaders(headResponse);

      const getResponse: AxiosResponse = await this.getFileStream(url);

      return {
        name: fileName,
        mimeType,
        stream: getResponse.data as Readable,
        resumableStream,
        fileSize,
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
      console.error(`Error checking Range support: ${error.message}`);
      return false;
    }
  }

  private async getFileStream(url: string, bytes?: number) {
    const options: AxiosRequestConfig = {
      responseType: 'stream'
    }
    if(bytes !== undefined) {
      options.headers = {
        Range: 'bytes=500-'
      }
    }
    return axios.get(url, options);
  }

  private parseHeaders(headResponse: AxiosResponse) {
    const mimeType = headResponse.headers['content-type'] || 'unknown';
    const contentDisposition = headResponse.headers['content-disposition'];
    let fileName = "Unknown";
    let fileSize = undefined;
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?(.+?)"?$/);
      if (match) {
        fileName = match[1];
      }
    }

    const fileSizeHeader = headResponse.headers['content-length'];
    if(fileSizeHeader) fileSize = parseInt(fileSizeHeader, 10);
    return {
      mimeType,
      fileName,
      fileSize,
    }
  }
}
