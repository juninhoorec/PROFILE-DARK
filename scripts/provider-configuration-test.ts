import { strict as assert } from 'node:assert';
import { SmartProviderRouter } from '../src/lib/ai/router/smart-provider-router';

async function run() {
  const keys=['GEMINI_API_KEY','OPENAI_API_KEY','ANTHROPIC_API_KEY','GROQ_API_KEY','FAL_KEY','REPLICATE_API_TOKEN','STABILITY_API_KEY','RUNWAY_API_KEY','LUMA_API_KEY','KLING_API_KEY','ELEVENLABS_API_KEY'] as const;
  const original=Object.fromEntries(keys.map(key=>[key,process.env[key]]));
  keys.forEach(key=>delete process.env[key]);
  const text = await SmartProviderRouter.generateText('Teste de configuração');
  const image = await SmartProviderRouter.generateImage('Teste de configuração');
  const voice = await SmartProviderRouter.generateVoice('Teste de configuração', 'Teste');
  const video = await SmartProviderRouter.generateVideo({ prompt:'Teste', durationSeconds:3, isSmokeTest:true });
  for (const result of [text,image,voice,video]) {
    assert.equal(result.success, false, 'Provider sem credencial não pode declarar sucesso.');
    assert.equal(result.error, 'provider_not_configured');
    assert.equal(result.costCredits, 0, 'Teste não configurado não pode cobrar créditos.');
  }
  assert(!video.data, 'Provider sem credencial não pode devolver vídeo de demonstração como output real.');
  process.env.OPENAI_API_KEY='test-key-that-must-never-be-called';
  process.env.RUNWAY_API_KEY='test-key-that-must-never-be-called';
  const configuredText=await SmartProviderRouter.generateText('Teste com adaptador não validado');
  const configuredImage=await SmartProviderRouter.generateImage('Teste com adaptador não validado');
  const configuredVoice=await SmartProviderRouter.generateVoice('Teste com adaptador não validado','alloy');
  const configuredVideo=await SmartProviderRouter.generateVideo({prompt:'Teste',durationSeconds:3,isSmokeTest:true});
  for(const result of [configuredText,configuredImage,configuredVoice,configuredVideo]) {
    assert.equal(result.success,false,'Uma chave presente não pode ativar uma resposta simulada.');
    assert.equal(result.error,'adapter_not_validated');
    assert.equal(result.costCredits,0);
    assert(!result.data,'Adaptador não validado não pode devolver mídia ou texto falso.');
  }
  for(const key of keys) { if(original[key]===undefined) delete process.env[key]; else process.env[key]=original[key]; }
  console.log('✓ Texto, imagem, voz e vídeo reportam corretamente “não configurado”');
  console.log('✓ Nenhum arquivo de demonstração foi apresentado como geração real');
  console.log('✓ Chaves presentes não ativam adaptadores simulados');
}

run().catch((error) => { console.error(error); process.exit(1); });
