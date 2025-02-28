import axios from 'axios';
import { Queue, Worker, Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ImageService } from '../image/image.service';
import { createReadStream, createWriteStream } from 'fs';
import * as FormData from 'form-data';
import { join } from 'path';

@Injectable()
export class ImageProcessingQueue {
  private queue: Queue;

  private readonly UPLOAD_URL = 'https://api.imagga.com/v2/uploads';
  private readonly TAGGING_URL = 'https://api.imagga.com/v2/tags';
  private readonly UNSPLASH_API_URL = 'https://api.unsplash.com/search/photos';

  constructor(
    private readonly configService: ConfigService,
    private readonly imageService: ImageService,
  ) {
    this.queue = new Queue('image-processing', {
      connection: {
        host: this.configService.get<string>('REDIS_HOST'),
        port: this.configService.get<number>('REDIS_PORT'),
      },
    });

    new Worker(
      'image-processing',
      async (job: Job) => {
        const { imagePath, imageId } = job.data;
        const keywords: { confidence: number; tag: { en: string } }[] =
          await this.extractKeywords(imagePath);
        await this.imageService.updateKeywords(imageId, keywords);
        const imageUrls = await this.searchImagesFromUnsplash(
          keywords.map((keyword) => keyword.tag.en).join(' '),
        );
        for (const url of imageUrls) {
          await this.downloadImage(url, imageId);
        }
      },
      {
        connection: {
          host: this.configService.get<string>('REDIS_HOST'),
          port: this.configService.get<number>('REDIS_PORT'),
        },
      },
    );
  }

  private async searchImagesFromUnsplash(query: string): Promise<string[]> {
    try {
      const accessKey =
        this.configService.get<string>('UNSPLASH_ACCESS_KEY') ?? '';

      const response = await axios.get(this.UNSPLASH_API_URL, {
        params: {
          query: query,
          per_page: 2,
          client_id: accessKey,
        },
      });

      const imageUrls = response.data.results.map(
        (result: any) => result.urls.full,
      );
      return imageUrls;
    } catch (error) {
      console.error('Error searching for images from Unsplash:', error);
      return [];
    }
  }

  private async downloadImage(url: string, imageId: string): Promise<void> {
    try {
      const response = await axios.get(url, { responseType: 'stream' });
      const filePath = join(__dirname, 'images', `${imageId}.jpg`);

      const writer = createWriteStream(filePath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  }

  async addJob(imagePath: string, imageId: string) {
    return await this.queue.add('process-image', { imagePath, imageId });
  }

  private async extractKeywords(imagePath: string): Promise<[]> {
    try {
      const apiKey = this.configService.get<string>('IMAGGA_API_KEY') ?? '';
      const apiSecret =
        this.configService.get<string>('IMAGGA_API_SECRET') ?? '';

      const form = new FormData();
      form.append('image', createReadStream(imagePath));

      const uploadImageToImagga = await axios.post(this.UPLOAD_URL, form, {
        auth: {
          username: apiKey,
          password: apiSecret,
        },
        headers: form.getHeaders(),
      });

      const uploadId = uploadImageToImagga.data.result.upload_id;

      const taggingImageFromImagga = await axios.get(
        `${this.TAGGING_URL}?image_upload_id=${uploadId}`,
        {
          auth: {
            username: apiKey,
            password: apiSecret,
          },
        },
      );

      const filteredTags = taggingImageFromImagga.data.result.tags
        .filter((tag) => tag.confidence > 20)
        .slice(0, 5);

      return filteredTags;
    } catch (error) {
      console.error('Error extracting keywords:', error);
      return [];
    }
  }

  async getJobStatus(jobId: string) {
    const job = await this.queue.getJob(jobId);
    if (!job) return { status: 'not found' };

    const state = await job.getState();
    const progress = job.progress;
    const result = await job.returnvalue;

    return { status: state, progress, result };
  }
}
