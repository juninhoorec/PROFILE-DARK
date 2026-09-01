import { strict as assert } from 'node:assert';
import { db } from '../src/lib/storage/db';
import { Profile } from '../src/lib/types';
import { PROFILE_ARCHETYPES, dnaFromArchetype } from '../src/lib/profile-archetypes';

const id = 'prof_automated_persistence_test';
const now = new Date().toISOString();
const fixture: Profile = {
  id, name:'Profile de Teste Automatizado', avatarUrl:'https://example.com/profile.jpg', bio:'Especialista criado apenas para validar persistência.', niche:'Testes',
  personality:'Metódico e confiável', toneOfVoice:'Objetivo', voiceName:'Teste', realismScore:0, language:'pt-BR',
  characterLock:{face:false,age:false,hair:false,body:false,voice:false,personality:false}, references:[],
  dna:{name:'Profile de Teste Automatizado',ageApparent:30,nationality:'Brasileiro(a)',niche:'Testes',subNiche:'Persistência',personality:'Metódico e confiável',toneOfVoice:'Objetivo',speechPattern:'Frases curtas',visualAppearance:'A definir',wardrobeStyle:'A definir',environmentPreference:'A definir',voiceStyle:'Natural',voiceLanguage:'pt-BR',suggestedUsernames:['@profileteste'],targetAudience:'Equipe de QA',buyerPersona:'Testador',primaryCommercialGoal:'demonstracao',mainCTA:'Validar',secondaryCTA:'Revisar',salesStyle:'Demonstração',aggressivenessLevel:'sutil',editorialStrategy:'Teste',initialIdeas:['Teste']},
  createdAt:now, updatedAt:now,
};

try {
  db.saveProfile(fixture);
  assert.equal(db.getProfileById(id)?.name, fixture.name, 'Profile precisa persistir após criação.');
  db.saveProfile({...fixture,niche:'Testes atualizados'});
  assert.equal(db.getProfileById(id)?.niche, 'Testes atualizados', 'Edição precisa persistir.');
  assert(db.deleteProfile(id), 'Exclusão do fixture precisa funcionar.');
  assert.equal(db.getProfileById(id), undefined, 'Profile excluído não pode reaparecer.');
  console.log('✓ Persistência de criar, editar, recarregar e excluir validada');

  const catalogIds=PROFILE_ARCHETYPES.map(item=>`prof_catalog_test_${item.id}`);
  for(let index=0;index<PROFILE_ARCHETYPES.length;index+=1) {
    const archetype=PROFILE_ARCHETYPES[index];
    const catalogId=catalogIds[index];
    const dna=dnaFromArchetype(archetype,'Produto de validação',archetype.audience);
    db.saveProfile({id:catalogId,name:archetype.name,avatarUrl:archetype.avatarUrl,bio:`${archetype.role} — ${archetype.expertise}.`,niche:archetype.niche,personality:archetype.personality,toneOfVoice:archetype.tone,voiceName:`${archetype.name.split(' ')[0]} (Natural)`,realismScore:0,language:'Português (BR)',characterLock:{face:false,age:false,hair:false,body:false,voice:false,personality:false},dna,references:[],createdAt:now,updatedAt:now});
    const reloaded=db.getProfileById(catalogId);
    assert.equal(reloaded?.name,archetype.name,`${archetype.name} precisa persistir.`);
    assert.equal(reloaded?.dna.speechPattern,archetype.speechPattern,`${archetype.name} precisa preservar o padrão de fala.`);
    assert.equal(reloaded?.dna.salesStyle,archetype.salesStyle,`${archetype.name} precisa preservar a estratégia comercial.`);
  }
  assert.equal(new Set(catalogIds.map(catalogId=>db.getProfileById(catalogId)?.personality)).size,PROFILE_ARCHETYPES.length,'As personalidades persistidas precisam continuar únicas.');
  catalogIds.forEach(catalogId=>assert(db.deleteProfile(catalogId),`Fixture ${catalogId} precisa ser removido.`));
  console.log(`✓ Criação e recarga dos ${PROFILE_ARCHETYPES.length} personagens do catálogo validadas`);
} finally {
  if (db.getProfileById(id)) db.deleteProfile(id);
  PROFILE_ARCHETYPES.forEach(item=>{const catalogId=`prof_catalog_test_${item.id}`;if(db.getProfileById(catalogId))db.deleteProfile(catalogId);});
}
