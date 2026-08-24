import { spawnSync } from 'child_process';

console.log('🏁 Executando Suite de Testes PROFILE DARK...\n');

console.log('--- 1/2 Smoke Tests ---');
const smoke = spawnSync('node', ['scripts/smoke-test.mjs'], { stdio: 'inherit' });
if (smoke.status !== 0) {
  console.error('Smoke tests falharam.');
  process.exit(smoke.status || 1);
}

console.log('\n--- 2/2 Provider & 3s Video Tests ---');
const video = spawnSync('node', ['scripts/test-video-3s.mjs'], { stdio: 'inherit' });
if (video.status !== 0) {
  console.error('Testes de vídeo falharam.');
  process.exit(video.status || 1);
}

console.log('\n✅ Todos os testes foram concluídos com 100% de sucesso!');
