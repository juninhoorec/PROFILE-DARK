import { Profile, Product, CreativePlan, CommercialObjective, FunnelStage, CreativeScene } from '../types';

export class CreativeDirector {
  static createPlan(params: {
    profile: Profile;
    product?: Product;
    prompt: string;
    objective?: CommercialObjective;
    funnelStage?: FunnelStage;
    format?: 'reels' | 'shorts' | 'tiktok';
    targetDuration?: number;
  }): CreativePlan {
    const {
      profile,
      product,
      prompt,
      objective = 'conversao',
      funnelStage = 'meio',
      format = 'reels',
      targetDuration = 24,
    } = params;

    const planId = `plan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const prodName = product ? product.name : 'solução apresentada';
    const prodBrand = product ? product.brand : 'marca';

    // Hook based on funnel
    let hook = '';
    if (funnelStage === 'topo') {
      hook = `Você comete esse erro todos os dias sem perceber?`;
    } else if (funnelStage === 'meio') {
      hook = `Depois que descobri ${prodName}, minha rotina nunca mais foi a mesma.`;
    } else {
      hook = `Se você ainda não tem ${prodName}, aqui está o motivo exato pelo qual você precisa dele hoje.`;
    }

    // Scenes breakdown
    const scenes: CreativeScene[] = [
      {
        sceneNumber: 1,
        title: 'Cena 1: O Hook Magnético & Quebra de Padrão',
        durationSeconds: 4,
        visualPrompt: `Close-up dinâmico de ${profile.name} olhando diretamente para a câmera com expressão intrigante em ambiente refinado. Iluminação suave com foco nos olhos.`,
        cameraMovement: 'Zoom-in lento e sutil com estabilização fluida.',
        lightingStyle: 'Golden hour suave com luz de recorte nos ombros.',
        narrationScript: `${hook}`,
        productInteraction: product ? `Segura sutilmente o ${product.name} em primeiro plano sem cobrir o rosto.` : 'Gesto acolhedor com as mãos.',
        characterAction: 'Olhar confiante para a câmera, quebrando a quarta parede.',
        status: 'completed',
      },
      {
        sceneNumber: 2,
        title: 'Cena 2: Demonstração de Benefício & Prova Visual',
        durationSeconds: 14,
        visualPrompt: `Plano médio de ${profile.name} demonstrando os diferenciais práticos do ${prodName}. Destaque para textura, qualidade dos materiais e acabamento premium.`,
        cameraMovement: 'Panorâmica lateral suave com desfoque de fundo (bokeh).',
        lightingStyle: 'Luz difusa de estúdio com reflexos realistas no produto.',
        narrationScript: product
          ? `O diferencial do ${product.name} da ${prodBrand} é que ele entrega ${product.dna.mainBenefits[0] || 'resultados imediatos'} e resolve ${product.dna.problemSolved || 'a sua maior dor'}. Olha essa textura e a qualidade impecável.`
          : `A qualidade de vida muda quando você foca no que realmente importa e escolhe ferramentas comprovadas.`,
        productInteraction: product ? `Mostra os detalhes do ${product.name} em close-up destacando ${product.dna.keyFeatures.slice(0, 2).join(' e ')}.` : 'Gesticulação explicativa.',
        characterAction: 'Expressão de aprovação sincera e sorriso natural.',
        status: 'pending',
      },
      {
        sceneNumber: 3,
        title: 'Cena 3: Fechamento com Oferta Irresistível & CTA',
        durationSeconds: 6,
        visualPrompt: `Enquadramento 3/4 com ${profile.name} segurando o produto e apontando suavemente para a chamada de ação na tela.`,
        cameraMovement: 'Câmera fixa estabilizada com profundidade de campo rasa.',
        lightingStyle: 'Iluminação premium contrastada.',
        narrationScript: `${profile.dna.mainCTA || 'Toque no link abaixo para garantir o seu com condição especial.'}`,
        productInteraction: product ? `Apresenta o ${product.name} ao lado do rosto com elegância.` : 'Gesto convidativo.',
        characterAction: 'Sorriso final e convite direto.',
        status: 'pending',
      },
    ];

    const fullScript = scenes.map((s) => `[${s.title}]\n${s.narrationScript}`).join('\n\n');
    const ctaText = profile.dna.mainCTA || 'Clique no link da bio e garanta agora!';
    const captionText = `${hook}\n\n${product ? `O ${product.name} se tornou indispensável para quem busca ${product.dna.desireExploited || 'máxima qualidade'}.` : 'Dica indispensável para o seu dia a dia.'}\n\n👉 ${ctaText}\n\n#${profile.name.replace(/\s+/g, '')} #${prodName.replace(/\s+/g, '')} #Recomendacao #Qualidade #SaaS`;

    return {
      id: planId,
      profileId: profile.id,
      productId: product?.id,
      format,
      objective,
      funnelStage,
      targetDurationSeconds: targetDuration,
      hook,
      creativeAngle: 'Storytelling Sensorial + Prova Visual',
      fullScript,
      scenes,
      ctaText,
      captionText,
      hashtags: [`#${profile.name.replace(/\s+/g, '')}`, '#ProfileDark', '#HighConverting', '#IA'],
      thumbnailPrompt: `Close-up cinematográfico de ${profile.name} com iluminação 4K e produto em destaque.`,
      estimatedCredits: Math.round(targetDuration * 3.5),
      createdAt: new Date().toISOString(),
    };
  }
}
