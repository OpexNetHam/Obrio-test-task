import { DynamicModule, Module, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileStorageProvider } from './interfaces/file-storage.interface';
import { GoogleDriveService } from '../google-drive/google-drive.service';


@Module({})
export class FileStorageModule {
  static register(provider: 'googleDrive'): DynamicModule {
    const providers: Provider[] = [
      {
        provide: 'FileStorageProvider',
        useFactory: (configService: ConfigService): FileStorageProvider => {
          if (provider === 'googleDrive') {
            return new GoogleDriveService(
              {
                client_email: configService.get<string>('GOOGLE_CLIENT_EMAIL'),
                private_key: configService.get<string>('GOOGLE_PRIVATE_KEY').replace(/\\n/g, '\n'),
                folder_id: configService.get<string>('GOOGLE_DRIVE_FOLDER_ID'),
                rabbitMqUri: configService.get<string>('RABBITMQ_URI'),
              },
              
            );
          }
          throw new Error(`Unsupported provider: ${provider}`);
        },
        inject: [ConfigService],
      },
    ];

    return {
      module: FileStorageModule,
      providers,
      exports: providers,
    };
  }
}