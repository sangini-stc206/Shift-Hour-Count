import React, {useMemo, useState, useRef, useEffect} from 'react';
import {
  StatusBar,
  Text,
  TextInput,
  View,
  Pressable,
  ScrollView,
  Animated,
  Easing,
  useColorScheme,
} from 'react-native';
import {SafeAreaProvider, useSafeAreaInsets} from 'react-native-safe-area-context';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

// ─── Helpers ────────────────────────────────────────────────────────────────

function parseTimeToSeconds(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match =
    trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i) ||
    trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const seconds = match[3] ? parseInt(match[3], 10) : 0;
  const ampm = match[4]?.toUpperCase();
  if (ampm) {
    if (ampm === 'PM' && hours !== 12) hours += 12;
    else if (ampm === 'AM' && hours === 12) hours = 0;
  }
  if (
    isNaN(hours) || isNaN(minutes) || isNaN(seconds) ||
    hours < 0 || hours > 23 || minutes < 0 || minutes > 59 ||
    seconds < 0 || seconds > 59
  ) return null;
  return hours * 3600 + minutes * 60 + seconds;
}

function formatHMS(totalSeconds: number): string {
  const sign = totalSeconds < 0 ? '-' : '';
  const abs = Math.abs(totalSeconds);
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const s = abs % 60;
  return `${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatClock(totalSecs: number): string {
  const day = 24 * 3600;
  const norm = ((totalSecs % day) + day) % day;
  let h = Math.floor(norm / 3600);
  const m = Math.floor((norm % 3600) / 60);
  const s = norm % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')} ${ampm}`;
}

// ─── Theme ──────────────────────────────────────────────────────────────────

type Theme = {
  isDark: boolean;
  bg: string;
  surface: string;
  surface2: string;
  border: string;
  accent: string;
  accentDim: string;
  accentBorder: string;
  orange: string;
  orangeDim: string;
  orangeBorder: string;
  blue: string;
  blueDim: string;
  blueBorder: string;
  text: string;
  muted: string;
  warning: string;
  warningDim: string;
  warningBorder: string;
  inputBg: string;
  trackBg: string;
};

const dark: Theme = {
  isDark: true,
  bg: '#0d0f12',
  surface: '#141720',
  surface2: '#1c2030',
  border: '#252a3a',
  accent: '#4fffb0',
  accentDim: 'rgba(79,255,176,0.10)',
  accentBorder: 'rgba(79,255,176,0.28)',
  orange: '#ff6b35',
  orangeDim: 'rgba(255,107,53,0.10)',
  orangeBorder: 'rgba(255,107,53,0.28)',
  blue: '#38bdf8',
  blueDim: 'rgba(56,189,248,0.10)',
  blueBorder: 'rgba(56,189,248,0.28)',
  text: '#e8eaf0',
  muted: '#4e5a78',
  warning: '#fbbf24',
  warningDim: 'rgba(251,191,36,0.08)',
  warningBorder: 'rgba(251,191,36,0.28)',
  inputBg: '#0a0c0f',
  trackBg: '#0a0c0f',
};

const light: Theme = {
  isDark: false,
  bg: '#eef0f8',
  surface: '#ffffff',
  surface2: '#f4f6ff',
  border: '#dde2f0',
  accent: '#0b8f5e',
  accentDim: 'rgba(11,143,94,0.08)',
  accentBorder: 'rgba(11,143,94,0.25)',
  orange: '#c94f18',
  orangeDim: 'rgba(201,79,24,0.08)',
  orangeBorder: 'rgba(201,79,24,0.25)',
  blue: '#0369a1',
  blueDim: 'rgba(3,105,161,0.08)',
  blueBorder: 'rgba(3,105,161,0.25)',
  text: '#111827',
  muted: '#9ca3b8',
  warning: '#92400e',
  warningDim: 'rgba(146,64,14,0.07)',
  warningBorder: 'rgba(146,64,14,0.25)',
  inputBg: '#f8f9fd',
  trackBg: '#e2e6f4',
};

const ThemeCtx = React.createContext<Theme>(dark);
const useTheme = () => React.useContext(ThemeCtx);

