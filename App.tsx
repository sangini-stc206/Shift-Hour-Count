import React, {useMemo, useState} from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
  ScrollView,
  Switch,
} from 'react-native';
import {SafeAreaProvider, useSafeAreaInsets} from 'react-native-safe-area-context';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

function parseTimeToSeconds(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  // Expect formats like "9:51:28 AM" or "09:51 AM"
  const match =
    trimmed.match(
      /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i,
    ) || trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/i);

  if (!match) {
    return null;
  }

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const seconds = match[3] ? parseInt(match[3], 10) : 0;
  const ampm = match[4]?.toUpperCase();

  if (ampm) {
    if (ampm === 'PM' && hours !== 12) {
      hours += 12;
    } else if (ampm === 'AM' && hours === 12) {
      hours = 0;
    }
  }

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    Number.isNaN(seconds) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59 ||
    seconds < 0 ||
    seconds > 59
  ) {
    return null;
  }

  return hours * 3600 + minutes * 60 + seconds;
}

function formatSeconds(totalSeconds: number): string {
  const sign = totalSeconds < 0 ? '-' : '';
  const seconds = Math.abs(totalSeconds);

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  const hh = h.toString().padStart(2, '0');
  const mm = m.toString().padStart(2, '0');
  const ss = s.toString().padStart(2, '0');

  return `${sign}${hh}:${mm}:${ss}`;
}

function formatClockTimeFromSeconds(totalSeconds: number): string {
  const secondsInDay = 24 * 60 * 60;
  const normalized =
    ((totalSeconds % secondsInDay) + secondsInDay) % secondsInDay;

  let hours = Math.floor(normalized / 3600);
  const minutes = Math.floor((normalized % 3600) / 60);
  const seconds = normalized % 60;

  const ampm = hours >= 12 ? 'PM' : 'AM';
  if (hours === 0) {
    hours = 12;
  } else if (hours > 12) {
    hours -= 12;
  }

  const mm = minutes.toString().padStart(2, '0');
  const ss = seconds.toString().padStart(2, '0');

  return `${hours}:${mm}:${ss} ${ampm}`;
}

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      <ScreenRoot />
    </SafeAreaProvider>
  );
}

function ScreenRoot() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.safeArea,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          backgroundColor: '#f3f4f6',
        },
      ]}>
      <ShiftCalculator />
    </View>
  );
}

