import { Colors } from '@/constants/Colors';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import { Platform, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeInDown,
  FadeOutUp,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ── Types ──────────────────────────────────────────────────────────────────

type ToastVariant = 'default' | 'accent' | 'success' | 'warning' | 'danger';

export interface ToastShowConfig {
  id?: string;
  variant?: ToastVariant;
  label?: string;
  description?: string;
  actionLabel?: string;
  onActionPress?: (args: {
    hide: () => void;
    show: (opts: string | ToastShowConfig) => string;
  }) => void;
  duration?: number | 'persistent';
}

interface ToastItem {
  id: string;
  variant: ToastVariant;
  label?: string;
  description?: string;
  actionLabel?: string;
  onActionPress?: ToastShowConfig['onActionPress'];
}

interface ToastContextValue {
  toast: {
    show: (options: string | ToastShowConfig) => string;
    hide: (ids?: string | string[] | 'all') => void;
  };
  isToastVisible: boolean;
}

// ── Reducer ────────────────────────────────────────────────────────────────

type Action =
  | { type: 'SHOW'; payload: ToastItem }
  | { type: 'HIDE'; payload: { ids: string[] } }
  | { type: 'HIDE_ALL' };

function reducer(state: ToastItem[], action: Action): ToastItem[] {
  switch (action.type) {
    case 'SHOW': return [...state, action.payload];
    case 'HIDE': return state.filter(t => !action.payload.ids.includes(t.id));
    case 'HIDE_ALL': return [];
    default: return state;
  }
}

const DEFAULT_DURATION = 3500;
const MAX_VISIBLE = 2;

// ── Toast card ─────────────────────────────────────────────────────────────

function ToastCard({
  item,
  onHide,
  onShow,
}: {
  item: ToastItem;
  onHide: (id: string) => void;
  onShow: (opts: string | ToastShowConfig) => string;
}) {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const translateY = useSharedValue(0);

  const hide = useCallback(() => onHide(item.id), [item.id, onHide]);

  const pan = useMemo(() =>
    Gesture.Pan()
      .onChange(e => {
        // Allow dragging up freely, rubber-band downward drags
        if (e.translationY < 0) {
          translateY.set(e.translationY);
        } else {
          translateY.set(e.translationY * 0.15);
        }
      })
      .onFinalize(e => {
        if (e.translationY < -40 || e.velocityY < -600) {
          runOnJS(hide)();
        } else {
          translateY.set(withSpring(0, { damping: 20, stiffness: 300 }));
        }
      }),
  [hide]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const accentColor = useMemo(() => {
    switch (item.variant) {
      case 'success': return '#32D74B';
      case 'warning': return '#FF9F0A';
      case 'danger':  return theme.destructive;
      case 'accent':  return theme.accent;
      default:        return theme.secondaryText;
    }
  }, [item.variant, theme]);

  const handleAction = useCallback(() => {
    item.onActionPress?.({ hide: () => onHide(item.id), show: onShow });
  }, [item, onHide, onShow]);

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        entering={FadeInDown.springify().mass(0.7).damping(14)}
        exiting={FadeOutUp.duration(180)}
        style={[
          styles.card,
          { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' },
          animStyle,
        ]}
      >
        <View style={styles.strip} pointerEvents="none">
          <View style={[styles.stripBar, { backgroundColor: accentColor }]} />
        </View>
        <View style={styles.body}>
          <View style={styles.textBlock}>
            {item.label ? (
              <Text style={[styles.label, { color: theme.text }]} numberOfLines={2}>
                {item.label}
              </Text>
            ) : null}
            {item.description ? (
              <Text style={[styles.description, { color: theme.secondaryText }]} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}
          </View>
          {item.actionLabel ? (
            <Text
              onPress={handleAction}
              style={[styles.action, { color: theme.accent }]}
            >
              {item.actionLabel}
            </Text>
          ) : null}
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  strip: {
    width: 4,
  },
  stripBar: {
    flex: 1,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 19,
  },
  description: {
    fontSize: 13,
    lineHeight: 17,
  },
  action: {
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 0,
  },
});

// ── Context ────────────────────────────────────────────────────────────────

const ToastCtx = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return { toast: ctx.toast, isToastVisible: ctx.isToastVisible };
}

// ── Provider ───────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, dispatch] = useReducer(reducer, []);
  const toastsRef = useRef<ToastItem[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const hideRef = useRef<ToastContextValue['toast']['hide'] | null>(null);
  const idCounter = useRef(0);
  const insets = useSafeAreaInsets();

  useEffect(() => { toastsRef.current = toasts; }, [toasts]);

  const hide = useCallback<ToastContextValue['toast']['hide']>((ids) => {
    if (ids === 'all') {
      timers.current.forEach(clearTimeout);
      timers.current.clear();
      dispatch({ type: 'HIDE_ALL' });
      return;
    }
    const current = toastsRef.current;
    const arr = ids === undefined
      ? current.length > 0 ? [current[current.length - 1].id] : []
      : Array.isArray(ids) ? ids : [ids];

    arr.forEach(id => {
      const t = timers.current.get(id);
      if (t) { clearTimeout(t); timers.current.delete(id); }
    });
    if (arr.length > 0) dispatch({ type: 'HIDE', payload: { ids: arr } });
  }, []);

  hideRef.current = hide;

  const show = useCallback<ToastContextValue['toast']['show']>((options) => {
    const config: ToastShowConfig = typeof options === 'string' ? { label: options } : options;
    const id = config.id ?? `t-${Date.now()}-${idCounter.current++}`;
    const duration = config.duration ?? DEFAULT_DURATION;

    // Trim to MAX_VISIBLE — drop the oldest if needed
    const current = toastsRef.current;
    if (current.length >= MAX_VISIBLE) {
      const oldest = current[0];
      const t = timers.current.get(oldest.id);
      if (t) { clearTimeout(t); timers.current.delete(oldest.id); }
      dispatch({ type: 'HIDE', payload: { ids: [oldest.id] } });
    }

    dispatch({
      type: 'SHOW',
      payload: {
        id,
        variant: config.variant ?? 'default',
        label: config.label,
        description: config.description,
        actionLabel: config.actionLabel,
        onActionPress: config.onActionPress,
      },
    });

    if (duration !== 'persistent' && typeof duration === 'number' && duration > 0) {
      const timer = setTimeout(() => {
        hideRef.current?.(id);
        timers.current.delete(id);
      }, duration);
      timers.current.set(id, timer);
    }

    return id;
  }, []);

  const ctx = useMemo<ToastContextValue>(() => ({
    toast: { show, hide },
    isToastVisible: toasts.length > 0,
  }), [show, hide, toasts.length]);

  const hideById = useCallback((id: string) => hide(id), [hide]);

  const visible = toasts.slice(-MAX_VISIBLE);

  return (
    <ToastCtx.Provider value={ctx}>
      {children}
      {visible.length > 0 && (
        <View
          pointerEvents="box-none"
          style={[
            StyleSheet.absoluteFillObject,
            {
              justifyContent: 'flex-start',
              paddingTop: insets.top + 44 + 8,
              paddingHorizontal: 12,
              gap: 8,
            },
          ]}
        >
          {visible.map(item => (
            <ToastCard
              key={item.id}
              item={item}
              onHide={hideById}
              onShow={show}
            />
          ))}
        </View>
      )}
    </ToastCtx.Provider>
  );
}
