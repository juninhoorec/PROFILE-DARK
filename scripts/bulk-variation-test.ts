import { strict as assert } from 'node:assert';
import { BulkVariationEngine } from '../src/lib/ai/bulk-variation-engine';

const matrix = BulkVariationEngine.create(20, ['hook', 'script', 'scenario', 'cta', 'wardrobe', 'framing', 'copy', 'duration']);
assert.equal(matrix.length, 20, 'A matriz deve respeitar a quantidade solicitada.');
assert.equal(new Set(matrix.map((item) => item.signature)).size, 20, 'Cada vídeo deve ter uma assinatura única.');
assert(new Set(matrix.map((item) => item.angle)).size > 1, 'Roteiro precisa variar o ângulo narrativo.');
assert(new Set(matrix.map((item) => item.cta)).size > 1, 'CTA/copy precisa variar o fechamento.');
assert(new Set(matrix.map((item) => item.scenario)).size > 1, 'Cenário precisa variar visualmente.');

assert.throws(
  () => BulkVariationEngine.create(10, ['framing']),
  /não produz variações suficientemente diferentes/,
  'A engine deve bloquear uma matriz repetitiva.',
);

console.log('✓ 20 variações únicas validadas');
console.log('✓ Matriz repetitiva bloqueada antes da geração');
