import { Module } from '@nestjs/common';
import { FileUploaderController } from './file-uploader.controller';
import { FileUploaderService } from './file-uploader.service';
import { DatabaseModule, FilesRepository, LoggerModule, File } from '@app/common';
import { ConfigModule } from '@nestjs/config';
import { GoogleDriveModule } from './google-drive/google-drive.module';
import { FileStorageModule } from './file-storage/file-storage.module';
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        RABBITMQ_URI: Joi.string().required(),
        PG_HOST: Joi.string().required(),
        PG_PORT: Joi.number().required(),
        PG_USERNAME: Joi.string().required(),
        PG_PASSWORD: Joi.string().required(),
        PG_DATABASE: Joi.string().required(),
        PORT: Joi.number().required(),
      })
    }),
    DatabaseModule,
    DatabaseModule.forFeature([File]),
    LoggerModule,
    GoogleDriveModule,
    FileStorageModule.register('googleDrive'),
  ],
  controllers: [FileUploaderController],
  providers: [FileUploaderService, FilesRepository],
})
export class FileUploaderModule {}
