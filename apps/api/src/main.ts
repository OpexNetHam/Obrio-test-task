import { NestFactory } from '@nestjs/core';
import { ApiModule } from './api.module';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(ApiModule);
  const configService = app.get(ConfigService)
  app.useGlobalPipes(new ValidationPipe)
  app.useLogger(app.get(Logger))
  
  const config = new DocumentBuilder()
  .setTitle('Files API')
  .setDescription('API for schedule file uploads')
  .setVersion('1.0')
  .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
  console.log(configService.get('PORT'))
  await app.listen(configService.get('PORT'), '0.0.0.0', () => {
    console.log('Nest application is listening on port 3000');
  });
}
bootstrap();
