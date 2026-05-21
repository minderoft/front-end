export const formatPrice = (price) => {
  const n = Number(price);
  if (!n || n === 0) return 'Sur devis';
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';
};
