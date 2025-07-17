export function formatMonthYear(date: string) {
  if (!date) return '';
  return new Date(date)
    .toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    .replace(' de ', ' ');
}

export function formatDayMonthYear(date: string) {
  if (!date) return '';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}
