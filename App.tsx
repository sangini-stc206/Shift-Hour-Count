import React, {useState} from 'react';
import {StatusBar, useColorScheme} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {ThemeProvider, darkTheme, lightTheme} from './theme/ThemeContext';
import {ShiftCalculator} from './components/ShiftCalculator';

export default function App() {
  const sys = useColorScheme();
  const [isDark, setIsDark] = useState(sys !== 'light');
  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeProvider value={theme}>
      <SafeAreaProvider>
        <SafeAreaView style={{flex: 1}} edges={['top', 'bottom', 'left', 'right']}>
          <StatusBar
            barStyle={isDark ? 'light-content' : 'dark-content'}
            backgroundColor={theme.bg}
          />
          <ShiftCalculator
            isDark={isDark}
            onToggleTheme={() => setIsDark(d => !d)}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
