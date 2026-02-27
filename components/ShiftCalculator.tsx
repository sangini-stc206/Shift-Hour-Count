import React, {useState} from 'react';
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
import {ms} from '../constants/spacing';
import {useTheme} from '../theme/ThemeContext';
import {parseTimeToSeconds, formatHMS, formatClock} from '../helpers/dateHelpers';
import {useShiftCalculation} from '../hooks/useShiftCalculation';
import {CardHeader} from './CardHeader';
import {Chip} from './Chip';
import {Mono} from './Mono';
import {ProgressBar} from './ProgressBar';
import {SegmentRow} from './SegmentRow';
import {StatBox} from './StatBox';
import {ThemeToggle} from './ThemeToggle';

const GAP_OPTIONS = [5, 10, 20, 30, 45, 60];

type ShiftCalculatorProps = {
  isDark: boolean;
  onToggleTheme: () => void;
};

export function ShiftCalculator({isDark, onToggleTheme}: ShiftCalculatorProps) {
  const T = useTheme();

  const [entryMode, setEntryMode] = useState<'paste' | 'manual'>('paste');
  const [text, setText] = useState('');
  const [manualTimes, setManualTimes] = useState<string[]>(['']);
  const [rejoinGap, setRejoinGap] = useState(30);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);
  const [pickerValue, setPickerValue] = useState(new Date());

  const calc = useShiftCalculation(text, manualTimes, entryMode, rejoinGap);
  const showGap = !calc.hasOdd && calc.remaining > 0 && calc.validCount > 0;

  const now = new Date();
  const nowSecs =
    now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

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

  function handleModeSwitch(mode: 'paste' | 'manual') {
    if (mode === entryMode) return;
    if (mode === 'manual') {
      const normalized = text.replace(/\\n/g, '\n');
      const lines = normalized
        .split('\n')
        .map(l => l.trim().replace(/^(IN|OUT)\s*[:\-]?\s*/i, ''))
        .filter(l => l && !/missing/i.test(l));
      setManualTimes(lines.length ? lines : ['']);
      setEntryMode('manual');
    } else {
      setEntryMode('paste');
    }
  }

  const card = {
    backgroundColor: T.surface,
    borderRadius: ms(14),
    borderWidth: 1,
    borderColor: T.border,
    overflow: 'hidden' as const,
  };

  const section = {
    padding: ms(18),
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  };

  return (
    <ScrollView
      style={{flex: 1, backgroundColor: T.bg, overflow: 'hidden'}}
      contentContainerStyle={{
        paddingHorizontal: ms(18),
        paddingTop: ms(16),
        paddingBottom: ms(40),
        gap: ms(12),
        flexGrow: 1,
      }}
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">
      <Header isDark={isDark} onToggleTheme={onToggleTheme} />

      <ModeToggle
        entryMode={entryMode}
        onModeSwitch={handleModeSwitch}
        text={text}
      />

      {calc.hasOdd && calc.validCount > 0 && (
        <View
          style={{
            backgroundColor: T.warningDim,
            borderRadius: ms(8),
            borderWidth: 1,
            borderColor: T.warningBorder,
            padding: ms(12),
          }}>
          <Mono
            style={{
              fontSize: ms(12),
              color: T.warning,
              letterSpacing: 0.2,
            }}>
            ⚠  Odd punch count — last entry treated as open IN punch.
          </Mono>
        </View>
      )}

      {entryMode === 'paste' && (
        <PasteInput card={card} text={text} setText={setText} />
      )}

      {entryMode === 'manual' && (
        <ManualInput
          card={card}
          manualTimes={manualTimes}
          setManualTimes={setManualTimes}
          openPicker={openPicker}
        />
      )}

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
        nowSecs={nowSecs}
        onClear={() => {
          setText('');
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
      <View style={{gap: ms(5)}}>
        <Mono
          style={{
            fontSize: ms(30),
            fontWeight: '800',
            color: T.text,
            letterSpacing: -1,
          }}>
          Shift<Text style={{color: T.accent}}>.</Text>Calc
        </Mono>
        <Mono
          style={{
            fontSize: ms(9),
            color: T.muted,
            letterSpacing: 1.2,
          }}>
          SECTOR 1 · NOIDA · EFFECTIVE HOURS
        </Mono>
      </View>
      <View style={{alignItems: 'flex-end', gap: ms(8)}}>
        <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
        <View style={{flexDirection: 'row', gap: ms(5)}}>
          <Chip
            label="MIN 8H"
            color={T.accent}
            bg={T.accentDim}
            border={T.accentBorder}
          />
          <Chip
            label="LIVE"
            color={T.blue}
            bg={T.blueDim}
            border={T.blueBorder}
          />
        </View>
      </View>
    </View>
  );
}

function ModeToggle({
  entryMode,
  onModeSwitch,
  text,
}: {
  entryMode: 'paste' | 'manual';
  onModeSwitch: (mode: 'paste' | 'manual') => void;
  text: string;
}) {
  const T = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: T.surface,
        borderRadius: ms(10),
        borderWidth: 1,
        borderColor: T.border,
        padding: ms(4),
        gap: ms(4),
      }}>
      {(['paste', 'manual'] as const).map(mode => {
        const active = entryMode === mode;
        return (
          <Pressable
            key={mode}
            onPress={() => onModeSwitch(mode)}
            style={{
              flex: 1,
              paddingVertical: ms(10),
              borderRadius: ms(7),
              alignItems: 'center',
              backgroundColor: active ? T.surface2 : 'transparent',
              borderWidth: active ? 1 : 0,
              borderColor: T.accentBorder,
            }}>
            <Mono
              style={{
                fontSize: ms(12),
                fontWeight: '700',
                letterSpacing: 0.5,
                color: active ? T.accent : T.muted,
              }}>
              {mode === 'paste' ? '⌗  Paste List' : '+  Manual Entry'}
            </Mono>
          </Pressable>
        );
      })}
    </View>
  );
}

