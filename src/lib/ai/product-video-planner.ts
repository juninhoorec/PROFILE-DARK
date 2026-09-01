import type { Product, Profile } from '@/lib/types';

export type ProductVideoScene = {
  number: number;
  title: string;
  narration: string;
  motionPrompt: string;
};

const clean = (value: string, max = 90) => {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) return normalized;
  return normalized.slice(0, max + 1).replace(/\s+\S*$/, '').trim();
};

function spokenProductName(product: Product) {
  const raw = product.name.replace(/\|.*$/g, '').replace(/\b(compre|promoção|oferta)\b/gi, '').trim();
  const lower = raw.toLowerCase();
  if (/taç|copo/.test(lower)) {
    const style = /diamond|diamante/.test(lower) ? ' Diamond' : '';
    return `jogo de taças de vidro${style}`;
  }
  if (/lustre|pendente|luminária/.test(lower)) return clean(raw.match(/(?:lustre|pendente|luminária)[^,|]{0,35}/i)?.[0] || 'lustre decorativo', 42);
  return clean(raw.split(/\s+/).slice(0, 7).join(' '), 48);
}

function productFacts(product: Product) {
  const description = product.description.replace(/\r/g, '');
  const parts = description.split(/[\n.!]+/).map((item) => clean(item, 100)).filter((item) => item.length > 12 && !/^(compre|seja bem|escolha|temos|itens inclusos)/i.test(item));
  const benefit = parts.find((item) => /resistente|fácil|prátic|eleg|confort|econom|durá|potente|segur|qualidade|ideal|toque/i.test(item)) || parts[0] || `traz praticidade para o uso de ${product.category.toLowerCase()}`;
  const labeled = description.match(/(?:Material|Capacidade|Tamanho|Potência|Modelo|Cor):\s*[^\n.]+/gi)?.slice(0, 2).join(' e ');
  const feature = labeled || product.dna.keyFeatures.find((item) => item.length > 3) || 'acabamento bem cuidado e uso simples';
  return { benefit: clean(benefit, 68).replace(/[,:;]+$/g, ''), feature: clean(feature, 62).replace(/[,:;]+$/g, '') };
}

function interactionStyle(name: string, category: string) {
  const value = `${name} ${category}`.toLowerCase();
  if (/lustre|luminária|pendente|móvel|mesa|cadeira|sofá|armário|tapete|quadro/.test(value)) return {
    present: `fica ao lado do ${name} corretamente instalado no ambiente e aponta para ele`,
    demonstrate: `mostra o ${name} instalado, indica seus detalhes e demonstra seu efeito no ambiente`,
    detail: `se aproxima do ${name}, mostra um detalhe sem alterar sua instalação e retorna à posição`,
    close: `permanece ao lado do ${name}, mantém o produto totalmente visível e indica o link abaixo`,
  };
  if (/roupa|vestido|camisa|calça|sapato|tênis|bolsa|relógio|óculos|acessório/.test(value)) return {
    present: `apresenta o ${name} sendo usado corretamente e olha para a câmera`,
    demonstrate: `demonstra caimento, ajuste e uso real do ${name} com movimentos suaves`,
    detail: `aproxima um detalhe do ${name} da câmera sem deformá-lo e volta à posição`,
    close: `mantém o ${name} bem visível no corpo e indica discretamente o link abaixo`,
  };
  return {
    present: `segura o ${name} naturalmente junto ao corpo, olha para ele e depois para a câmera`,
    demonstrate: `demonstra lentamente como o ${name} é usado e aponta para sua parte principal`,
    detail: `aproxima o ${name} da câmera para mostrar um detalhe e volta à posição original`,
    close: `mantém o ${name} visível, sorri e faz um gesto discreto indicando o link abaixo`,
  };
}

export function createProductVideoPlan(profile: Profile, product: Product) {
  const name = spokenProductName(product);
  const category = clean(product.category || 'produto', 35);
  const { benefit, feature } = productFacts(product);
  const persona = clean((profile.dna.personality || profile.personality || 'confiante e experiente').split(/[.;]/)[0], 65);
  const setting = clean(profile.dna.environmentPreference || 'um ambiente realista relacionado ao produto', 100);
  const interaction = interactionStyle(name, category);
  const identity = `${profile.name}, especialista experiente em ${profile.niche}, com jeito ${persona}`;
  const common = `${identity}, fala diretamente para a câmera em ${setting}. Mantém exatamente o mesmo rosto, cabelo, roupa, ambiente e o mesmo ${name}. O produto permanece fiel à referência, sem mudar formato, cor, marca ou detalhes. Movimentos naturais, mãos anatomicamente corretas, câmera estável, sem cortes.`;

  const scenes: ProductVideoScene[] = [
    {
      number: 1,
      title: 'Apresentação do produto',
      narration: `Olha este ${name}. Eu conferi o que realmente importa.`,
      motionPrompt: `${common} ${interaction.present}, apresentando-o com segurança.`,
    },
    {
      number: 2,
      title: 'Benefício principal',
      narration: `${benefit}. Isso ajuda muito no dia a dia.`,
      motionPrompt: `${common} ${interaction.demonstrate} e reage com aprovação sincera.`,
    },
    {
      number: 3,
      title: 'Experiência e detalhe',
      narration: `Na prática, destaco ${feature}.`,
      motionPrompt: `${common} ${interaction.detail} com movimento suave.`,
    },
    {
      number: 4,
      title: 'Resposta à dúvida comum',
      narration: `Confira medidas e detalhes do anúncio para a sua necessidade.`,
      motionPrompt: `${common} mantém o ${name} em contexto real, aponta para dois detalhes importantes e confirma a orientação com expressão segura.`,
    },
    {
      number: 5,
      title: 'Recomendação e chamada',
      narration: `Gostou? Veja o link e escolha com segurança.`,
      motionPrompt: `${common} ${interaction.close}.`,
    },
  ];

  return {
    title: `${profile.name} apresenta ${name}`,
    productName: name,
    profileName: profile.name,
    durationSeconds: 20,
    scenes,
    fullScript: scenes.map((scene) => scene.narration).join(' '),
  };
}