// ─── Reusable bits ───────────────────────────────────────────────────────────

function Mono({children, style}: {children: React.ReactNode; style?: any}) {
  return <Text style={[{fontFamily: 'Courier New'}, style]}>{children}</Text>;
}

function CardHeader({label}: {label: string}) {
  const T = useTheme();
  return (
    <View style={{flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: T.border}}>
      <View style={{width: 7, height: 7, borderRadius: 4, backgroundColor: T.accent}} />
      <Mono style={{fontSize: 10, fontWeight: '700', color: T.muted, letterSpacing: 1.6}}>{label}</Mono>
    </View>
  );
}

function Chip({label, color, bg, border}: {label: string; color: string; bg: string; border: string}) {
  return (
    <View style={{backgroundColor: bg, borderColor: border, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 4}}>
      <Mono style={{fontSize: 9, fontWeight: '700', color, letterSpacing: 1}}>{label}</Mono>
    </View>
  );
}

// ─── Animated Progress Bar ───────────────────────────────────────────────────

function ProgressBar({pct}: {pct: number}) {
  const T = useTheme();
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {toValue: pct, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: false}).start();
  }, [pct]);
  const color = pct >= 100 ? T.accent : pct >= 60 ? T.blue : T.orange;
  return (
    <View>
      <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10}}>
        <Mono style={{fontSize: 10, color: T.muted, letterSpacing: 1.4}}>PROGRESS TO 8 HOURS</Mono>
        <Mono style={{fontSize: 11, fontWeight: '700', color}}>{pct}%</Mono>
      </View>
      <View style={{height: 6, backgroundColor: T.trackBg, borderRadius: 3, overflow: 'hidden', borderWidth: 1, borderColor: T.border}}>
        <Animated.View style={{height: 6, borderRadius: 3, backgroundColor: color, width: anim.interpolate({inputRange: [0, 100], outputRange: ['0%', '100%']})}} />
      </View>
    </View>
  );
}

// ─── Theme Toggle ────────────────────────────────────────────────────────────

function ThemeToggle({isDark, onToggle}: {isDark: boolean; onToggle: () => void}) {
  const T = useTheme();
  const anim = useRef(new Animated.Value(isDark ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(anim, {toValue: isDark ? 1 : 0, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: false}).start();
  }, [isDark]);
  const knobX = anim.interpolate({inputRange: [0, 1], outputRange: [2, 20]});
  const trackColor = anim.interpolate({inputRange: [0, 1], outputRange: ['#dde2f0', '#1c2030']});
  return (
    <Pressable onPress={onToggle} style={{flexDirection: 'row', alignItems: 'center', gap: 7}}>
      <Text style={{fontSize: 15}}>{isDark ? '🌙' : '☀️'}</Text>
      <Animated.View style={{width: 42, height: 24, borderRadius: 12, backgroundColor: trackColor, justifyContent: 'center', borderWidth: 1, borderColor: T.border}}>
        <Animated.View style={{
          width: 18, height: 18, borderRadius: 9,
          backgroundColor: T.accent,
          transform: [{translateX: knobX}],
          shadowColor: T.accent, shadowOpacity: 0.6, shadowRadius: 4, elevation: 3,
        }} />
      </Animated.View>
    </Pressable>
  );
}

// ─── Projection Stat ─────────────────────────────────────────────────────────

function StatBox({label, value, color}: {label: string; value: string; color: string}) {
  const T = useTheme();
  return (
    <View style={{minWidth: '44%', flex: 1}}>
      <Mono style={{fontSize: 9, color: T.muted, letterSpacing: 1.5, marginBottom: 4}}>{label}</Mono>
      <Mono style={{fontSize: 17, fontWeight: '700', color, letterSpacing: 0.2}}>{value}</Mono>
    </View>
  );
}

// ─── Segment Row ─────────────────────────────────────────────────────────────

