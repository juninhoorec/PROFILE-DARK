import { strict as assert } from 'node:assert';
import fs from 'node:fs/promises';
import { db } from '../src/lib/storage/db';
import { NaturalSpeechEngine } from '../src/lib/ai/engine/voice/natural-speech-engine';
import { VoiceRouter } from '../src/lib/ai/engine/voice/voice-router';

console.log('🧪 Executando Teste do Motor de Voz (Chatterbox / CosyVoice / Natural Speech)...\n');

async function run() {
  const profile = db.getProfiles().find((p) => p.name.includes('Zélia')) || db.getProfiles()[0];
  console.log(`- Profile: ${profile.name} (Voz: ${profile.voiceName})`);

  // 1. Test Natural Speech Engine
  console.log('\n[1/3] Validando Conversão de Texto Escrito em Fala Natural:');
  const rawScript = 'Oi vc tbm achou que isso aqui por R$ 50 era só propaganda?';
  const { spokenText, estimatedDurationSec, segments } = NaturalSpeechEngine.optimizeForSpeech(rawScript);

  assert(!spokenText.includes('vc'), 'Abreviação "vc" deve ser expandida para "você"');
  assert(!spokenText.includes('tbm'), 'Abreviação "tbm" deve ser expandida para "também"');
  assert(spokenText.includes('50 reais'), 'Valores em R$ devem ser convertidos em texto oral');
  console.log(`  • Script bruto: "${rawScript}"`);
  console.log(`  • Fala natural: "${spokenText}"`);
  console.log(`  • Duração estimada: ${estimatedDurationSec}s`);
  console.log('  ✓ Conversão de cadência oral validada');

  // 2. Test Voice Synthesis & File Persistence
  console.log('\n[2/3] Sintetizando Áudio Real (5–8 segundos):');
  const result = await VoiceRouter.runVoiceTest(profile);

  console.log(`  • Audio URL: ${result.audioUrl}`);
  console.log(`  • Arquivo Local: ${result.localPath}`);
  console.log(`  • Duração Real: ${result.durationSeconds}s`);
  console.log(`  • Taxa de Amostragem: ${result.sampleRate} Hz`);
  console.log(`  • Provider Utilizado: ${result.provider}`);

  assert(result.audioUrl.startsWith('/api/uploads/'), 'URL de áudio deve ser válida no app');
  assert(result.durationSeconds >= 2, 'Duração do áudio deve ser no mínimo de 2 segundos');

  if (result.localPath) {
    const stats = await fs.stat(result.localPath);
    assert(stats.size > 1000, 'Arquivo de áudio deve existir em disco com conteúdo');
    console.log(`  ✓ Arquivo persistido em disco (${Math.round(stats.size / 1024)} KB)`);
  }

  // 3. Test Timestamps for Alignment
  console.log('\n[3/3] Validando Timestamps para Alinhamento & Legendas:');
  assert(Array.isArray(result.wordTimestamps), 'Timestamps de palavras devem ser gerados');
  assert(result.wordTimestamps.length > 0, 'Deve conter palavras com marcas temporais');
  console.log(`  ✓ ${result.wordTimestamps.length} palavras mapeadas com timestamps (Início: ${result.wordTimestamps[0].startSec}s -> Fim: ${result.wordTimestamps[result.wordTimestamps.length - 1].endSec}s)`);

  console.log('\n========================================');
  console.log('🎉 TESTE DE VOZ CONCLUÍDO COM SUCESSO! ✓');
  console.log('========================================\n');
}

run().catch((err) => {
  console.error('Falha no teste de voz:', err);
  process.exit(1);
});
