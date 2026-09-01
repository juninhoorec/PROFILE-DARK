import { ProfileProductMatch, ProductDNA } from '@/lib/types';
import { rankArchetypes } from '@/lib/profile-archetypes';

export class ProfileProductMatcher {
  static suggest(dna: ProductDNA): ProfileProductMatch[] {
    const brief = [dna.name, dna.brand, dna.category, dna.targetAudience, dna.problemSolved, ...dna.keyFeatures, ...dna.mainBenefits].join(' ');
    return rankArchetypes(brief, 3).map((archetype, index) => {
      const base = 94 - index * 3;
      const humorBonus = archetype.tags.includes('meme') ? 2 : 0;
      const dimensions = {
        audienceFit: base, productCredibility: Math.min(98, base + 2), naturalUsage: base + 1,
        contentPotential: Math.min(98, base + humorBonus), trustPotential: base,
        commercialPotential: base - 1, productionEase: 92 - index, repeatability: 91 - index,
      };
      const fitScore = Math.round(Object.values(dimensions).reduce((sum, score) => sum + score, 0) / 8);
      return {
        id: archetype.id, name: archetype.name,
        age: archetype.kind === 'animal' ? `${archetype.age} anos · personagem animal` : `${archetype.age} anos`,
        archetype: archetype.role, contentStyle: archetype.contentStyle, fitScore, dimensions,
        rationale: `${archetype.expertise}. A abordagem de ${archetype.salesStyle.toLowerCase()} cria contexto natural para ${dna.name || 'este produto'}, sem fingir experiência ou prometer vendas.`,
      };
    });
  }
}
