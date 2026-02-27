import React, {useState, useEffect} from 'react';
import {
  Text,
  TextInput,
  View,
  Pressable,
  ScrollView,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import {ms, fs} from '../constants/spacing';
import {useTheme} from '../theme/ThemeContext';
import {parseTimeToSeconds, formatHMS, formatClock, parsePastedTimes} from '../helpers/dateHelpers';
import {useShiftCalculation} from '../hooks/useShiftCalculation';
import {CardHeader} from './CardHeader';
import {Mono} from './Mono';

import {StatBox} from './StatBox';
import {ThemeToggle} from './ThemeToggle';

const GAP_OPTIONS = [5, 10, 20, 30, 45, 60];

type ShiftCalculatorProps = {
  isDark: boolean;
  onToggleTheme: () => void;
};

export function ShiftCalculator({isDark, onToggleTheme}: ShiftCalculatorProps) {
  const T = useTheme();

  const [tab, setTab] = useState<'paste' | 'manual'>('paste');
  const [pasteInput, setPasteInput] = useState('');
  const [manualTimes, setManualTimes] = useState<string[]>(['']);
  const [rejoinGap, setRejoinGap] = useState(30);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);
  const [pickerValue, setPickerValue] = useState(new Date());

  const calc = useShiftCalculation(manualTimes, rejoinGap);
  const showGap = !calc.hasOdd && calc.remaining > 0 && calc.validCount > 0;

  function openPicker(index: number) {
    const secs = parseTimeToSeconds(manualTimes[index] ?? '');
    if (secs !== null) {
      const base = new Date();
      base.setHours(0, 0, 0, 0);
      setPickerValue(new Date(base.getTime() + secs * 1000));
    } else {
      setPickerValue(new Date());
    }
    setPickerIndex(index);
    setPickerVisible(true);
  }

  function onPickerChange(event: DateTimePickerEvent, date?: Date) {
    setPickerVisible(false);
    if (event.type === 'dismissed' || !date || pickerIndex === null) {
      setPickerIndex(null);
      return;
    }
    const h = date.getHours();
    const m = date.getMinutes();
    const s = date.getSeconds();
    const fmt = `${h % 12 || 12}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
    setManualTimes(prev => {
      const c = [...prev];
      c[pickerIndex] = fmt;
      return c;
    });
    setPickerIndex(null);
  }

  function handlePasteInputChange(v: string) {
    setPasteInput(v);
    const lines = parsePastedTimes(v);
    if (lines.length > 0) {
      setManualTimes(lines);
    }
  }

  useEffect(() => {
    const synced = manualTimes.filter(Boolean).join(', ');
    setPasteInput(prev => (prev !== synced ? synced : prev));
  }, [manualTimes]);

  const card = {
    backgroundColor: T.surface,
    borderRadius: ms(12),
    borderWidth: 1,
    borderColor: T.border,
    overflow: 'hidden' as const,
  };

  const section = {
    padding: ms(14),
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  };

  return (
    <ScrollView
      style={{flex: 1, backgroundColor: T.bg, overflow: 'hidden'}}
      contentContainerStyle={{
        paddingHorizontal: ms(14),
        paddingTop: ms(12),
        paddingBottom: ms(24),
        gap: ms(10),
        flexGrow: 1,
        maxWidth: '100%',
      }}
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">
      <Header isDark={isDark} onToggleTheme={onToggleTheme} />

      <TabBar tab={tab} onTabChange={setTab} />

      {tab === 'paste' && (
        <PasteInput
          card={card}
          value={pasteInput}
          onChange={handlePasteInputChange}
        />
      )}

      <PunchList
        card={card}
        manualTimes={manualTimes}
        setManualTimes={setManualTimes}
        openPicker={openPicker}
      />


      {pickerVisible && pickerIndex !== null && (
        <DateTimePicker
          value={pickerValue}
          mode="time"
          display="default"
          onChange={onPickerChange}
        />
      )}

      {showGap && (
        <BreakGapSelector
          card={card}
          rejoinGap={rejoinGap}
          setRejoinGap={setRejoinGap}
        />
      )}

      <ResultsCard
        card={card}
        section={section}
        calc={calc}
        onClear={() => {
          setPasteInput('');
          setManualTimes(['']);
        }}
      />
    </ScrollView>
  );
}

function Header({
  isDark,
  onToggleTheme,
}: {
  isDark: boolean;
  onToggleTheme: () => void;
}) {
  const T = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingBottom: ms(2),
      }}>
      <View style={{flex: 1, minWidth: 0, gap: ms(4)}}>
        <Mono
          style={{
            fontSize: fs(22),
            fontWeight: '800',
            color: T.text,
            letterSpacing: -1,
          }}>
          Shift<Text style={{color: T.accent}}>.</Text>Calc
        </Mono>
        <Mono style={{fontSize: fs(10), color: T.muted}}>
          Know when you've done your minimum 8 hours
        </Mono>
      </View>
      <View style={{alignItems: 'flex-end', gap: ms(8), flexShrink: 1}}>
        <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
  
      </View>
    </View>
  );
}

function TabBar({
  tab,
  onTabChange,
}: {
  tab: 'paste' | 'manual';
  onTabChange: (t: 'paste' | 'manual') => void;
}) {
  const T = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: T.surface,
        borderRadius: ms(8),
        borderWidth: 1,
        borderColor: T.border,
        padding: ms(3),
        gap: ms(3),
      }}>
      <Pressable
        onPress={() => onTabChange('paste')}
        style={{
          flex: 1,
          paddingVertical: ms(8),
          borderRadius: ms(6),
          alignItems: 'center',
          backgroundColor: tab === 'paste' ? T.surface2 : 'transparent',
          borderWidth: tab === 'paste' ? 1 : 0,
          borderColor: T.accentBorder,
        }}>
        <Mono
          style={{
            fontSize: fs(11),
            fontWeight: '700',
            color: tab === 'paste' ? T.accent : T.muted,
          }}>
          Quick paste
        </Mono>
      </Pressable>
      <Pressable
        onPress={() => onTabChange('manual')}
        style={{
          flex: 1,
          paddingVertical: ms(8),
          borderRadius: ms(6),
          alignItems: 'center',
          backgroundColor: tab === 'manual' ? T.surface2 : 'transparent',
          borderWidth: tab === 'manual' ? 1 : 0,
          borderColor: T.accentBorder,
        }}>
        <Mono
          style={{
            fontSize: fs(11),
            fontWeight: '700',
            color: tab === 'manual' ? T.accent : T.muted,
          }}>
          Manual times
        </Mono>
      </Pressable>
    </View>
  );
}

function PasteInput({
  card,
  value,
  onChange,
}: {
  card: object;
  value: string;
  onChange: (v: string) => void;
}) {
  const T = useTheme();
  return (
    <View style={card}>
      <CardHeader label="QUICK PASTE" />
      <View style={{padding: ms(12), gap: ms(6)}}>
        <Mono style={{fontSize: fs(10), color: T.muted, paddingBottom: ms(4)}}>
          Paste clock-in/out times, or add below
        </Mono>
        <TextInput
          style={{
            color: T.text,
            fontFamily: 'Courier New',
            fontSize: fs(12),
            padding: ms(12),
            letterSpacing: 0.4,
            backgroundColor: T.inputBg,
            borderRadius: ms(6),
            borderWidth: 1,
            borderColor: T.border,
          }}
          value={value}
          onChangeText={onChange}
          placeholder="9:30 AM, 1:09 PM, 2:00 PM"
          placeholderTextColor={T.muted}
          autoCorrect={false}
          autoCapitalize="none"
        />
        <Mono style={{fontSize: fs(9), color: T.muted}}>
          e.g. 9:30 AM, 1:00 PM, 2:00 PM
        </Mono>
      </View>
    </View>
  );
}

function PunchList({
  card,
  manualTimes,
  setManualTimes,
  openPicker,
}: {
  card: object;
  manualTimes: string[];
  setManualTimes: React.Dispatch<React.SetStateAction<string[]>>;
  openPicker: (index: number) => void;
}) {
  const T = useTheme();
  const inBg = '#dcfce7';
  const inBorder = '#22c55e';
  const inText = '#16a34a';
  const outBg = '#fee2e2';
  const outBorder = '#ef4444';
  const outText = '#dc2626';

  return (
    <View style={card}>
      <CardHeader label="YOUR TIMES" />
      <View style={{gap: ms(10)}}>
      {manualTimes.map((val, i) => {
        const isIn = i % 2 === 0;
        const secs = parseTimeToSeconds(val);
        const valid = val.trim() !== '' && secs !== null;
        const invalid = val.trim() !== '' && secs === null;
        return (
          <View
            key={`${i}-${val || 'empty'}`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: ms(6),
              paddingHorizontal: ms(12),
              paddingVertical: ms(8),
              borderBottomWidth: 1,
              borderBottomColor: T.border,
            }}>
            <Mono
              style={{
                fontSize: fs(9),
                color: T.muted,
                width: ms(16),
                textAlign: 'right',
              }}>
              {i + 1}
            </Mono>
            <View
              style={{
                paddingHorizontal: ms(6),
                paddingVertical: ms(2),
                borderRadius: ms(3),
                borderWidth: 1,
                backgroundColor: isIn ? inBg : outBg,
                borderColor: isIn ? inBorder : outBorder,
              }}>
              <Mono
                style={{
                  fontSize: fs(8),
                  fontWeight: '700',
                  letterSpacing: 0.5,
                  color: isIn ? inText : outText,
                }}>
                {isIn ? 'IN' : 'OUT'}
              </Mono>
            </View>
            <TextInput
              style={{
                flex: 1,
                backgroundColor: T.inputBg,
                borderWidth: 1,
                borderColor: valid
                  ? T.accentBorder
                  : invalid
                    ? T.orangeBorder
                    : T.border,
                borderRadius: ms(6),
                color: T.text,
                fontFamily: 'Courier New',
                fontSize: fs(11),
                paddingHorizontal: ms(8),
                paddingVertical: ms(6),
                letterSpacing: 0.3,
              }}
              value={val}
              onChangeText={v =>
                setManualTimes(prev => {
                  const c = [...prev];
                  c[i] = v;
                  return c;
                })
              }
              placeholder="9:30 AM"
              placeholderTextColor={T.muted}
              autoCorrect={false}
              autoCapitalize="none"
            />
            <Pressable
              onPress={() => openPicker(i)}
              style={({pressed}) => ({
                backgroundColor: pressed ? T.blueBorder : T.blueDim,
                borderWidth: 1,
                borderColor: T.blueBorder,
                borderRadius: ms(6),
                width: ms(32),
                height: ms(32),
                alignItems: 'center',
                justifyContent: 'center',
              })}>
              <Text style={{fontSize: fs(14)}}>🕐</Text>
            </Pressable>
            <Pressable
              onPress={() =>
                setManualTimes(prev =>
                  prev.length === 1 ? [''] : prev.filter((_, j) => j !== i),
                )
              }
              style={({pressed}) => ({
                width: ms(24),
                height: ms(24),
                borderRadius: ms(5),
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: pressed ? T.orangeDim : 'transparent',
              })}>
              <Text
                style={{
                  color: T.orange,
                  fontSize: fs(18),
                  fontWeight: '300',
                  lineHeight: fs(20),
                }}>
                ×
              </Text>
            </Pressable>
          </View>
        );
      })}
      <Pressable
        onPress={() => setManualTimes(prev => [...prev, ''])}
        style={({pressed}) => ({
          padding: ms(12),
          borderWidth: 1,
          borderColor: T.accentBorder,
          borderStyle: 'dashed',
          borderRadius: ms(6),
          alignItems: 'center',
          backgroundColor: pressed ? T.accentDim : 'transparent',
        })}>
        <Mono
          style={{
            fontSize: fs(11),
            fontWeight: '700',
            color: T.accent,
            letterSpacing: 0.5,
          }}>
          + Add time
        </Mono>
      </Pressable>
      </View>
    </View>
  );
}

function BreakGapSelector({
  card,
  rejoinGap,
  setRejoinGap,
}: {
  card: object;
  rejoinGap: number;
  setRejoinGap: (v: number) => void;
}) {
  const T = useTheme();
  return (
    <View style={card}>
      <CardHeader label="BREAK DURATION" />
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: ms(6),
          padding: ms(12),
        }}>
        {GAP_OPTIONS.map(m => {
          const active = rejoinGap === m;
          return (
            <Pressable
              key={m}
              onPress={() => setRejoinGap(m)}
              style={{
                paddingHorizontal: ms(12),
                paddingVertical: ms(6),
                borderRadius: ms(16),
                borderWidth: 1,
                borderColor: active ? T.accentBorder : T.border,
                backgroundColor: active ? T.accentDim : T.inputBg,
              }}>
              <Mono
                style={{
                  fontSize: fs(11),
                  fontWeight: '700',
                  color: active ? T.accent : T.muted,
                }}>
                {m}m
              </Mono>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function ResultsCard({
  card,
  section,
  calc,
  onClear,
}: {
  card: object;
  section: object;
  calc: ReturnType<typeof useShiftCalculation>;
  onClear: () => void;
}) {
  const T = useTheme();
  const showCompletionAt =
    calc.validCount > 0 &&
    calc.remaining > 0 &&
    calc.completionAt !== null;
  const showComplete = calc.validCount > 0 && calc.remaining === 0;

  return (
    <View style={card}>
      <View
        style={{
          padding: ms(12),
          paddingBottom: ms(8),
          borderBottomWidth: 1,
          borderBottomColor: T.border,
        }}>
        <Mono
          style={{
            fontSize: fs(11),
            fontWeight: '700',
            color: T.muted,
            letterSpacing: 1,
          }}>
          RESULT
        </Mono>
      </View>
      {(showCompletionAt || showComplete) && (
        <View
          style={{
            padding: ms(16),
            paddingBottom: ms(14),
            borderBottomWidth: 1,
            borderBottomColor: T.border,
            gap: ms(6),
          }}>
          <Mono
            style={{
              fontSize: fs(10),
              color: T.muted,
            }}>
            {showComplete ? 'You\'re done!' : 'You can leave at'}
          </Mono>
          <Mono
            style={{
              fontSize: fs(36),
              fontWeight: '700',
              letterSpacing: -1,
              lineHeight: fs(40),
              color: T.accent,
            }}>
            {showComplete
              ? '✓ 8 hours complete'
              : formatClock(calc.completionAt ?? 0)}
          </Mono>
        </View>
      )}

      <View
        style={{
          padding: ms(16),
          paddingBottom: ms(14),
          borderBottomWidth: 1,
          borderBottomColor: T.border,
          gap: ms(6),
        }}>
        <Mono
          style={{
            fontSize: fs(10),
            color: T.muted,
          }}>
          Hours worked so far
        </Mono>
        <Mono
          style={{
            fontSize: fs(36),
            fontWeight: '700',
            letterSpacing: -1,
            lineHeight: fs(40),
            color: calc.total === 0 ? T.muted : T.accent,
          }}>
          {formatHMS(calc.total)}
        </Mono>
        <View
          style={{
            alignSelf: 'flex-start',
            backgroundColor: T.accentDim,
            borderRadius: ms(4),
            borderWidth: 1,
            borderColor: T.accentBorder,
            paddingHorizontal: ms(10),
            paddingVertical: ms(3),
          }}>
          <Mono style={{fontSize: fs(11), color: T.accent, fontWeight: '700'}}>
            {(calc.total / 3600).toFixed(2)} h
          </Mono>
        </View>
      </View>


      {calc.validCount > 0 && (
        <View
          style={{
            ...(section as object),
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: ms(12),
          }}>
          {calc.remaining > 0 && calc.completionAt !== null ? (
            <>
              <StatBox
                label="Time left"
                value={formatHMS(calc.remaining)}
                color={T.orange}
              />
              {calc.suggestedIn !== null && (
                <StatBox
                  label="Clock in by"
                  value={formatClock(calc.suggestedIn)}
                  color={T.blue}
                />
              )}
              <StatBox
                label="Status"
                value={calc.hasOdd ? '● At work' : '○ On break'}
                color={calc.hasOdd ? T.accent : T.orange}
              />
            </>
          ) : calc.remaining === 0 ? (
            <StatBox label="Status" value="✓ 8 hours done" color={T.accent} />
          ) : null}
        </View>
      )}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: ms(12),
        }}>
        <Mono style={{fontSize: fs(10), color: T.muted}}>
          {calc.validCount} time{calc.validCount !== 1 ? 's' : ''} entered
        </Mono>
        <Pressable
          onPress={onClear}
          style={({pressed}) => ({
            borderWidth: 1,
            borderColor: T.orangeBorder,
            borderRadius: ms(5),
            paddingHorizontal: ms(12),
            paddingVertical: ms(6),
            backgroundColor: pressed ? T.orangeDim : 'transparent',
          })}>
          <Mono
            style={{
              fontSize: fs(10),
              fontWeight: '700',
              color: T.orange,
              letterSpacing: 1,
            }}>
            Clear all
          </Mono>
        </Pressable>
      </View>
    </View>
  );
}
