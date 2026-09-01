import { VoiceGenerateParams, VoiceGenerateResult, VoiceProvider } from '../interfaces';
import { chatterboxVoiceProvider } from '../../providers/chatterbox-voice-provider';
import { cosyVoiceProvider } from '../../providers/cosyvoice-provider';
import { windowsTTSProvider } from '../../providers/windows-tts-provider';
import { Profile } from '../../../types';

export interface VoiceProfile {
  providerId: string;
  voiceName: string;
  voiceReferenceUrl?: string;
  language: string; // pt-BR
  accent: string;
  speed: number;
  energy: number;
  emotion: 'neutral' | 'friendly' | 'excited' | 'authoritative' | 'calm';
  style: string;
  isAuthorizedVoiceClone: boolean;
}

export class VoiceRouter {
  private static providers: VoiceProvider[] = [
    chatterboxVoiceProvider,
    cosyVoiceProvider,
    windowsTTSProvider,
  ];

  static selectProvider(preferredProviderId?: string): VoiceProvider {
    if (preferredProviderId) {
      const found = this.providers.find((p) => p.id === preferredProviderId);
      if (found) return found;
    }
    // Default to Chatterbox Multilingual for PT-BR
    return chatterboxVoiceProvider;
  }

  static async generate(params: VoiceGenerateParams, preferredProviderId?: string): Promise<VoiceGenerateResult> {
    const selected = this.selectProvider(preferredProviderId);
    try {
      return await selected.generateVoice(params);
    } catch (err) {
      console.warn(`Primary voice provider (${selected.name}) failed, attempting fallback:`, err);
      // Fallback to local Windows SAPI TTS
      return await windowsTTSProvider.generateVoice(params);
    }
  }

  /**
   * Generates a 5-8 second voice test clip for a profile (Spec 17).
   */
  static async runVoiceTest(profile: Profile, customPhrase?: string): Promise<VoiceGenerateResult> {
    const phrase =
      customPhrase ||
      `Oi, eu sou a ${profile.name}. Deixa eu te mostrar uma coisa que facilitou muito a minha rotina.`;

    return this.generate({
      text: phrase,
      voiceName: profile.voiceName || 'Microsoft Maria Desktop',
      language: 'pt-BR',
      speed: 1.0,
      profileId: profile.id,
      emotion: 'friendly',
    });
  }
}
