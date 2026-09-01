import { strict as assert } from 'node:assert';
import { ProfileProductMatcher } from '../src/lib/affiliate/profile-product-matcher';
import { PROFILE_ARCHETYPES, dnaFromArchetype, rankArchetypes } from '../src/lib/profile-archetypes';

const cases = [
  ['furadeira para obra', 'Mestre Naldo'],
  ['ração e brinquedo para cachorro pet', 'Biscoito Avalia'],
  ['consórcio de carro e imóvel', 'Renata Sem Letras Miúdas'],
  ['acessório para bicicleta de entregador', 'João no Corre'],
] as const;

assert(PROFILE_ARCHETYPES.length >= 15, 'O catálogo deve ser amplo.');
assert(new Set(PROFILE_ARCHETYPES.map((item) => item.personality)).size === PROFILE_ARCHETYPES.length, 'Cada Profile precisa ter personalidade única.');
assert(PROFILE_ARCHETYPES.every((item) => item.expertise.length > 45), 'Cada Profile precisa declarar experiência específica.');
for (const archetype of PROFILE_ARCHETYPES) {
  const generated = dnaFromArchetype(archetype, 'Produto de teste');
  assert.equal(generated.name, archetype.name);
  assert(generated.personality.length > 30, `${archetype.name} precisa de personalidade completa.`);
  assert(generated.speechPattern.length > 30, `${archetype.name} precisa de padrão de fala próprio.`);
  assert(generated.salesStyle.length > 20, `${archetype.name} precisa de estratégia comercial própria.`);
  assert.equal(generated.initialIdeas.length, 3, `${archetype.name} precisa de ideias iniciais.`);
}

for (const [brief, expected] of cases) {
  assert.equal(rankArchetypes(brief, 1)[0].name, expected, `Matcher contextual falhou para ${brief}.`);
}

const construction = rankArchetypes('furadeira profissional para obra e pedreiro', 1)[0];
const dna = dnaFromArchetype(construction, 'Furadeira profissional', 'Profissionais de obra');
assert(dna.personality.includes('bem-humorado'));
assert(dna.salesStyle.includes('técnica'));
assert(dna.initialIdeas.length === 3);

const matches = ProfileProductMatcher.suggest({
  name:'Furadeira profissional', brand:'Marca teste', category:'Construção e ferramentas', keyFeatures:['impacto'], colors:[], shape:'', packagingDetails:'',
  mainBenefits:['perfuração em obra'], problemSolved:'trabalho pesado', desireExploited:'produtividade', targetAudience:'pedreiros e mestres de obra',
  commonObjections:['durabilidade'], primaryDifferentiator:'resistência',
});
assert.equal(matches.length, 3, 'O afiliado deve sugerir exatamente três Profiles.');
assert.equal(new Set(matches.map((match) => match.id)).size, 3, 'As três sugestões precisam ser distintas.');
assert(matches.every((match) => match.rationale.length > 100), 'Cada sugestão precisa justificar experiência e contexto.');

console.log(`✓ ${PROFILE_ARCHETYPES.length} arquétipos únicos validados`);
console.log(`✓ DNA completo gerado e validado para todos os ${PROFILE_ARCHETYPES.length} arquétipos`);
console.log('✓ Matcher contextual validado em 4 categorias');
console.log('✓ Exatamente 3 sugestões distintas validadas');
