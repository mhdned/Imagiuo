import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { createImageDTO } from './image.dto';

@Injectable()
export class ImageService {
  constructor(protected readonly prismaService: PrismaService) {}

  async create(imageData: createImageDTO) {
    const newImage = await this.prismaService.image.create({
      data: imageData,
    });

    return newImage;
  }

  async updateKeywords(
    imageId: string,
    keywords: { confidence: number; tag: { en: string } }[],
  ) {
    return await this.prismaService.image.update({
      where: { id: imageId },
      data: { keywords },
    });
  }
}
