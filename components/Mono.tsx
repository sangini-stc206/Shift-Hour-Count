import React from 'react';
import {Text, StyleProp, TextStyle} from 'react-native';

type MonoProps = {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
};

export function Mono({children, style}: MonoProps) {
  return <Text style={[{fontFamily: 'Courier New'}, style]}>{children}</Text>;
}
