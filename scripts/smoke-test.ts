import { db } from '../src/lib/storage/db';
import { PromptEnhancer } from '../src/lib/ai/prompt-enhancer';
import { CreativeDirector } from '../src/lib/ai/creative-director';
import { VisualInspector } from '../src/lib/ai/visual-inspector';
import { AIOrchestrator } from '../src/lib/ai/orchestrator';
import { SystemDoctor } from '../src/lib/ai/doctor/system-doctor';

console.log('🚀 Iniciando Smoke Test PROFILE DARK...\n');

let passed = 0;
let total = 0;

function assert(condition: boolean, testName: string) {
  total++;
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    process.exitCode = 1;
  }
}

async function run() {
  try {
    // 1. Database & Seed
    console.log('1. Testando Banco de Dados e Entidades...');
    const profiles = db.getProfiles();
    assert(profiles.length >= 1, 'Perfis carregados do banco');
    const luna = profiles.find((p) => p.name === 'Luna Star');
    assert(!!luna, 'Profile Luna Star existe com DNA completo');
    assert(luna?.characterLock.face === true, 'Character Lock de rosto está ativo');

    const products = db.getProducts();
    assert(products.length >= 1, 'Produtos carregados do banco');
    const perfume = products.find((p) => p.name.includes('Essence Noir'));
    assert(!!perfume, 'Produto Essence Noir existe com Product Lock');
    assert(perfume?.productLock.shape === true, 'Product Lock de formato está ativo');

    // 2. Prompt Enhancer
    console.log('\n2. Testando Prompt Enhancer com Sales Context...');
    const enhanceRes = PromptEnhancer.enhance({
      rawPrompt: 'Apresentar o perfume com elegância',
      profile: luna,
      product: perfume,
      objective: 'conversao',
      realismLevel: 'ultra-realista',
    });
    assert(enhanceRes.enhancedPrompt.includes('CINEMATIC COMMERCIAL SHOT'), 'Prompt otimizado gerou estrutura cinematográfica');
    assert(enhanceRes.enhancedPrompt.includes('Luna Star'), 'Prompt incluiu consistência do personagem');
    assert(enhanceRes.enhancedPrompt.includes('Essence Noir'), 'Prompt incluiu preservação do produto');

    // 3. Creative Director
    console.log('\n3. Testando Creative Director & Plano Criativo...');
    if (luna) {
      const plan = CreativeDirector.createPlan({
        profile: luna,
        product: perfume,
        prompt: 'Vídeo para lançamento de perfume',
        objective: 'conversao',
        funnelStage: 'meio',
        format: 'reels',
      });
      assert(plan.scenes.length === 3, 'Plano Criativo gerou 3 cenas estruturadas');
      assert(plan.hook.length > 5, 'Hook inicial gerado com sucesso');
      assert(plan.ctaText.length > 5, 'CTA comercial definida');
    }

    // 4. 3-Second Smoke Test Pipeline
    console.log('\n4. Testando 3-Second Video Smoke Test Pipeline...');
    if (luna) {
      const smokeJob = await AIOrchestrator.run3SecondTest(luna, perfume);
      assert(smokeJob.durationSeconds === 3, 'Duração controlada de 3 segundos');
      assert(smokeJob.isSmokeTest === true, 'Flag isSmokeTest ativa');
      assert(smokeJob.status === 'concluido', 'Render de teste 3s concluído');
      assert(!!smokeJob.videoUrl, 'URL de vídeo gerada no storage');

      // 5. AI Visual Inspector
      console.log('\n5. Testando AI Quality Inspector & Vision...');
      const qc = VisualInspector.inspect(smokeJob);
      assert(qc.metrics.realism >= 90, `Score de realismo aprovado (${qc.metrics.realism}/100)`);
      assert(qc.metrics.identity >= 90, `Score de identidade aprovado (${qc.metrics.identity}/100)`);
      assert(qc.metrics.overallQuality >= 90, `Score de qualidade geral aprovado (${qc.metrics.overallQuality}/100)`);
    }

    // 6. System Doctor Diagnostics
    console.log('\n6. Testando AI System Doctor...');
    const diag = SystemDoctor.diagnose();
    assert(diag.providers.length >= 4, 'Providers de IA diagnosticados');
    assert(diag.canRun3SecondTest === true, 'Capacidade de executar teste 3s confirmada');

    console.log(`\n========================================`);
    console.log(`🎉 SMOKE TEST FINALIZADO: ${passed}/${total} TESTES PASSARAM!`);
    console.log(`========================================\n`);
  } catch (err) {
    console.error('Erro crítico no smoke test:', err);
    process.exit(1);
  }
}

run();
