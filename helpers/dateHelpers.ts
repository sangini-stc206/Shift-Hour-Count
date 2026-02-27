export function parseTimeToSeconds(value: string): number | null {
  let trimmed = value.trim();
  trimmed = trimmed.replace(/^(IN|OUT)\s*[:\-]?\s*/i, '');
  if (!trimmed) return null;
  const match =
    trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i) ||
    trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const seconds = match[3] ? parseInt(match[3], 10) : 0;
  const ampm = match[4]?.toUpperCase();
  if (ampm) {
    if (ampm === 'PM' && hours !== 12) hours += 12;
    else if (ampm === 'AM' && hours === 12) hours = 0;
  }
  if (
    isNaN(hours) || isNaN(minutes) || isNaN(seconds) ||
    hours < 0 || hours > 23 || minutes < 0 || minutes > 59 ||
    seconds < 0 || seconds > 59
  ) return null;
  return hours * 3600 + minutes * 60 + seconds;
}

export function formatHMS(totalSeconds: number): string {
  const sign = totalSeconds < 0 ? '-' : '';
  const abs = Math.abs(totalSeconds);
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const s = abs % 60;
  return `${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatClock(totalSecs: number): string {
  const day = 24 * 3600;
  const norm = ((totalSecs % day) + day) % day;
  let h = Math.floor(norm / 3600);
  const m = Math.floor((norm % 3600) / 60);
  const s = norm % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')} ${ampm}`;
}
