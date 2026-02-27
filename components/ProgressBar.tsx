import React, {useRef, useEffect} from 'react';
import {View, Animated, Easing} from 'react-native';
import {ms, fs} from '../constants/spacing';
import {useTheme} from '../theme/ThemeContext';
import {Mono} from './Mono';

type ProgressBarProps = {
  pct: number;
};

export function ProgressBar({pct}: ProgressBarProps) {
  const T = useTheme();
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: pct,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [pct, anim]);
  const color = pct >= 100 ? T.accent : pct >= 60 ? T.blue : T.orange;
  const barHeight = ms(5);
  return (
    <View style={{gap: ms(8)}}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}>
        <Mono
          style={{
            fontSize: fs(9),
            color: T.muted,
            letterSpacing: 1.4,
          }}>
          PROGRESS TO 8 HOURS
        </Mono>
        <Mono style={{fontSize: fs(10), fontWeight: '700', color}}>
          {pct}%
        </Mono>
      </View>
      <View
        style={{
          height: barHeight,
          backgroundColor: T.trackBg,
          borderRadius: ms(3),
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: T.border,
        }}>
        <Animated.View
          style={{
            height: barHeight,
            borderRadius: ms(3),
            backgroundColor: color,
            width: anim.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
            }),
          }}
        />
      </View>
    </View>
  );
}
