import React from 'react';
import {Text, Pressable} from 'react-native';
import {ms, fs} from '../constants/spacing';

type ThemeToggleProps = {
  isDark: boolean;
  onToggle: () => void;
};

export function ThemeToggle({isDark, onToggle}: ThemeToggleProps) {
  return (
    <Pressable onPress={onToggle} style={{padding: ms(6)}}>
      <Text style={{fontSize: fs(18)}}>{isDark ? '🌙' : '☀️'}</Text>
    </Pressable>
  );
}
