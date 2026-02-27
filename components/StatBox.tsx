import React from 'react';
import {View} from 'react-native';
import {ms, fs} from '../constants/spacing';
import {useTheme} from '../theme/ThemeContext';
import {Mono} from './Mono';

type StatBoxProps = {
  label: string;
  value: string;
  color: string;
};

export function StatBox({label, value, color}: StatBoxProps) {
  const T = useTheme();
  return (
    <View style={{minWidth: '44%', flex: 1, gap: ms(3)}}>
      <Mono
        style={{
          fontSize: fs(9),
          color: T.muted,
          letterSpacing: 1.5,
        }}>
        {label}
      </Mono>
      <Mono
        style={{
          fontSize: fs(15),
          fontWeight: '700',
          color,
          letterSpacing: 0.2,
        }}>
        {value}
      </Mono>
    </View>
  );
}
