import { SmartProviderRouter } from '../src/lib/ai/router/smart-provider-router';

console.log('🤖 Testando Conectividade dos Providers de IA...\n');

async function testProviders() {
  console.log('1. Testando LLM / Text Provider...');
  const textRes = await SmartProviderRouter.generateText('Teste de texto');
  console.log(`  ✓ LLM: ${textRes.provider}/${textRes.model} (${textRes.latencyMs}ms)`);

  console.log('\n2. Testando Image Provider...');
  const imgRes = await SmartProviderRouter.generateImage('Teste de imagem');
  console.log(`  ✓ Image: ${imgRes.provider}/${imgRes.model} (${imgRes.latencyMs}ms)`);

  console.log('\n3. Testando Voice / TTS Provider...');
  const voiceRes = await SmartProviderRouter.generateVoice('Teste de voz', 'Luna (Natural)');
  console.log(`  ✓ Voice: ${voiceRes.provider}/${voiceRes.model} (${voiceRes.latencyMs}ms)`);

  console.log('\n4. Testando Video Provider (Smoke Test 3s)...');
  const videoRes = await SmartProviderRouter.generateVideo({
    prompt: 'Teste controlado de vídeo',
    durationSeconds: 3,
    isSmokeTest: true,
  });
  console.log(`  ✓ Video: ${videoRes.provider}/${videoRes.model} (${videoRes.latencyMs}ms)`);

  console.log('\n🎉 Todos os providers responderam operacionalmente!\n');
}

testProviders();