function ShiftCalculator() {
  const [entryMode, setEntryMode] = useState<'paste' | 'manual'>('paste');
  const [text, setText] = useState('');
  const [manualTimes, setManualTimes] = useState<string[]>(['']);
  const [rejoinGapMinutes, setRejoinGapMinutes] = useState(30);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);
  const [pickerValue, setPickerValue] = useState<Date>(new Date());

  const parsed = useMemo(() => {
    const lines =
      entryMode === 'paste'
        ? text
            .split('\n')
            .map(l => l.trim())
            .filter(l => l.length > 0)
        : manualTimes.map(l => l.trim()).filter(l => l.length > 0);

    const times: {raw: string; seconds: number | null}[] = [];

    for (const line of lines) {
      const seconds = parseTimeToSeconds(line);
      // Ignore helper words like "MISSING" / "OUT MISSING" instead of flagging them
      if (seconds == null && /missing/i.test(line)) {
        continue;
      }
      times.push({raw: line, seconds});
    }

    const validTimes = times.filter(t => t.seconds != null);

    let totalSeconds = 0;
    // Sum all complete in-out pairs (worked time so far)
    for (let i = 0; i + 1 < validTimes.length; i += 2) {
      const start = validTimes[i].seconds!;
      const end = validTimes[i + 1].seconds!;
      if (end > start) {
        totalSeconds += end - start;
      }
    }

    const hasOddCount = validTimes.length % 2 === 1;

    const eightHoursSeconds = 8 * 60 * 60;
    const remainingToEight = Math.max(0, eightHoursSeconds - totalSeconds);

    let completionAtSeconds: number | null = null;
    let suggestedInAtSeconds: number | null = null;

    if (remainingToEight > 0 && validTimes.length > 0) {
      const lastTimeSeconds = validTimes[validTimes.length - 1].seconds!;

      if (hasOddCount) {
        // Currently punched IN: last time is IN, so just project when 8 hours completes
        completionAtSeconds = lastTimeSeconds + remainingToEight;
      } else {
        // All pairs closed but under 8 hours:
        // suggest punching in again after the configured break duration
        // and project completion from that suggested IN time
        suggestedInAtSeconds = lastTimeSeconds + rejoinGapMinutes * 60;
        completionAtSeconds = suggestedInAtSeconds + remainingToEight;
      }
    }

    const invalidLines = times.filter(t => t.seconds == null && t.raw !== '');

    return {
      totalSeconds,
      hasOddCount,
      invalidLines,
      validCount: validTimes.length,
      completionAtSeconds,
      suggestedInAtSeconds,
      remainingToEight,
    };
  }, [text, manualTimes, entryMode, rejoinGapMinutes]);

  // Bright, soft light theme
  const textColor = '#111827';
  const subTextColor = '#6b7280';
  const cardColor = '#ffffff';
  const borderColor = '#93c5fd';
  const accentColor = '#2563eb';
  const pillBg = '#e0f2fe';
  const pillText = '#0369a1';
  const gapOptions = [5, 10, 20, 30, 45, 60];

  return (
    <ScrollView
      style={{flex: 1}}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled">
      <View style={styles.headerRow}>

        <View style={styles.headerTextBlock}>
          <Text style={[styles.appTitle, {color: textColor}]}>
            Shift Hours Calculator
          </Text>
          <Text style={[styles.appSubtitle, {color: subTextColor}]}>
            Calculate effective working hours and minimum 8h completion time.
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: cardColor,
            borderColor,
            shadowColor: accentColor,
          },
        ]}>
        <View style={styles.chipRow}>
          <View style={[styles.chip, {backgroundColor: pillBg}]}>
            <Text style={[styles.chipText, {color: pillText}]}>
              Sector 1 · Noida
            </Text>
          </View>
          <View style={[styles.chip, {backgroundColor: '#eef2ff'}]}>
            <Text style={[styles.chipText, {color: '#3730a3'}]}>Min 8 hours</Text>
          </View>
        </View>

        <Text style={[styles.title, {color: textColor}]}>
          Shift Effective Hours
        </Text>
        <Text style={[styles.subtitle, {color: subTextColor}]}>
          Choose how you want to enter times, then we auto match in/out pairs
          and tell you exactly when your minimum 8 hours are done.
        </Text>

        <View style={styles.modeToggleRow}>
          <Text style={[styles.modeToggleLabel, {color: subTextColor}]}>
            Paste list
          </Text>
          <Switch
            value={entryMode === 'manual'}
            onValueChange={value => {
              if (value) {
                // Switching to manual mode: copy current pasted times (ignore helper text like "MISSING")
                const lines = text
                  .split('\n')
                  .map(l => l.trim())
                  .filter(
                    l => l.length > 0 && !/missing/i.test(l),
                  );
                if (lines.length > 0) {
                  setManualTimes(lines);
                } else {
                  setManualTimes(['']);
                }
                setEntryMode('manual');
              } else {
                setEntryMode('paste');
              }
            }}
            trackColor={{false: '#e5e7eb', true: accentColor}}
            thumbColor="#ffffff"
          />
          <Text style={[styles.modeToggleLabel, {color: subTextColor}]}>
            Manual
          </Text>
        </View>

        {!parsed.hasOddCount &&
          parsed.remainingToEight > 0 &&
          parsed.validCount > 0 && (
          <View style={styles.gapRow}>
            <Text style={[styles.gapLabel, {color: subTextColor}]}>
              When you will back to work after break
            </Text>
            <View style={styles.gapOptionsRow}>
              {gapOptions.map(minutes => (
                <Pressable
                  key={minutes}
                  onPress={() => setRejoinGapMinutes(minutes)}
                  style={({pressed}) => [
                    styles.gapOption,
                    {
                      borderColor:
                        rejoinGapMinutes === minutes
                          ? accentColor
                          : '#d1d5db',
                      backgroundColor:
                        rejoinGapMinutes === minutes
                          ? '#e0f2fe'
                          : pressed
                          ? '#f3f4f6'
                          : '#ffffff',
                    },
                  ]}>
                  <Text
                    style={[
                      styles.gapOptionText,
                      {
                        color:
                          rejoinGapMinutes === minutes
                            ? accentColor
                            : '#4b5563',
                      },
                    ]}>
                    {minutes}m
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {entryMode === 'paste' && (
          <View
            style={[
              styles.inputWrapper,
              {
                borderColor: accentColor,
                backgroundColor: '#f9fafb',
              },
            ]}>
            <Text style={[styles.inputLabel, {color: subTextColor}]}>
              Punch timeline
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: textColor,
                },
              ]}
              value={text}
              onChangeText={value => {
                const cleaned = value
                  .split('\n')
                  .filter(line => !/missing/i.test(line))
                  .join('\n');
                setText(cleaned);
              }}
              multiline
              textAlignVertical="top"
              placeholder="Example:
9:51:28 AM
10:41:33 AM
11:06:22 AM
1:46:16 PM
2:37:49 PM
4:19:56 PM
4:41:29 PM
7:31:16 PM"
              placeholderTextColor={subTextColor}
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>
        )}

        {entryMode === 'manual' && (
          <View
            style={[
              styles.inputWrapper,
              {
                borderColor: accentColor,
                backgroundColor: '#f9fafb',
              },
            ]}>
            <Text style={[styles.inputLabel, {color: subTextColor}]}>
              Add times (one field per punch)
            </Text>
            {manualTimes.map((value, index) => (
              <View key={index} style={styles.manualRow}>
                <View style={styles.manualInputRow}>
                <TextInput
                  style={[
                    styles.manualInput,
                    {
                      color: textColor,
                    },
                  ]}
                  value={value}
                  onChangeText={v => {
                    setManualTimes(prev => {
                      const copy = [...prev];
                      copy[index] = v;
                      return copy;
                    });
                  }}
                  placeholder="Tap 'Pick time' to select"
                  placeholderTextColor={subTextColor}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                  <Pressable
                    onPress={() => {
                      setPickerIndex(index);
                      // try to seed picker with existing value if parseable
                      const seconds = parseTimeToSeconds(value);
                      if (seconds != null) {
                        const base = new Date();
                        base.setHours(0, 0, 0, 0);
                        const seeded = new Date(
                          base.getTime() + seconds * 1000,
                        );
                        setPickerValue(seeded);
                      } else {
                        setPickerValue(new Date());
                      }
                      setPickerVisible(true);
                    }}
                    style={({pressed}) => [
                      styles.timeButton,
                      {
                        borderColor: accentColor,
                        backgroundColor: pressed ? '#dbeafe' : '#eff6ff',
                      },
                    ]}>
                    <Text style={[styles.timeButtonText, {color: accentColor}]}>
                      Pick time
                    </Text>
                  </Pressable>
                  {value.trim().length > 0 && (
                    <Pressable
                      onPress={() => {
                        setManualTimes(prev => {
                          if (prev.length === 1) {
                            return [''];
                          }
                          const copy = [...prev];
                          copy.splice(index, 1);
                          return copy;
                        });
                      }}
                      style={({pressed}) => [
                        styles.deleteButton,
                        {
                          backgroundColor: pressed ? '#fee2e2' : 'transparent',
                        },
                      ]}>
                      <Text style={styles.deleteButtonText}>Remove</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            ))}
            <Pressable
              onPress={() =>
                setManualTimes(prev => [...prev, ''])
              }
              style={({pressed}) => [
                styles.addButton,
                {
                  backgroundColor: pressed ? accentColor : 'transparent',
                  borderColor: accentColor,
                },
              ]}>
              <Text style={[styles.addButtonText, {color: accentColor}]}>
                + Add time
              </Text>
            </Pressable>
          </View>
        )}

        {pickerVisible && pickerIndex != null && (
          <DateTimePicker
            value={pickerValue}
            mode="time"
            display="default"
            onChange={(event: DateTimePickerEvent, date?: Date) => {
              if (event.type === 'dismissed' || !date) {
                setPickerVisible(false);
                setPickerIndex(null);
                return;
              }

              const hours = date.getHours();
              const minutes = date.getMinutes();
              const seconds = date.getSeconds();

              let displayHours = hours % 12 || 12;
              const ampm = hours >= 12 ? 'PM' : 'AM';

              const mm = minutes.toString().padStart(2, '0');
              const ss = seconds.toString().padStart(2, '0');
              const formatted = `${displayHours}:${mm}:${ss} ${ampm}`;

              setManualTimes(prev => {
                const copy = [...prev];
                if (pickerIndex >= 0 && pickerIndex < copy.length) {
                  copy[pickerIndex] = formatted;
                }
                return copy;
              });
              setPickerVisible(false);
              setPickerIndex(null);
            }}
          />
        )}

        <View style={styles.resultContainer}>
          <Text style={[styles.resultLabel, {color: subTextColor}]}>
            Effective duration
          </Text>
          <View style={styles.resultRow}>
            <Text style={[styles.resultValue, {color: accentColor}]}>
              {formatSeconds(parsed.totalSeconds)}
            </Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {`${(parsed.totalSeconds / 3600).toFixed(2)} h`}
              </Text>
            </View>
          </View>

          {parsed.remainingToEight > 0 && parsed.completionAtSeconds != null && (
            <>
              <Text style={[styles.meta, {color: subTextColor}]}>
                You still need {formatSeconds(parsed.remainingToEight)} hours to reach min
                8 hours.
              </Text>
              {parsed.suggestedInAtSeconds == null ? (
                <Text style={[styles.meta, {color: subTextColor}]}>
                  Stay on and you&apos;ll complete 8h at{' '}
                  <Text
                    style={{
                      color: accentColor,
                      fontSize: 15,
                      fontWeight: '600',
                    }}>
                    {formatClockTimeFromSeconds(parsed.completionAtSeconds)}
                  </Text>
                  .
                </Text>
              ) : (
                <Text style={[styles.meta, {color: subTextColor}]}>
                  If you punch back in at{' '}
                  <Text
                    style={{
                      color: accentColor,
                      fontSize: 15,
                      fontWeight: '600',
                    }}>
                    {formatClockTimeFromSeconds(parsed.suggestedInAtSeconds)}
                  </Text>
                  , you&apos;ll finish 8h at{' '}
                  <Text
                    style={{
                      color: accentColor,
                      fontSize: 15,
                      fontWeight: '600',
                    }}>
                    {formatClockTimeFromSeconds(parsed.completionAtSeconds)}
                  </Text>
                  .
                </Text>
              )}
            </>
          )}

          <View style={styles.footerRow}>
            <Text style={[styles.meta, {color: subTextColor}]}>
              {`Valid entries: ${parsed.validCount}`}
            </Text>
            <Pressable
              onPress={() => {
                setText('');
                setManualTimes(['']);
              }}
              style={({pressed}) => [
                styles.resetButton,
                {
                  backgroundColor: pressed ? accentColor : 'transparent',
                  borderColor: accentColor,
                },
              ]}>
              <Text style={[styles.resetText, {color: accentColor}]}>
                Clear
              </Text>
            </Pressable>
          </View>

          {parsed.hasOddCount && (
            <Text style={[styles.warning, {color: '#fb923c'}]}>
              Odd punch count — last time is treated as IN to project 8h
              completion.
            </Text>
          )}
          {/* {parsed.invalidLines.length > 0 && (
            <View style={styles.warningBlock}>
              <Text style={[styles.warningTitle, {color: '#fca5a5'}]}>
                Couldn&apos;t read:
              </Text>
              {parsed.invalidLines.map(line => (
                <Text
                  key={line.raw}
                  style={[styles.warningLine, {color: '#fecaca'}]}>
                  {`\u2022 ${line.raw}`}
                </Text>
              ))}
              <Text style={[styles.warningHint, {color: subTextColor}]}>
                Try formats like `9:51:28 AM` or `09:51`.
              </Text>
            </View>
          )} */}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  logoBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 22,
  },
  headerTextBlock: {
    flex: 1,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  appSubtitle: {
    fontSize: 12,
  },
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    gap: 16,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },
  modeToggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  modeToggleButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#4b5563',
  },
  modeToggleLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  gapRow: {
    marginTop: 12,
    marginBottom: 4,
  },
  gapLabel: {
    fontSize: 1,
    marginBottom: 4,
  },
  gapOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gapOption: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  gapOptionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  chipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  inputWrapper: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f9fafb',
  },
  inputLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  input: {
    minHeight: 160,
    fontSize: 14,
  },
  manualRow: {
    marginBottom: 8,
  },
  manualInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  manualInput: {
    borderWidth: 1,
    borderRadius: 12,
    borderColor: '#cbd5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  timeButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  timeButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 999,
  },
  deleteButtonText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#b91c1c',
  },
  resultContainer: {
    paddingVertical: 10,
    gap: 6,
    marginTop: 8,
  },
  resultLabel: {
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultValue: {
    fontSize: 30,
    fontWeight: '700',
  },
  resultSecondary: {
    fontSize: 16,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#e0f2fe',
    borderWidth: 0,
  },
  badgeText: {
    fontSize: 12,
    color: '#1d4ed8',
  },
  meta: {
    marginTop: 6,
    fontSize: 12,
  },
  warning: {
    marginTop: 4,
    fontSize: 13,
  },
  warningBlock: {
    marginTop: 8,
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#FEF2F2',
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  warningLine: {
    fontSize: 13,
  },
  warningHint: {
    marginTop: 4,
    fontSize: 12,
  },
  footerRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resetButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  resetText: {
    fontSize: 13,
    fontWeight: '600',
  },
  addButton: {
    marginTop: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default App;
