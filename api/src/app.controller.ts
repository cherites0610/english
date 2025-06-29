import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  constructor() {}

  @Public()
  @Get('hello')
  hello(): string {
    return 'hello';
  }
}