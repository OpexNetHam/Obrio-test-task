import { ModuleMetadata, Type } from '@nestjs/common';

export interface GoogleDriveModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useFactory?: (...args: any[]) => Promise<any> | any;
  inject?: any[];
}