import {strict as assert} from 'node:assert';
import {POST} from '../src/app/api/profiles/route';
import {db} from '../src/lib/storage/db';

async function run(){
  const body={name:'Profile de Deduplicação QA',niche:'QA Profissional',bio:'Especialista de teste com 12 anos de validação funcional.',personality:'Metódico, cético e orientado por evidência'};
  let id='';
  try{
    const first=await POST(new Request('http://localhost/api/profiles',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}));
    const firstData=await first.json();id=firstData.profile.id;
    const second=await POST(new Request('http://localhost/api/profiles',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}));
    const secondData=await second.json();
    assert.equal(first.status,201);assert.equal(second.status,200);assert.equal(secondData.reused,true);assert.equal(secondData.profile.id,id);
    assert.equal(db.getProfiles().filter(item=>item.name===body.name).length,1);
    console.log('✓ Criação repetida reutiliza o Profile sem duplicar cartões');
  }finally{if(id)db.deleteProfile(id);}
}
run().catch(error=>{console.error(error);process.exit(1)});
