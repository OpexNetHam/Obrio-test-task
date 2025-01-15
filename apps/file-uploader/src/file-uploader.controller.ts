import { Controller} from '@nestjs/common';
import { FileUploaderService } from './file-uploader.service';
import { Ctx, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';

@Controller()
export class FileUploaderController {
  constructor(
    private readonly fileUploaderService: FileUploaderService,
    ) {}

  @MessagePattern('upload_file')
  async uploadFiles(
    @Payload() data: { url: string, retryCount?: number, resumeUploadUrl?: string },
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    channel.ack(originalMsg);
    const response = { success: true, message: 'Message acknowledged' };
   
    this.fileUploaderService.initUpload(data.url, data.retryCount ? data.retryCount : 3, data.resumeUploadUrl);
    return response;
  }
}
