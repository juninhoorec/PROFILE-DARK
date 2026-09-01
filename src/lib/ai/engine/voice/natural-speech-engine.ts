export interface SpeechOptimizationOptions {
  speakerTone?: string;
  addBreaths?: boolean;
  addMicroPauses?: boolean;
  speedLevel?: 'calma' | 'natural' | 'dinamica';
}

export class NaturalSpeechEngine {
  /**
   * Transforms written text into spoken script with natural oral cadence,
   * subtle pauses, and conversational emphasis.
   */
  static optimizeForSpeech(
    text: string,
    options: SpeechOptimizationOptions = {}
  ): { spokenText: string; estimatedDurationSec: number; segments: string[] } {
    let clean = text.trim();

    // 1. Expand abbreviations and symbols in Portuguese
    clean = clean
      .replace(/\bvc\b/gi, 'você')
      .replace(/\bpq\b/gi, 'porque')
      .replace(/\btbm\b/gi, 'também')
      .replace(/\btd\b/gi, 'tudo')
      .replace(/\bq\b/gi, 'que')
      .replace(/\bblz\b/gi, 'beleza')
      .replace(/R\$\s*(\d+)(?:,(\d{2}))?/g, (_, int, dec) => {
        return dec && dec !== '00' ? `${int} reais e ${dec} centavos` : `${int} reais`;
      })
      .replace(/(\d+)%/g, '$1 por cento')
      .replace(/(\d+)x\b/gi, '$1 vezes');

    // 2. Add conversational pauses for natural breathing
    clean = clean
      .replace(/;\s*/g, '... ')
      .replace(/:\s*/g, '... ')
      .replace(/—\s*/g, '... ')
      .replace(/\s*-\s*/g, ', ')
      .replace(/\.{3,}/g, '... ');

    // 3. Break long compound sentences into natural spoken chunks
    const sentences = clean
      .split(/(?<=[.!?])\s+/)
      .filter((s) => s.trim().length > 0);

    const spokenSegments: string[] = [];
    for (const s of sentences) {
      const trimmed = s.trim();
      // If a sentence is very long (> 90 chars), insert slight oral pause at natural commas
      if (trimmed.length > 90 && trimmed.includes(',')) {
        spokenSegments.push(trimmed.replace(',', ', ...'));
      } else {
        spokenSegments.push(trimmed);
      }
    }

    const spokenText = spokenSegments.join(' ');

    // 4. Estimate duration: average spoken Portuguese rate is ~2.8 to 3.2 syllables/sec (approx 125-140 words/min)
    const wordCount = spokenText.split(/\s+/).filter(Boolean).length;
    const wordsPerMinute = options.speedLevel === 'calma' ? 120 : options.speedLevel === 'dinamica' ? 155 : 135;
    const estimatedDurationSec = Math.max(3, Math.round((wordCount / wordsPerMinute) * 60 * 10) / 10);

    return {
      spokenText,
      estimatedDurationSec,
      segments: spokenSegments,
    };
  }
}