function SegmentRow({inLabel, outLabel, inSecs, outSecs, dur, minT, maxT, isOpen}: {
  inLabel: string; outLabel: string; inSecs: number; outSecs: number;
  dur: number; minT: number; maxT: number; isOpen?: boolean;
}) {
  const T = useTheme();
  const span = Math.max(maxT - minT, 1);
  const leftPct = ((inSecs - minT) / span) * 100;
  const widthPct = Math.max(4, ((outSecs - inSecs) / span) * 100);
  return (
    <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 9}}>
      <Mono style={{fontSize: 11, color: T.accent, width: 85}}>{inLabel}</Mono>
      <View style={{flex: 1, height: 4, backgroundColor: T.trackBg, borderRadius: 2, overflow: 'hidden'}}>
        <View style={{
          position: 'absolute', left: `${Math.max(0, leftPct)}%` as any,
          width: `${widthPct}%` as any, height: 4, borderRadius: 2,
          backgroundColor: isOpen ? T.accent : T.blue, opacity: isOpen ? 0.45 : 0.8,
        }} />
      </View>
      <Mono style={{fontSize: 11, color: isOpen ? T.muted : T.orange, width: 82, textAlign: 'right'}}>
        {isOpen ? 'ongoing…' : outLabel}
      </Mono>
      <Mono style={{fontSize: 11, color: isOpen ? T.accent : T.muted, width: 56, textAlign: 'right'}}>
        {formatHMS(dur)}
      </Mono>
    </View>
  );
}

// ─── Root ────────────────────────────────────────────────────────────────────

