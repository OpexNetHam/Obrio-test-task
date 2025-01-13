import { Module } from '@nestjs/common';
import { ApiController } from './api.controller';
import { ApiService } from './api.service';
import { DatabaseModule, FILE_UPLOADER_SERVICE, File, FilesRepository, LoggerModule } from '@app/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { ClientsModule, Transport } from '@nestjs/microservices';


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
    ClientsModule.registerAsync([
      {
        name: FILE_UPLOADER_SERVICE,
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [
              configService.getOrThrow<string>('RABBITMQ_URI')
            ],
            queue: 'uploader'
          }
        }),
        inject: [
          ConfigService
        ]
      }
    ])
  ],
  controllers: [ApiController],
  providers: [ApiService, FilesRepository],
})
export class ApiModule {}
