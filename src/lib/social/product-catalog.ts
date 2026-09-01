export type CommerceProductLink = {
  id: string;
  url: string;
  name?: string;
  keywords: string[];
  verifiedAt: string;
  status: 'verified' | 'needs_identification';
};

const verifiedAt = '2026-08-26T17:40:00.000Z';
const links = [
  ['1VydvjN65J', 'Jogo 2/4/6 Taças Vidro Diamond Bico Jaca Abacaxi', ['taca', 'tacas', 'diamond', 'bico jaca']],
  ['3B6tfafx0v', 'Porta Temperos Giratório Profissional 9 Potes de Vidro', ['porta tempeiro', 'porta tempero', 'temperos']],
  ['5ArzdKKBBT', 'Bebedouro H2O Plus para Cães e Gatos 1,5 L', ['bebedor', 'bebedouro', 'h2o']],
  ['3qMc2u6zDM', 'Dispensador Interativo de Comida para Pets em Forma de Pato', ['dispensador', 'pato', 'duck']],
  ['8AVbConACl'], ['6VNNDds4dn'], ['6AkWotA6oi'], ['3B6vFMLrfu'], ['9V0ymwYdXs'], ['8V8Rb8JpYD'], ['112QfIW8Kn'], ['6L3wzjWpPH'], ['5VUq0Ajsod'], ['3g3BommnXQ'], ['9pdpA5uipl'], ['4qF9CsjV3b'], ['9AO8MoCLk4'], ['4qF9CpFm9Y'], ['AUtVvKp4Yn'], ['7pskkNaAvL'], ['3g3Bmd5ezh'], ['qj0PNdeoC'], ['112QbbNRXa'], ['5ArzZAW8pK'], ['4LIsZVXs2m'], ['4AzSN7J8Fr'], ['30nUuZSKKV'], ['4LIsUwyOpQ'], ['9zxFFHrq6h'], ['112QWfxC73'], ['4qF95dSkRr'], ['4fvitI8KSI'], ['4fvitDwoWs'], ['7fZKSeIXtx'], ['7psjE8Bvnf'], ['7Ad2QrBDEU'], ['40g0ezosTD'], ['4LIr3aRo9j'], ['3B6tfNl438'], ['7psjDuuuNp'], ['80C9Q6FF4k'],
] as Array<[string, string?, string[]?]>;

export const COMMERCE_PRODUCT_LINKS: CommerceProductLink[] = links.map(([code, name, keywords]) => ({
  id: `shopee_${code}`,
  url: `https://s.shopee.com.br/${code}`,
  name,
  keywords: keywords || [],
  verifiedAt,
  status: name ? 'verified' : 'needs_identification',
}));
