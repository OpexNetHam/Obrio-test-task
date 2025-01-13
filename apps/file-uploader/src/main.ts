import { NestFactory } from '@nestjs/core';
import { FileUploaderModule } from './file-uploader.module';
import { ValidationPipe } from '@nestjs/common';
import { Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(FileUploaderModule);
  const configService = app.get(ConfigService);
  app.useGlobalPipes(new ValidationPipe);
  app.useLogger(app.get(Logger));
  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [
        configService.getOrThrow('RABBITMQ_URI')
      ],
      queue: 'uploader',
      noAck: false,
    }
  })
  await app.startAllMicroservices();
}
bootstrap();
