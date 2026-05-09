const levenshtein = (a: string, b: string): number => {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const curr = [i];
    for (let j = 1; j <= n; j++) {
      curr[j] = a[i - 1] === b[j - 1] ? prev[j - 1] : 1 + Math.min(prev[j - 1], prev[j], curr[j - 1]);
    }
    prev = curr;
  }
  return prev[n];
};

export const fuzzyMatch = (target: string, query: string): boolean => {
  const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const targetNorm = normalize(target);
  const queryNorm = normalize(query);
  if (targetNorm.includes(queryNorm)) return true;
  const queryWords = queryNorm.split(/\s+/).filter(Boolean);
  const targetWords = targetNorm.split(/\s+/).filter(Boolean);
  return queryWords.every((qw) =>
    targetWords.some((tw) => {
      if (tw.includes(qw) || qw.includes(tw)) return true;
      const maxDist = Math.max(1, Math.floor(Math.max(qw.length, tw.length) * 0.35));
      return levenshtein(qw, tw) <= maxDist;
    })
  );
};
