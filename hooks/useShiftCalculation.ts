import {useMemo} from 'react';
import {parseTimeToSeconds} from '../helpers/dateHelpers';

export function useShiftCalculation(
  text: string,
  manualTimes: string[],
  entryMode: 'paste' | 'manual',
  rejoinGap: number,
) {
  return useMemo(() => {
    const normalizedText = text.replace(/\\n/g, '\n');
    const lines =
      entryMode === 'paste'
        ? normalizedText
            .split('\n')
            .map(l => l.trim())
            .filter(l => l && !/missing/i.test(l))
        : manualTimes
            .map(l => l.replace(/\\n/g, '\n').split('\n')[0].trim())
            .filter(l => l && !/missing/i.test(l));

    const valid = lines
      .map(raw => ({raw, secs: parseTimeToSeconds(raw)}))
      .filter((t): t is {raw: string; secs: number} => t.secs !== null);

    let total = 0;
    const pairs: {inS: number; outS: number; dur: number}[] = [];
    for (let i = 0; i + 1 < valid.length; i += 2) {
      const dur = valid[i + 1].secs - valid[i].secs;
      if (dur > 0) {
        total += dur;
        pairs.push({
          inS: valid[i].secs,
          outS: valid[i + 1].secs,
          dur,
        });
      }
    }

    const hasOdd = valid.length % 2 === 1;
    const target = 8 * 3600;
    const remaining = Math.max(0, target - total);
    const pct = Math.min(100, Math.round((total / target) * 100));

    let completionAt: number | null = null;
    let suggestedIn: number | null = null;
    if (remaining > 0 && valid.length > 0) {
      const last = valid[valid.length - 1].secs;
      if (hasOdd) {
        completionAt = last + remaining;
      } else {
        suggestedIn = last + rejoinGap * 60;
        completionAt = suggestedIn + remaining;
      }
    }

    const minT = pairs.length ? Math.min(...pairs.map(p => p.inS)) : 0;
    const maxT = pairs.length ? Math.max(...pairs.map(p => p.outS)) : 1;
    const openInSecs =
      hasOdd && valid.length > 0 ? valid[valid.length - 1].secs : null;

    return {
      total,
      pairs,
      hasOdd,
      remaining,
      pct,
      completionAt,
      suggestedIn,
      validCount: valid.length,
      minT,
      maxT,
      openInSecs,
    };
  }, [text, manualTimes, entryMode, rejoinGap]);
}
