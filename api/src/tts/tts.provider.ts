// 在 app.module.ts 或一個新的 tts.module.ts 中
import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ElevenlabsTtsService } from './elevenlabs-tts.service';
import { GoogleTtsService } from './google-tts.service';
import { TtsService } from './tts.interface';
export const TtsServiceProvider: Provider = {
  provide: 'TtsService', // 提供一個 Token
  useFactory: (
    configService: ConfigService,
    googleTts: GoogleTtsService,
    elevenlabsTts: ElevenlabsTtsService,
  ): TtsService => { // 返回的類型是我們的介面
    const provider = configService.get<string>('TTS_PROVIDER');
    if (provider === 'ELEVENLABS') {
      return elevenlabsTts;
    }
    // 預設返回 Google
    return googleTts;
  },
  inject: [ConfigService, GoogleTtsService, ElevenlabsTtsService],
};