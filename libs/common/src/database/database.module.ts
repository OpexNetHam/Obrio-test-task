import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            useFactory: (configService: ConfigService) => ({
                type: 'postgres',
                host: configService.get('PG_HOST'),
                port: configService.get('PG_PORT'),
                username: configService.get('PG_USERNAME'),
                password: configService.get('PG_PASSWORD') || '',
                database: configService.get('PG_DATABASE') || '',
                autoLoadEntities: true,
                synchronize: true
            }),
            inject: [ConfigService]
        })
    ]
})
export class DatabaseModule {
    static forFeature(models: EntityClassOrSchema[]) {
        return TypeOrmModule.forFeature(models)
    }
}