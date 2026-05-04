export const daysUntil = (dateStr: string): number | null => {
  if (!dateStr) return null;
  return Math.floor((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
};
