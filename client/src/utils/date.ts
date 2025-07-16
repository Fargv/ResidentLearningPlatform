export function formatMonthYear(date: string) {
  if (!date) return '';
  return new Date(date)
    .toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    .replace(' de ', ' ');
}
