import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { OrdersModule } from './orders/orders.module';
import { PiecesModule } from './pieces/pieces.module';
import { PartsModule } from './parts/parts.module';

@Module({
  imports: [
    UsersModule,
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),

        ssl: {
          rejectUnauthorized: false,
        },

        autoLoadEntities: true,

        synchronize: false,
      }),
    }),
    AuthModule,
    OrdersModule,
    PiecesModule,
    PartsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
