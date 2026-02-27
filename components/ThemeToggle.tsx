import React from 'react';
import {View, Text, Pressable} from 'react-native';
import {ms} from '../constants/spacing';
import {useTheme} from '../theme/ThemeContext';

type ThemeToggleProps = {
  isDark: boolean;
  onToggle: () => void;
};

export function ThemeToggle({isDark, onToggle}: ThemeToggleProps) {
  const T = useTheme();
  return (
    <View style={{flexDirection: 'row', alignItems: 'center', gap: ms(4)}}>
      <Pressable
        onPress={() => !isDark || onToggle()}
        style={({pressed}) => ({
          padding: ms(6),
          opacity: isDark ? 0.4 : 1,
        })}>
        <Text style={{fontSize: ms(18)}}>☀️</Text>
      </Pressable>
      <Pressable
        onPress={() => isDark || onToggle()}
        style={({pressed}) => ({
          padding: ms(6),
          opacity: isDark ? 1 : 0.4,
        })}>
        <Text style={{fontSize: ms(18)}}>🌙</Text>
      </Pressable>
    </View>
  );
}
