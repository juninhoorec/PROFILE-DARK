import { Product, Profile } from '../../types';

export interface CreativePlan {
  projectId: string;
  title: string;
  commercialAngle: 'PROBLEM_SOLUTION' | 'REVIEW_EXPERIENCE' | 'LIFESTYLE_DEMO';
  fullScript: string;
  scenes: Array<{
    sceneNumber: number;
    title: string;
    durationSeconds: number;
    shotType: 'talking_head' | 'product_closeup' | 'product_interaction' | 'b_roll' | 'cta_talking';
    prompt: string;
    narration: string;
    isTalkingHead: boolean;
  }>;
}

export interface BatchCreativePlanResult {
  plans: CreativePlan[];
  antiDuplicationScore: number;
  isDiversityApproved: boolean;
  summary: string;
}

export class BatchCreativeDirector {
  /**
   * Generates 3 diverse commercial video plans locking Profile & Product while varying angles.
   */
  static generateBatchPlans(params: {
    profile: Profile;
    product: Product;
    campaignId?: string;
  }): BatchCreativePlanResult {
    const { profile, product, campaignId } = params;

    // Angle 1: Problem -> Solution
    const planA: CreativePlan = {
      projectId: `proj_a_${Date.now()}`,
      title: `${profile.name} — Problema & Solução: ${product.name}`,
      commercialAngle: 'PROBLEM_SOLUTION',
      fullScript: `Gente do céu, quem aguenta perder tempo esfregando as coisas na cozinha? Eu vivia passando aperto até conhecer o ${product.name}. Ele resolve tudo em segundos, sem esforço e deixa um acabamento impecável. Dá uma olhada nesse brilho! Garanta o seu no link aqui embaixo antes que acabe.`,
      scenes: [
        {
          sceneNumber: 1,
          title: 'Cena 1 — Gancho na Dor Cotidiana',
          durationSeconds: 4,
          shotType: 'talking_head',
          prompt: `${profile.name} olhando para a câmera com expressão de alívio e simpatia na cozinha.`,
          narration: `Gente do céu, quem aguenta perder tempo com tarefas demoradas na cozinha?`,
          isTalkingHead: true,
        },
        {
          sceneNumber: 2,
          title: 'Cena 2 — Apresentação do Produto',
          durationSeconds: 4,
          shotType: 'product_closeup',
          prompt: `Close-up nítido e iluminado de ${product.name} sobre a bancada.`,
          narration: `Eu vivia passando aperto até conhecer o ${product.name}.`,
          isTalkingHead: false,
        },
        {
          sceneNumber: 3,
          title: 'Cena 3 — Demonstração Rápida',
          durationSeconds: 5,
          shotType: 'product_interaction',
          prompt: `${profile.name} segurando ${product.name} com a mão direita e aplicando na bancada.`,
          narration: `Ele resolve tudo em segundos, com total praticidade e sem esforço.`,
          isTalkingHead: false,
        },
        {
          sceneNumber: 4,
          title: 'Cena 4 — Transformação & Prova Visual',
          durationSeconds: 4,
          shotType: 'b_roll',
          prompt: `Bancada brilhando limpa, reflexo suave de luz natural.`,
          narration: `Dá uma olhada nesse resultado impecável na primeira passada!`,
          isTalkingHead: false,
        },
        {
          sceneNumber: 5,
          title: 'Cena 5 — CTA & Fechamento',
          durationSeconds: 5,
          shotType: 'cta_talking',
          prompt: `${profile.name} sorrindo, fazendo gesto de aprovação para a câmera.`,
          narration: `Garanta o seu no link aqui embaixo agora mesmo com desconto especial!`,
          isTalkingHead: true,
        },
      ],
    };

    // Angle 2: Review / Experience
    const planB: CreativePlan = {
      projectId: `proj_b_${Date.now()}`,
      title: `${profile.name} — Review Sincero: ${product.name}`,
      commercialAngle: 'REVIEW_EXPERIENCE',
      fullScript: `Muita gente me pediu para testar o ${product.name}, e hoje eu vim trazer o meu review sincero. A qualidade do material me impressionou de cara, o encaixe na mão é super ergonômico e a durabilidade é excelente. Vale cada centavo investido. O link seguro com a melhor oferta está aqui embaixo.`,
      scenes: [
        {
          sceneNumber: 1,
          title: 'Cena 1 — Gancho de Credibilidade',
          durationSeconds: 4,
          shotType: 'talking_head',
          prompt: `${profile.name} segurando o produto e conversando de forma autêntica e confiável.`,
          narration: `Muita gente me pediu para testar o ${product.name}, e hoje eu trouxe meu review sincero.`,
          isTalkingHead: true,
        },
        {
          sceneNumber: 2,
          title: 'Cena 2 — Detalhes Construtivos',
          durationSeconds: 4,
          shotType: 'product_closeup',
          prompt: `Macro cinematográfico destacando acabamento, bordas e rótulo de ${product.name}.`,
          narration: `A qualidade do material me impressionou de cara, acabamento impecável.`,
          isTalkingHead: false,
        },
        {
          sceneNumber: 3,
          title: 'Cena 3 — Teste Prático de Uso',
          durationSeconds: 5,
          shotType: 'product_interaction',
          prompt: `${profile.name} demonstrando o manuseio natural de ${product.name}.`,
          narration: `O encaixe na mão é super ergonômico e o uso é muito intuitivo.`,
          isTalkingHead: false,
        },
        {
          sceneNumber: 4,
          title: 'Cena 4 — Durabilidade Comprovada',
          durationSeconds: 4,
          shotType: 'b_roll',
          prompt: `${product.name} em ambiente doméstico acolhedor sob iluminação de estúdio.`,
          narration: `Vale cada centavo pelo custo-benefício e durabilidade excelente.`,
          isTalkingHead: false,
        },
        {
          sceneNumber: 5,
          title: 'Cena 5 — Chamada com Link Seguro',
          durationSeconds: 5,
          shotType: 'cta_talking',
          prompt: `${profile.name} de volta com sorriso acolhedor indicando o link.`,
          narration: `O link oficial verificado com o melhor preço está disponível aqui embaixo!`,
          isTalkingHead: true,
        },
      ],
    };

    // Angle 3: Lifestyle / Transformation
    const planC: CreativePlan = {
      projectId: `proj_c_${Date.now()}`,
      title: `${profile.name} — Transformação de Rotina: ${product.name}`,
      commercialAngle: 'LIFESTYLE_DEMO',
      fullScript: `Olha só que charme que ficou a minha cozinha depois que eu organizei tudo com o ${product.name}! Além de lindo, ele deixa qualquer cantinho mais sofisticado e economiza um espaço precioso no dia a dia. Uma casa organizada traz paz de espírito. Clica no link e transforme o seu lar também!`,
      scenes: [
        {
          sceneNumber: 1,
          title: 'Cena 1 — Gancho Visual de Estilo',
          durationSeconds: 4,
          shotType: 'talking_head',
          prompt: `${profile.name} admirando a cozinha com orgulho e alegria.`,
          narration: `Olha só que charme que ficou a minha casa depois que eu organizei tudo com esse item!`,
          isTalkingHead: true,
        },
        {
          sceneNumber: 2,
          title: 'Cena 2 — Integração ao Ambiente',
          durationSeconds: 4,
          shotType: 'product_closeup',
          prompt: `${product.name} harmonizado com a decoração do ambiente.`,
          narration: `Além de lindo, o ${product.name} deixa qualquer cantinho sofisticado.`,
          isTalkingHead: false,
        },
        {
          sceneNumber: 3,
          title: 'Cena 3 — Uso no Cotidiano',
          durationSeconds: 5,
          shotType: 'product_interaction',
          prompt: `${profile.name} organizando a bancada com satisfação.`,
          narration: `Economiza um espaço precioso e deixa tudo sempre à mão quando você precisa.`,
          isTalkingHead: false,
        },
        {
          sceneNumber: 4,
          title: 'Cena 4 — Atmosfera de Bem-Estar',
          durationSeconds: 4,
          shotType: 'b_roll',
          prompt: `Cozinha acolhedora banhada por luz de sol matinal e bancada impecável.`,
          narration: `Uma casa organizada e prática traz até mais leveza para a rotina.`,
          isTalkingHead: false,
        },
        {
          sceneNumber: 5,
          title: 'Cena 5 — Convite com Link',
          durationSeconds: 5,
          shotType: 'cta_talking',
          prompt: `${profile.name} convidando o espectador com carinho.`,
          narration: `Clica no link e transforme a sua rotina também com essa super novidade!`,
          isTalkingHead: true,
        },
      ],
    };

    const plans = [planA, planB, planC];

    // Anti-duplication check: compare word token overlap across all 3 scripts
    const getTokens = (t: string) => new Set(t.toLowerCase().split(/\s+/));
    const tA = getTokens(planA.fullScript);
    const tB = getTokens(planB.fullScript);
    const tC = getTokens(planC.fullScript);

    const overlapAB = Array.from(tA).filter((x) => tB.has(x)).length / Math.max(tA.size, tB.size);
    const overlapBC = Array.from(tB).filter((x) => tC.has(x)).length / Math.max(tB.size, tC.size);
    const avgOverlap = (overlapAB + overlapBC) / 2;

    const antiDuplicationScore = Math.round((1 - avgOverlap) * 100);
    const isDiversityApproved = antiDuplicationScore >= 60;

    const summary = `✓ Batch de 3 planos criativos gerados com ${antiDuplicationScore}% de diversidade estrutural (Ângulos: Problema->Solução, Review, Lifestyle).`;

    return {
      plans,
      antiDuplicationScore,
      isDiversityApproved,
      summary,
    };
  }
}
