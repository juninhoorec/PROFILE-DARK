import { ProfileProductMatch, ProductDNA } from '@/lib/types';

const concepts = [
  { name: 'Luna', age: '28 anos', archetype: 'Creator lifestyle', contentStyle: 'UGC cotidiano e descoberta' },
  { name: 'Helena', age: '52 anos', archetype: 'Especialista confiável', contentStyle: 'Demonstração e storytelling' },
  { name: 'Marina', age: '34 anos', archetype: 'Profissional prática', contentStyle: 'Rotina real e review direto' },
];

export class ProfileProductMatcher {
  static suggest(dna: ProductDNA): ProfileProductMatch[] {
    return concepts.map((concept, index) => {
      const base = 92 - index * 3;
      const dimensions = {
        audienceFit: base, productCredibility: base - 1, naturalUsage: base + 1, contentPotential: base,
        trustPotential: base - index, commercialPotential: base - 1, productionEase: 94 - index, repeatability: 90 - index,
      };
      const fitScore = Math.round(Object.values(dimensions).reduce((sum, score) => sum + score, 0) / 8);
      return { id: `match_${index + 1}`, ...concept, fitScore, dimensions, rationale: `${concept.archetype} tem contexto natural para apresentar ${dna.name || 'este produto'} a ${dna.targetAudience.toLowerCase()}.` };
    });
  }
}
