import React from 'react';
import {View} from 'react-native';
import {ms} from '../constants/spacing';
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
        paddingHorizontal: ms(9),
        paddingVertical: ms(3),
        borderRadius: ms(4),
      }}>
      <Mono
        style={{
          fontSize: ms(9),
          fontWeight: '700',
          color,
          letterSpacing: 1,
        }}>
        {label}
      </Mono>
    </View>
  );
}
