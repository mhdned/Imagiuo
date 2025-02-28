import { Module } from '@nestjs/common';
import { ImageController } from './image.controller';
import { ImageService } from './image.service';
import { MulterModule } from '@nestjs/platform-express/multer';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ImageProcessingQueue } from 'src/queues/image-processing.queue';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

@Module({
  imports: [
    PrismaModule,
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        PORT: Joi.number().port().default(3000),
      }),
    }),
    MulterModule.register({
      storage: diskStorage({
        destination: process.env.UPLOAD_PATH ?? './uploads',
        filename: (req, file, cb) => {
          const extension = extname(file.originalname);
          const filename = `${Date.now()}${extension}`;
          cb(null, filename);
        },
      }),
    }),
  ],
  controllers: [ImageController],
  providers: [ImageService, ImageProcessingQueue],
  exports: [ImageProcessingQueue],
})
export class ImageModule {}
