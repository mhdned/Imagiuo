import { Controller, Get, Render } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Render('app/alive')
  alive() {
    return {
      message: 'App is alive',
    };
  }
}
