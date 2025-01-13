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
    @Payload() data: { url: string },
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    channel.ack(originalMsg);
    const response = { success: true, message: 'Message acknowledged' };

    this.fileUploaderService.initUpload(data.url);

    console.log('before return')
    return response;
  }
}
