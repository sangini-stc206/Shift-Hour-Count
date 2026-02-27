import React from 'react';
import {View} from 'react-native';
import {ms, fs} from '../constants/spacing';
import {useTheme} from '../theme/ThemeContext';
import {Mono} from './Mono';

type CardHeaderProps = {
  label: string;
};

export function CardHeader({label}: CardHeaderProps) {
  const T = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: ms(10),
        paddingHorizontal: ms(16),
        paddingVertical: ms(13),
        borderBottomWidth: 1,
        borderBottomColor: T.border,
      }}>
      <View
        style={{
          width: ms(6),
          height: ms(6),
          borderRadius: ms(3),
          backgroundColor: T.accent,
        }}
      />
      <Mono
        style={{
          fontSize: fs(9),
          fontWeight: '700',
          color: T.muted,
          letterSpacing: 1.6,
        }}>
        {label}
      </Mono>
    </View>
  );
}