export default function App() {
  const sys = useColorScheme();
  const [isDark, setIsDark] = useState(sys !== 'light');
  const theme = isDark ? dark : light;
  return (
    <ThemeCtx.Provider value={theme}>
      <SafeAreaProvider>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />
        <ShiftCalculator isDark={isDark} onToggleTheme={() => setIsDark(d => !d)} />
      </SafeAreaProvider>
    </ThemeCtx.Provider>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

const GAP_OPTIONS = [5, 10, 20, 30, 45, 60];

function ShiftCalculator({isDark, onToggleTheme}: {isDark: boolean; onToggleTheme: () => void}) {
  const T = useTheme();
  const insets = useSafeAreaInsets();

  const [entryMode, setEntryMode] = useState<'paste' | 'manual'>('paste');
  const [text, setText] = useState('');
  const [manualTimes, setManualTimes] = useState<string[]>(['']);
  const [rejoinGap, setRejoinGap] = useState(30);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);
  const [pickerValue, setPickerValue] = useState(new Date());

  // ── Calculation ──────────────────────────────────────────────
  const calc = useMemo(() => {
    const lines =
      entryMode === 'paste'
        ? text.split('\n').map(l => l.trim()).filter(l => l && !/missing/i.test(l))
        : manualTimes.map(l => l.trim()).filter(l => l && !/missing/i.test(l));

    const valid = lines
      .map(raw => ({raw, secs: parseTimeToSeconds(raw)}))
      .filter((t): t is {raw: string; secs: number} => t.secs !== null);

    let total = 0;
    const pairs: {inS: number; outS: number; dur: number}[] = [];
    for (let i = 0; i + 1 < valid.length; i += 2) {
      const dur = valid[i + 1].secs - valid[i].secs;
      if (dur > 0) { total += dur; pairs.push({inS: valid[i].secs, outS: valid[i + 1].secs, dur}); }
    }

    const hasOdd = valid.length % 2 === 1;
    const target = 8 * 3600;
    const remaining = Math.max(0, target - total);
    const pct = Math.min(100, Math.round((total / target) * 100));

    let completionAt: number | null = null;
    let suggestedIn: number | null = null;
    if (remaining > 0 && valid.length > 0) {
      const last = valid[valid.length - 1].secs;
      if (hasOdd) { completionAt = last + remaining; }
      else { suggestedIn = last + rejoinGap * 60; completionAt = suggestedIn + remaining; }
    }

    const minT = pairs.length ? Math.min(...pairs.map(p => p.inS)) : 0;
    const maxT = pairs.length ? Math.max(...pairs.map(p => p.outS)) : 1;
    const openInSecs = hasOdd && valid.length > 0 ? valid[valid.length - 1].secs : null;

    return {total, pairs, hasOdd, remaining, pct, completionAt, suggestedIn, validCount: valid.length, minT, maxT, openInSecs};
  }, [text, manualTimes, entryMode, rejoinGap]);

  const showGap = !calc.hasOdd && calc.remaining > 0 && calc.validCount > 0;

  // ── Picker ───────────────────────────────────────────────────
  function openPicker(index: number) {
    const secs = parseTimeToSeconds(manualTimes[index] ?? '');
    if (secs !== null) {
      const base = new Date(); base.setHours(0, 0, 0, 0);
      setPickerValue(new Date(base.getTime() + secs * 1000));
    } else { setPickerValue(new Date()); }
    setPickerIndex(index);
    setPickerVisible(true);
  }

  function onPickerChange(event: DateTimePickerEvent, date?: Date) {
    setPickerVisible(false);
    if (event.type === 'dismissed' || !date || pickerIndex === null) { setPickerIndex(null); return; }
    const h = date.getHours(), m = date.getMinutes(), s = date.getSeconds();
    const fmt = `${h % 12 || 12}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
    setManualTimes(prev => { const c = [...prev]; c[pickerIndex!] = fmt; return c; });
    setPickerIndex(null);
  }

  // ── "Now" for open segment ───────────────────────────────────
  const now = new Date();
  const nowSecs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

  // ── Shared style shortcuts ───────────────────────────────────
  const card = {backgroundColor: T.surface, borderRadius: 14, borderWidth: 1, borderColor: T.border, overflow: 'hidden' as const, marginBottom: 0};
  const section = {padding: 18, borderBottomWidth: 1, borderBottomColor: T.border};

  return (
    <ScrollView
      style={{flex: 1, backgroundColor: T.bg}}
      contentContainerStyle={{paddingHorizontal: 18, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40, gap: 12}}
      keyboardShouldPersistTaps="handled">

      {/* ── Header ── */}
      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2}}>
        <View>
          <Mono style={{fontSize: 30, fontWeight: '800', color: T.text, letterSpacing: -1}}>
            Shift<Text style={{color: T.accent}}>.</Text>Calc
          </Mono>
          <Mono style={{fontSize: 9, color: T.muted, letterSpacing: 1.2, marginTop: 5}}>SECTOR 1 · NOIDA · EFFECTIVE HOURS</Mono>
        </View>
        <View style={{alignItems: 'flex-end', gap: 8}}>
          <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
          <View style={{flexDirection: 'row', gap: 5}}>
            <Chip label="MIN 8H" color={T.accent} bg={T.accentDim} border={T.accentBorder} />
            <Chip label="LIVE" color={T.blue} bg={T.blueDim} border={T.blueBorder} />
          </View>
        </View>
      </View>

      {/* ── Mode Toggle ── */}
      <View style={{flexDirection: 'row', backgroundColor: T.surface, borderRadius: 10, borderWidth: 1, borderColor: T.border, padding: 4, gap: 4}}>
        {(['paste', 'manual'] as const).map(m => {
          const active = entryMode === m;
          return (
            <Pressable
              key={m}
              onPress={() => setEntryMode(m)}
              style={{flex: 1, paddingVertical: 10, borderRadius: 7, alignItems: 'center', backgroundColor: active ? T.surface2 : 'transparent', borderWidth: active ? 1 : 0, borderColor: T.accentBorder}}>
              <Mono style={{fontSize: 12, fontWeight: '700', letterSpacing: 0.5, color: active ? T.accent : T.muted}}>
                {m === 'paste' ? '⌗  Paste List' : '+  Manual Entry'}
              </Mono>
            </Pressable>
          );
        })}
      </View>

      {/* ── Warning ── */}
      {calc.hasOdd && calc.validCount > 0 && (
        <View style={{backgroundColor: T.warningDim, borderRadius: 8, borderWidth: 1, borderColor: T.warningBorder, padding: 12}}>
          <Mono style={{fontSize: 12, color: T.warning, letterSpacing: 0.2}}>⚠  Odd punch count — last entry treated as open IN punch.</Mono>
        </View>
      )}

      {/* ── Paste Input ── */}
      {entryMode === 'paste' && (
        <View style={card}>
          <CardHeader label="PUNCH TIMELINE" />
          <TextInput
            style={{minHeight: 180, color: T.text, fontFamily: 'Courier New', fontSize: 14, lineHeight: 24, padding: 16, letterSpacing: 0.4, backgroundColor: T.inputBg}}
            value={text}
            onChangeText={v => setText(v.split('\n').filter(l => !/missing/i.test(l)).join('\n'))}
            multiline textAlignVertical="top"
            placeholder={'9:51:28 AM\n10:41:33 AM\n11:06:22 AM\n1:46:16 PM\n4:19:56 PM\n7:31:16 PM'}
            placeholderTextColor={T.muted}
            autoCorrect={false} autoCapitalize="none"
          />
        </View>
      )}

      {/* ── Manual Input ── */}
      {entryMode === 'manual' && (
        <View style={card}>
          <CardHeader label="MANUAL PUNCH ENTRY" />
          {manualTimes.map((val, i) => {
            const isIn = i % 2 === 0;
            const secs = parseTimeToSeconds(val);
            const valid = val.trim() !== '' && secs !== null;
            const invalid = val.trim() !== '' && secs === null;
            return (
              <View key={i} style={{flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 14, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: T.border}}>
                <Mono style={{fontSize: 10, color: T.muted, width: 18, textAlign: 'right'}}>{i + 1}</Mono>
                {/* IN / OUT badge */}
                <View style={{paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4, borderWidth: 1, backgroundColor: isIn ? T.accentDim : T.orangeDim, borderColor: isIn ? T.accentBorder : T.orangeBorder}}>
                  <Mono style={{fontSize: 9, fontWeight: '700', letterSpacing: 0.5, color: isIn ? T.accent : T.orange}}>{isIn ? 'IN' : 'OUT'}</Mono>
                </View>
                {/* Time input */}
                <TextInput
                  style={{flex: 1, backgroundColor: T.inputBg, borderWidth: 1, borderColor: valid ? T.accentBorder : invalid ? T.orangeBorder : T.border, borderRadius: 7, color: T.text, fontFamily: 'Courier New', fontSize: 13, paddingHorizontal: 10, paddingVertical: 8, letterSpacing: 0.3}}
                  value={val}
                  onChangeText={v => setManualTimes(prev => { const c = [...prev]; c[i] = v; return c; })}
                  placeholder="9:51 AM"
                  placeholderTextColor={T.muted}
                  autoCorrect={false} autoCapitalize="none"
                />
                {/* Pick button */}
                <Pressable
                  onPress={() => openPicker(i)}
                  style={({pressed}) => [{backgroundColor: pressed ? T.blueBorder : T.blueDim, borderWidth: 1, borderColor: T.blueBorder, borderRadius: 7, width: 36, height: 36, alignItems: 'center', justifyContent: 'center'}]}>
                  <Text style={{fontSize: 16}}>🕐</Text>
                </Pressable>
                {/* Remove button */}
                <Pressable
                  onPress={() => setManualTimes(prev => prev.length === 1 ? [''] : prev.filter((_, j) => j !== i))}
                  style={({pressed}) => [{width: 28, height: 28, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? T.orangeDim : 'transparent'}]}>
                  <Text style={{color: T.orange, fontSize: 20, fontWeight: '300', lineHeight: 22}}>×</Text>
                </Pressable>
              </View>
            );
          })}
          <Pressable
            onPress={() => setManualTimes(prev => [...prev, ''])}
            style={({pressed}) => [{margin: 14, borderWidth: 1, borderColor: T.accentBorder, borderStyle: 'dashed', borderRadius: 8, paddingVertical: 10, alignItems: 'center', backgroundColor: pressed ? T.accentDim : 'transparent'}]}>
            <Mono style={{fontSize: 13, fontWeight: '700', color: T.accent, letterSpacing: 0.5}}>+ Add Punch Time</Mono>
          </Pressable>
        </View>
      )}

      {/* ── DateTimePicker ── */}
      {pickerVisible && pickerIndex !== null && (
        <DateTimePicker value={pickerValue} mode="time" display="default" onChange={onPickerChange} />
      )}

      {/* ── Break Gap Selector ── */}
      {showGap && (
        <View style={card}>
          <CardHeader label="RETURN AFTER BREAK" />
          <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 14}}>
            {GAP_OPTIONS.map(m => {
              const active = rejoinGap === m;
              return (
                <Pressable
                  key={m}
                  onPress={() => setRejoinGap(m)}
                  style={{paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: active ? T.accentBorder : T.border, backgroundColor: active ? T.accentDim : T.inputBg}}>
                  <Mono style={{fontSize: 12, fontWeight: '700', color: active ? T.accent : T.muted}}>{m}m</Mono>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* ── Results Card ── */}
      <View style={card}>

        {/* Hero */}
        <View style={{padding: 22, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: T.border}}>
          <Mono style={{fontSize: 10, color: T.muted, letterSpacing: 2, marginBottom: 8}}>EFFECTIVE DURATION</Mono>
          <Mono style={{fontSize: 50, fontWeight: '700', letterSpacing: -1, lineHeight: 54, color: calc.total === 0 ? T.muted : T.accent}}>
            {formatHMS(calc.total)}
          </Mono>
          <View style={{marginTop: 10, alignSelf: 'flex-start', backgroundColor: T.accentDim, borderRadius: 5, borderWidth: 1, borderColor: T.accentBorder, paddingHorizontal: 12, paddingVertical: 4}}>
            <Mono style={{fontSize: 13, color: T.accent, fontWeight: '700'}}>{(calc.total / 3600).toFixed(2)} h</Mono>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={section}><ProgressBar pct={calc.pct} /></View>

        {/* Projection stats */}
        {calc.validCount > 0 && (
          <View style={{...section, flexDirection: 'row', flexWrap: 'wrap', gap: 16}}>
            {calc.remaining > 0 && calc.completionAt !== null ? (
              <>
                <StatBox label="REMAINING" value={formatHMS(calc.remaining)} color={T.orange} />
                <StatBox label="8H DONE AT" value={formatClock(calc.completionAt)} color={T.accent} />
                {calc.suggestedIn !== null && <StatBox label="PUNCH IN AT" value={formatClock(calc.suggestedIn)} color={T.blue} />}
                <StatBox label="STATUS" value={calc.hasOdd ? '● PUNCHED IN' : '○ ON BREAK'} color={calc.hasOdd ? T.accent : T.orange} />
              </>
            ) : calc.remaining === 0 ? (
              <StatBox label="STATUS" value="✓  8H COMPLETE" color={T.accent} />
            ) : null}
          </View>
        )}

        {/* Shift segments */}
        {calc.pairs.length > 0 && (
          <View style={section}>
            <Mono style={{fontSize: 10, color: T.muted, letterSpacing: 1.5, marginBottom: 12}}>SHIFT SEGMENTS</Mono>
            {calc.pairs.map((p, i) => (
              <SegmentRow key={i} inLabel={formatClock(p.inS)} outLabel={formatClock(p.outS)} inSecs={p.inS} outSecs={p.outS} dur={p.dur} minT={calc.minT} maxT={calc.maxT} />
            ))}
            {calc.hasOdd && calc.openInSecs !== null && (
              <SegmentRow
                key="open" inLabel={formatClock(calc.openInSecs)} outLabel="now…"
                inSecs={calc.openInSecs} outSecs={nowSecs}
                dur={Math.max(0, nowSecs - calc.openInSecs)}
                minT={calc.minT} maxT={Math.max(calc.maxT, nowSecs)} isOpen
              />
            )}
          </View>
        )}

        {/* Footer */}
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16}}>
          <Mono style={{fontSize: 11, color: T.muted}}>Valid entries: {calc.validCount}</Mono>
          <Pressable
            onPress={() => { setText(''); setManualTimes(['']); }}
            style={({pressed}) => [{borderWidth: 1, borderColor: T.orangeBorder, borderRadius: 6, paddingHorizontal: 16, paddingVertical: 7, backgroundColor: pressed ? T.orangeDim : 'transparent'}]}>
            <Mono style={{fontSize: 11, fontWeight: '700', color: T.orange, letterSpacing: 1}}>✕  CLEAR</Mono>
          </Pressable>
        </View>

      </View>
    </ScrollView>
  );
}