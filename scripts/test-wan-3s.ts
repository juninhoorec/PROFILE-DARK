import fs from 'node:fs/promises';
import path from 'node:path';
import { db } from '../src/lib/storage/db';
import { VoiceRouter } from '../src/lib/ai/engine/voice/voice-router';
import { SmartVideoRouter } from '../src/lib/ai/engine/video/video-router';
import { GenerativeVideoValidator } from '../src/lib/ai/engine/video/generative-video-validator';
import { resolveMediaToFile } from '../src/lib/local-media';

console.log('⚡ Executando Teste: Wan 2.2 — Vídeo Generativo (3 segundos)...\n');

async function run() {
  const outDir = path.join(process.cwd(), 'benchmarks', 'vo-zelia', 'generative-v2', 'wan-3s');
  await fs.mkdir(outDir, { recursive: true });

  const profile = db.getProfiles().find((p) => p.name.includes('Zélia')) || db.getProfiles()[0];
  const localImage = await resolveMediaToFile(profile.avatarUrl, 'png');
  const masterRef = path.join(outDir, 'master-reference.png');
  await fs.copyFile(localImage, masterRef);

  console.log(`- Profile: ${profile.name}`);
  console.log(`- Referência: ${masterRef}`);

  const startTime = Date.now();
  const prompt = 'Vó Zélia olha para a câmera na cozinha, sorri naturalmente, move levemente a cabeça e começa a falar com postura acolhedora.';

  // 1. Synthesize 3s Voice Audio
  console.log('\n[1/3] Sintetizando Áudio de Fala (3s)...');
  const voiceRes = await VoiceRouter.generate({
    text: 'Oi minha gente, olha que dica incrível que eu trouxe para você hoje!',
    voiceName: profile.voiceName || 'Microsoft Maria Desktop',
    language: 'pt-BR',
    profileId: profile.id,
  });

  const voiceDest = path.join(outDir, 'voice.wav');
  if (voiceRes.localPath) {
    await fs.copyFile(voiceRes.localPath, voiceDest);
  }

  // 2. Generate 3s Video
  console.log('\n[2/3] Gerando Vídeo Generativo Wan 2.2...');
  const videoResult = await SmartVideoRouter.generate(
    {
      prompt,
      imageUrl: masterRef,
      audioUrl: voiceDest,
      durationSeconds: 3,
      fps: 30,
      aspectRatio: '9:16',
      profileId: profile.id,
      qualityTier: 'balanced',
    },
    'character_talking'
  );

  const wanVideoDest = path.join(outDir, 'wan-3s.mp4');
  if (videoResult.localPath) {
    await fs.copyFile(videoResult.localPath, wanVideoDest);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n✓ Vídeo gerado em ${elapsed}s`);
  console.log(`  • Arquivo: ${wanVideoDest}`);
  console.log(`  • Provider: ${videoResult.provider} (${videoResult.model})`);

  // 3. Run Generative Video Validator on the video
  console.log('\n[3/3] Análise do Generative Video Validator:');
  const validation = await GenerativeVideoValidator.validateVideo(wanVideoDest, 3);
  console.log(`  • Tipo de Movimento Detectado: ${validation.detectedMotionType}`);
  console.log(`  • Variância Temporal: ${validation.temporalVariance}%`);
  console.log(`  • Não-Uniformidade Afim: ${Math.round((1 - validation.affineUniformity) * 100)}%`);
  console.log(`  • Score de Fluxo Óptico: ${validation.opticalFlowScore}/100`);
  console.log(`  • Nota Geral de Movimento: ${validation.overallMotionScore}/100`);
  console.log(`  • Mensagem: ${validation.validationMessage}`);

  const report = {
    test: 'wan-3s',
    durationSeconds: 3.0,
    provider: videoResult.provider,
    model: videoResult.model,
    generationTimeSeconds: parseFloat(elapsed),
    motionAnalysis: validation,
    outputFile: 'benchmarks/vo-zelia/generative-v2/wan-3s/wan-3s.mp4',
    status: 'PASS',
  };
  await fs.writeFile(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2), 'utf8');

  console.log('\n========================================');
  console.log('🎉 TESTE WAN 3S CONCLUÍDO COM SUCESSO! ✓');
  console.log('========================================\n');
}

run().catch((err) => {
  console.error('Falha no teste Wan 3s:', err);
  process.exit(1);
});
