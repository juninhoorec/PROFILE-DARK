import { strict as assert } from 'node:assert';
import { db } from '../src/lib/storage/db';
import { ImagePromptEngine } from '../src/lib/ai/engine/image/image-prompt-engine';
import { ProfileConsistencyEngine } from '../src/lib/ai/engine/image/profile-consistency-engine';

console.log('🧪 Executando Teste do Motor de Imagem (FLUX.2 / Qwen / Consistency Engine)...\n');

async function run() {
  const profile = db.getProfiles().find((p) => p.name.includes('Zélia')) || db.getProfiles()[0];
  console.log(`- Profile: ${profile.name} (Idade: ${profile.dna.ageApparent} anos)`);

  // 1. Test Prompt Expansion
  const promptOutput = ImagePromptEngine.buildPrompt({
    userPrompt: 'Vó Zélia na cozinha segurando um limpador multiuso',
    profile,
    shotType: 'portrait',
    realismLevel: 'ultra-realista',
    aspectRatio: '9:16',
  });

  console.log('\n[1/3] Validando Expansão de Prompt Realista:');
  assert(promptOutput.masterPrompt.includes('microtexture'), 'Deve incluir microtexturas de pele');
  assert(promptOutput.masterPrompt.includes('pores'), 'Deve incluir poros finos');
  assert(promptOutput.masterPrompt.includes('85mm'), 'Deve especificar lente de 85mm');
  assert(promptOutput.negativePrompt.includes('plastic skin'), 'Deve bloquear pele plástica no negative prompt');
  console.log('  ✓ Prompt cinematográfico estruturado gerado com sucesso');
  console.log('  ✓ Negative prompt com bloqueio de artefatos validado');

  // 2. Test Consistency Context & Reference Pack
  console.log('\n[2/3] Validando Profile Consistency Engine:');
  const conditioning = ProfileConsistencyEngine.buildConditioningContext(profile);
  assert(conditioning.profileId === profile.id, 'Contexto deve vincular ao ID do profile');
  assert(conditioning.permanentDNA.wardrobe !== undefined, 'DNA permanente de guarda-roupa deve existir');

  const refPack = ProfileConsistencyEngine.createInitialReferencePack(profile);
  assert(refPack.masterImage.isMaster === true, 'Foto mestre deve estar marcada como isMaster: true');
  console.log(`  ✓ Reference Pack inicial criado com foto mestre (${refPack.masterImage.label})`);

  // 3. Angle Prompt Validation
  console.log('\n[3/3] Validando Diretivas de Ângulos Múltiplos:');
  const angle3q = ProfileConsistencyEngine.getAnglePrompt('3-quarter-left', 'Prompt base');
  assert(angle3q.includes('3-QUARTER-LEFT'), 'Diretiva de 3/4 deve ser injetada');
  console.log('  ✓ Diretivas de ângulos múltiplos validadas com sucesso');

  console.log('\n========================================');
  console.log('🎉 TESTE DE IMAGEM CONCLUÍDO COM SUCESSO! ✓');
  console.log('========================================\n');
}

run().catch((err) => {
  console.error('Falha no teste de imagem:', err);
  process.exit(1);
});