function PasteInput({
  card,
  text,
  setText,
}: {
  card: object;
  text: string;
  setText: (v: string) => void;
}) {
  const T = useTheme();
  return (
    <View style={card}>
      <CardHeader label="PUNCH TIMELINE" />
      <TextInput
        style={{
          minHeight: ms(180),
          color: T.text,
          fontFamily: 'Courier New',
          fontSize: ms(14),
          lineHeight: ms(24),
          padding: ms(16),
          letterSpacing: 0.4,
          backgroundColor: T.inputBg,
        }}
        value={text}
        onChangeText={v => {
          const normalized = v.replace(/\\n/g, '\n');
          const rawLines = normalized
            .split('\n')
            .map(l => l.trim().replace(/^(IN|OUT)\s*[:\-]?\s*/i, ''))
            .filter(l => l && !/missing/i.test(l));
          const annotated = rawLines.map(
            (l, idx) => `${idx % 2 === 0 ? 'IN' : 'OUT'} - ${l}`,
          );
          setText(annotated.join('\n'));
        }}
        multiline
        textAlignVertical="top"
        placeholder={`Paste punch times, one per line
9:51:28 AM
10:41:33 AM
11:06:22 AM
1:46:16 PM
4:19:56 PM
7:31:16 PM`}
        placeholderTextColor={T.muted}
        autoCorrect={false}
        autoCapitalize="none"
      />
    </View>
  );
}

