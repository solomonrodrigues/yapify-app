export const timeAgo = (isoDate: string): string => {
    const now = Date.now();
    const then = new Date(isoDate).getTime();
    const diff = Math.max(0, now - then);
  
    const s = Math.floor(diff / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    const w = Math.floor(d / 7);
  
    if (s < 60) return `${s}s`;
    if (m < 60) return `${m}m`;
    if (h < 24) return `${h}h`;
    if (d < 7) return `${d}d`;
    return `${w}w`;
};
