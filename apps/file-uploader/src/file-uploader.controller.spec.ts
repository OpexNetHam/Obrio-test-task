import { Test, TestingModule } from '@nestjs/testing';
import { FileUploaderController } from './file-uploader.controller';
import { FileUploaderService } from './file-uploader.service';

describe('FileUploaderController', () => {
  let fileUploaderController: FileUploaderController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [FileUploaderController],
      providers: [FileUploaderService],
    }).compile();

    fileUploaderController = app.get<FileUploaderController>(FileUploaderController);
  });
});
