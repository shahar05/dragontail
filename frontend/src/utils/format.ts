export function formatHour(hour: number): string {
  const period = hour < 12 ? 'AM' : 'PM';
  const normalized = hour % 12 || 12;
  return `${normalized}:00 ${period}`;
}

export function formatDateShort(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateLong(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
