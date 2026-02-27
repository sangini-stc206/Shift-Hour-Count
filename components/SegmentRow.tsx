import React from 'react';
import {View} from 'react-native';
import {ms} from '../constants/spacing';
import {useTheme} from '../theme/ThemeContext';
import {Mono} from './Mono';
import {formatHMS} from '../helpers/dateHelpers';

type SegmentRowProps = {
  inLabel: string;
  outLabel: string;
  inSecs: number;
  outSecs: number;
  dur: number;
  minT: number;
  maxT: number;
  isOpen?: boolean;
};

export function SegmentRow({
  inLabel,
  outLabel,
  inSecs,
  outSecs,
  dur,
  minT,
  maxT,
  isOpen,
}: SegmentRowProps) {
  const T = useTheme();
  const span = Math.max(maxT - minT, 1);
  const leftPct = ((inSecs - minT) / span) * 100;
  const widthPct = Math.max(4, ((outSecs - inSecs) / span) * 100);
  const barHeight = ms(4);
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: ms(8),
      }}>
      <Mono style={{fontSize: ms(11), color: T.accent, width: ms(85)}}>
        {inLabel}
      </Mono>
      <View
        style={{
          flex: 1,
          height: barHeight,
          backgroundColor: T.trackBg,
          borderRadius: ms(2),
          overflow: 'hidden',
        }}>
        <View
          style={{
            position: 'absolute',
            left: `${Math.max(0, leftPct)}%`,
            width: `${widthPct}%`,
            height: barHeight,
            borderRadius: ms(2),
            backgroundColor: isOpen ? T.accent : T.blue,
            opacity: isOpen ? 0.45 : 0.8,
          }}
        />
      </View>
      <Mono
        style={{
          fontSize: ms(11),
          color: isOpen ? T.muted : T.orange,
          width: ms(82),
          textAlign: 'right',
        }}>
        {isOpen ? 'ongoing…' : outLabel}
      </Mono>
      <Mono
        style={{
          fontSize: ms(11),
          color: isOpen ? T.accent : T.muted,
          width: ms(56),
          textAlign: 'right',
        }}>
        {formatHMS(dur)}
      </Mono>
    </View>
  );
}
