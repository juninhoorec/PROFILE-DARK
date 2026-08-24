console.log('🏁 Executando Suite de Testes PROFILE DARK...\n');

async function runAll() {
  console.log('--- 1/2 Smoke Tests ---');
  await import('./smoke-test');

  console.log('\n--- 2/2 Provider & 3s Video Tests ---');
  await import('./test-video-3s');

  console.log('\n✅ Todos os testes foram concluídos com 100% de sucesso!');
}

runAll().catch((err) => {
  console.error('Falha na suite de testes:', err);
  process.exit(1);
});
