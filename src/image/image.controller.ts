import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseFilePipeBuilder,
  Post,
  Render,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageService } from './image.service';
import { createImageDTO } from './image.dto';
import { ImageProcessingQueue } from '../queues/image-processing.queue';

@Controller('image')
export class ImageController {
  constructor(
    protected readonly imageService: ImageService,
    protected readonly imageQueue: ImageProcessingQueue,
  ) {}

  @Get()
  @Render('image/uploadForm')
  async uploadForm() {
    return { message: 'upload form' };
  }

  @Post('')
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /(jpeg|jpg|png)$/i,
        })
        .addMaxSizeValidator({
          maxSize: 1024 * 1024 * 2,
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    image: Express.Multer.File,
  ) {
    const { filename, mimetype, path, size } = image;
    const imageData: createImageDTO = { filename, mimetype, path, size };
    const newImage = await this.imageService.create(imageData);
    const job = await this.imageQueue.addJob(path, newImage.id);
    return {
      message: 'Image uploaded successfully, processing started',
      jobId: job.id,
    };
  }

  @Get('status/:id')
  async getJobStatus(@Param('id') jobId: string) {
    return await this.imageQueue.getJobStatus(jobId);
  }
}
