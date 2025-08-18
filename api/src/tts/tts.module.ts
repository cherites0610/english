import { Module } from '@nestjs/common';
import { TtsServiceProvider } from './tts.provider';
import { GoogleTtsService } from './google-tts.service';
import { ElevenlabsTtsService } from './elevenlabs-tts.service';

@Module({
  providers: [TtsServiceProvider,GoogleTtsService,ElevenlabsTtsService],
  exports: [TtsServiceProvider]
})
export class TtsModule {}
