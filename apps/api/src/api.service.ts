import { FILE_UPLOADER_SERVICE, FilesRepository, UPLOAD_STATUS, UploadFilesDto } from '@app/common';
import { Inject, Injectable } from '@nestjs/common';
import { File } from '@app/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ApiService {
  constructor(
    private readonly filesRepository: FilesRepository,
    @Inject(FILE_UPLOADER_SERVICE) private readonly fileUploadService: ClientProxy
  ) {}

  async create(uploadFilesDto: UploadFilesDto) {
    const queuedFiles = [];

    for (const url of uploadFilesDto.urls) {
      try {
        const existingFile = await this.filesRepository.findOne({ originalUrl: url });
        if (existingFile) {
          console.log(`File already exists for URL: ${url}`, existingFile);
          queuedFiles.push(existingFile);
          continue;
        }

        const ackResponse = await firstValueFrom(
          this.fileUploadService.send('upload_file', { url })
        );

        if (ackResponse?.success) {
          const newFile = new File({
            originalUrl: url,
            status: UPLOAD_STATUS.QUEUED,
            created_at: new Date(),
          });

          const savedFile = await this.filesRepository.create(newFile);
          queuedFiles.push(savedFile);
        } else {
          console.error(`File not queued for URL: ${url}`, ackResponse);
        }
      } catch (error) {
        console.error(`Error queueing file: ${url}`, error);
      }
    }
    return queuedFiles;
  }

  async getAllUploadedFiles() {
    return this.filesRepository.find({status: UPLOAD_STATUS.COMPLETED});
  }

  async getAllFileStatuses() {
    return this.filesRepository.find();
  }
}
