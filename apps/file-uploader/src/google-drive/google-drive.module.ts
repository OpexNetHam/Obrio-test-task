import { DynamicModule, Module } from "@nestjs/common";
import { GoogleDriveModuleAsyncOptions } from "./types/googleDrive.async.interface";
import { GoogleDriveService } from "./google-drive.service";


@Module({})
export class GoogleDriveModule {
  static registerAsync(options: GoogleDriveModuleAsyncOptions): DynamicModule {
    return {
      module: GoogleDriveModule,
      global: true,
      imports: options.imports,
      providers: [
        GoogleDriveService,
        {
          provide: 'CONFIG',
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
      ],
      exports: [GoogleDriveService],
    };
  }
}