function ManualInput({
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
      <CardHeader label="MANUAL PUNCH ENTRY" />
      <View style={{gap: ms(14)}}>
      {manualTimes.map((val, i) => {
        const isIn = i % 2 === 0;
        const secs = parseTimeToSeconds(val);
        const valid = val.trim() !== '' && secs !== null;
        const invalid = val.trim() !== '' && secs === null;
        return (
          <View
            key={i}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: ms(7),
              paddingHorizontal: ms(14),
              paddingVertical: ms(9),
              borderBottomWidth: 1,
              borderBottomColor: T.border,
            }}>
            <Mono
              style={{
                fontSize: ms(10),
                color: T.muted,
                width: ms(18),
                textAlign: 'right',
              }}>
              {i + 1}
            </Mono>
            <View
              style={{
                paddingHorizontal: ms(7),
                paddingVertical: ms(3),
                borderRadius: ms(4),
                borderWidth: 1,
                backgroundColor: isIn ? inBg : outBg,
                borderColor: isIn ? inBorder : outBorder,
              }}>
              <Mono
                style={{
                  fontSize: ms(9),
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
                borderRadius: ms(7),
                color: T.text,
                fontFamily: 'Courier New',
                fontSize: ms(13),
                paddingHorizontal: ms(10),
                paddingVertical: ms(8),
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
              placeholder="9:51 AM"
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
                borderRadius: ms(7),
                width: ms(36),
                height: ms(36),
                alignItems: 'center',
                justifyContent: 'center',
              })}>
              <Text style={{fontSize: ms(16)}}>🕐</Text>
            </Pressable>
            <Pressable
              onPress={() =>
                setManualTimes(prev =>
                  prev.length === 1 ? [''] : prev.filter((_, j) => j !== i),
                )
              }
              style={({pressed}) => ({
                width: ms(28),
                height: ms(28),
                borderRadius: ms(6),
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: pressed ? T.orangeDim : 'transparent',
              })}>
              <Text
                style={{
                  color: T.orange,
                  fontSize: ms(20),
                  fontWeight: '300',
                  lineHeight: ms(22),
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
          padding: ms(14),
          borderWidth: 1,
          borderColor: T.accentBorder,
          borderStyle: 'dashed',
          borderRadius: ms(8),
          alignItems: 'center',
          backgroundColor: pressed ? T.accentDim : 'transparent',
        })}>
        <Mono
          style={{
            fontSize: ms(13),
            fontWeight: '700',
            color: T.accent,
            letterSpacing: 0.5,
          }}>
          + Add Punch Time
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
      <CardHeader label="RETURN AFTER BREAK" />
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: ms(8),
          padding: ms(14),
        }}>
        {GAP_OPTIONS.map(m => {
          const active = rejoinGap === m;
          return (
            <Pressable
              key={m}
              onPress={() => setRejoinGap(m)}
              style={{
                paddingHorizontal: ms(16),
                paddingVertical: ms(8),
                borderRadius: ms(20),
                borderWidth: 1,
                borderColor: active ? T.accentBorder : T.border,
                backgroundColor: active ? T.accentDim : T.inputBg,
              }}>
              <Mono
                style={{
                  fontSize: ms(12),
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
  nowSecs,
  onClear,
}: {
  card: object;
  section: object;
  calc: ReturnType<typeof useShiftCalculation>;
  nowSecs: number;
  onClear: () => void;
}) {
  const T = useTheme();
  return (
    <View style={card}>
      <View
        style={{
          padding: ms(22),
          paddingBottom: ms(18),
          borderBottomWidth: 1,
          borderBottomColor: T.border,
          gap: ms(8),
        }}>
        <Mono
          style={{
            fontSize: ms(10),
            color: T.muted,
            letterSpacing: 2,
          }}>
          EFFECTIVE DURATION
        </Mono>
        <Mono
          style={{
            fontSize: ms(50),
            fontWeight: '700',
            letterSpacing: -1,
            lineHeight: ms(54),
            color: calc.total === 0 ? T.muted : T.accent,
          }}>
          {formatHMS(calc.total)}
        </Mono>
        <View
          style={{
            alignSelf: 'flex-start',
            backgroundColor: T.accentDim,
            borderRadius: ms(5),
            borderWidth: 1,
            borderColor: T.accentBorder,
            paddingHorizontal: ms(12),
            paddingVertical: ms(4),
          }}>
          <Mono style={{fontSize: ms(13), color: T.accent, fontWeight: '700'}}>
            {(calc.total / 3600).toFixed(2)} h
          </Mono>
        </View>
      </View>

      <View style={section}>
        <ProgressBar pct={calc.pct} />
      </View>

      {calc.validCount > 0 && (
        <View
          style={{
            ...(section as object),
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: ms(16),
          }}>
          {calc.remaining > 0 && calc.completionAt !== null ? (
            <>
              <StatBox
                label="REMAINING"
                value={formatHMS(calc.remaining)}
                color={T.orange}
              />
              <StatBox
                label="8H DONE AT"
                value={formatClock(calc.completionAt)}
                color={T.accent}
              />
              {calc.suggestedIn !== null && (
                <StatBox
                  label="PUNCH IN AT"
                  value={formatClock(calc.suggestedIn)}
                  color={T.blue}
                />
              )}
              <StatBox
                label="STATUS"
                value={calc.hasOdd ? '● PUNCHED IN' : '○ ON BREAK'}
                color={calc.hasOdd ? T.accent : T.orange}
              />
            </>
          ) : calc.remaining === 0 ? (
            <StatBox label="STATUS" value="✓  8H COMPLETE" color={T.accent} />
          ) : null}
        </View>
      )}

      {calc.pairs.length > 0 && (
        <View style={{...section, gap: ms(12)}}>
          <Mono
            style={{
              fontSize: ms(10),
              color: T.muted,
              letterSpacing: 1.5,
            }}>
            SHIFT SEGMENTS
          </Mono>
          <View style={{gap: ms(9)}}>
            {calc.pairs.map((p, i) => (
              <SegmentRow
                key={i}
                inLabel={formatClock(p.inS)}
                outLabel={formatClock(p.outS)}
                inSecs={p.inS}
                outSecs={p.outS}
                dur={p.dur}
                minT={calc.minT}
                maxT={calc.maxT}
              />
            ))}
            {calc.hasOdd && calc.openInSecs !== null && (
              <SegmentRow
                key="open"
                inLabel={formatClock(calc.openInSecs)}
                outLabel="now…"
                inSecs={calc.openInSecs}
                outSecs={nowSecs}
                dur={Math.max(0, nowSecs - calc.openInSecs)}
                minT={calc.minT}
                maxT={Math.max(calc.maxT, nowSecs)}
                isOpen
              />
            )}
          </View>
        </View>
      )}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: ms(16),
        }}>
        <Mono style={{fontSize: ms(11), color: T.muted}}>
          Valid entries: {calc.validCount}
        </Mono>
        <Pressable
          onPress={onClear}
          style={({pressed}) => ({
            borderWidth: 1,
            borderColor: T.orangeBorder,
            borderRadius: ms(6),
            paddingHorizontal: ms(16),
            paddingVertical: ms(7),
            backgroundColor: pressed ? T.orangeDim : 'transparent',
          })}>
          <Mono
            style={{
              fontSize: ms(11),
              fontWeight: '700',
              color: T.orange,
              letterSpacing: 1,
            }}>
            ✕  CLEAR
          </Mono>
        </Pressable>
      </View>
    </View>
  );
}
