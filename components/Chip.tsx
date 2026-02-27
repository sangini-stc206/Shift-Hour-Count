import React from 'react';
import {View} from 'react-native';
import {ms, fs} from '../constants/spacing';
import {Mono} from './Mono';

type ChipProps = {
  label: string;
  color: string;
  bg: string;
  border: string;
};

export function Chip({label, color, bg, border}: ChipProps) {
  return (
    <View
      style={{
        backgroundColor: bg,
        borderColor: border,
        borderWidth: 1,
        paddingHorizontal: ms(7),
        paddingVertical: ms(2),
        borderRadius: ms(3),
      }}>
      <Mono
        style={{
          fontSize: fs(8),
          fontWeight: '700',
          color,
          letterSpacing: 1,
        }}>
        {label}
      </Mono>
    </View>
  );
}
