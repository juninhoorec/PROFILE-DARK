export type VariationKey = 'hook'|'script'|'scenario'|'cta'|'wardrobe'|'framing'|'copy'|'duration';
export type BulkVariation = { index:number; hook:string; scenario:string; cta:string; angle:string; wardrobe:string; framing:string; durationSeconds:number; signature:string };

const catalog = {
  hook:['Pare de comprar sem testar isto primeiro','O detalhe que quase ninguém verifica','Eu usei em uma situação real e aconteceu isto','Vale o preço ou é só propaganda?','Três segundos para entender a diferença','O erro mais comum ao escolher este produto','Teste rápido antes de você decidir'],
  scenario:['rotina matinal em casa','ambiente profissional durante o trabalho','comparação lado a lado em bancada real','uso cotidiano gravado com smartphone','teste externo em luz natural'],
  cta:['Veja os detalhes no link da bio','Compare as opções antes de decidir','Confira medidas, preço e condições no link','Salve este teste e veja a oferta oficial','Comente sua dúvida e consulte o link oficial'],
  angle:['Problema e solução','Demonstração prática','Review sincero','Custo-benefício','Quebra de objeção','Rotina e contexto','Comparação visual'],
  wardrobe:['roupa profissional coerente com o Profile','visual casual de rotina','uniforme funcional do nicho','roupa neutra sem marcas concorrentes'],
  framing:['plano médio vertical de smartphone','close nas mãos e no produto','POV de uso real','plano aberto mostrando o contexto'],
  duration:[15,20,24,30],
};

export class BulkVariationEngine {
  static create(quantity:number, enabled:VariationKey[]):BulkVariation[] {
    const active=new Set(enabled);
    const shouldVary=(key:keyof typeof catalog)=>{
      if(key==='angle') return active.has('script');
      if(key==='cta') return active.has('cta') || active.has('copy');
      return active.has(key as VariationKey);
    };
    const variations=Array.from({length:quantity},(_,index)=>{
      const pick=<T,>(key:keyof typeof catalog, offset:number)=>catalog[key][shouldVary(key)?(index*offset+offset)%catalog[key].length:0] as T;
      const item={index:index+1,hook:pick<string>('hook',1),scenario:pick<string>('scenario',2),cta:pick<string>('cta',3),angle:pick<string>('angle',4),wardrobe:pick<string>('wardrobe',3),framing:pick<string>('framing',1),durationSeconds:pick<number>('duration',1),signature:''};
      item.signature=[item.hook,item.scenario,item.cta,item.angle,item.wardrobe,item.framing,item.durationSeconds].join('|');
      return item;
    });
    const signatures=new Set(variations.map(item=>item.signature));
    if(signatures.size!==variations.length) throw new Error('A combinação selecionada não produz variações suficientemente diferentes. Ative mais dimensões.');
    return variations;
  }
}
