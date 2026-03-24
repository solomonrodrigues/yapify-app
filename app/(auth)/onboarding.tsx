import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { markOnboardingComplete } from '@/lib/utils/storage';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import {
  Pressable,
  type PressableProps,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import Onboarding from 'react-native-onboarding-swiper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

// Each page has a unique accent color from the app's pastel palette
const PAGES = [
  {
    emoji: '👋',
    title: 'Your friends talk too much',
    subtitle: 'Now there\'s receipts. Yapify is where the wildest things your friends say live forever.',
    accentColor: '#5395ec', // blue
    animation: 'wave' as const,
  },
  {
    emoji: '✍️',
    title: 'Quote them before they deny it',
    subtitle: 'Heard something unhinged? Post it. Tag who said it. Watch them try to explain.',
    accentColor: '#f35fc4', // pink
    animation: 'write' as const,
  },
  {
    emoji: '🎯',
    title: 'Guess who said that',
    subtitle: 'Think you know your friends? YapGuess puts that to the test. Spoiler: you probably don\'t.',
    accentColor: '#2db5a0', // teal
    animation: 'pulse' as const,
  },
  {
    emoji: '🔓',
    title: 'Every group has a Yapify moment',
    subtitle: 'The quote that made everyone lose it. The one nobody can forget. Start collecting yours.',
    accentColor: '#fba617', // yellow
    animation: 'unlock' as const,
  },
];

type AnimationType = typeof PAGES[number]['animation'];

// --- Unique animated emoji per page ---

function WaveEmoji({ emoji }: { emoji: string }) {
  const scale = useSharedValue(0.2);
  const rotate = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 8, stiffness: 100 });
    rotate.value = withDelay(
      500,
      withRepeat(
        withSequence(
          withTiming(20, { duration: 300, easing: Easing.inOut(Easing.ease) }),
          withTiming(-15, { duration: 250, easing: Easing.inOut(Easing.ease) }),
          withTiming(12, { duration: 200, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 400, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: 1200 }), // pause between waves
        ),
        -1,
        false,
      ),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transformOrigin: 'bottom right',
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <Animated.View style={style}>
      <Text style={{ fontSize: 90 }}>{emoji}</Text>
    </Animated.View>
  );
}

function WriteEmoji({ emoji }: { emoji: string }) {
  const scale = useSharedValue(0.2);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 8, stiffness: 100 });
    // Scribble motion: slight horizontal movement + tilt
    rotate.value = withDelay(
      500,
      withRepeat(
        withSequence(
          withTiming(-8, { duration: 200, easing: Easing.inOut(Easing.ease) }),
          withTiming(5, { duration: 200, easing: Easing.inOut(Easing.ease) }),
          withTiming(-3, { duration: 150, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: 1400 }),
        ),
        -1,
        false,
      ),
    );
    translateX.value = withDelay(
      500,
      withRepeat(
        withSequence(
          withTiming(6, { duration: 200, easing: Easing.inOut(Easing.ease) }),
          withTiming(-4, { duration: 200, easing: Easing.inOut(Easing.ease) }),
          withTiming(8, { duration: 200, easing: Easing.inOut(Easing.ease) }),
          withTiming(-2, { duration: 150, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: 1200 }),
        ),
        -1,
        false,
      ),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <Animated.View style={style}>
      <Text style={{ fontSize: 90 }}>{emoji}</Text>
    </Animated.View>
  );
}

function PulseEmoji({ emoji }: { emoji: string }) {
  const scale = useSharedValue(0.2);

  useEffect(() => {
    // Zoom-in landing, then seamless pulse loop (starts and ends at 1)
    scale.value = withSequence(
      withSpring(1, { damping: 6, stiffness: 140 }),
      withDelay(
        300,
        withRepeat(
          withSequence(
            withTiming(1.12, { duration: 600, easing: Easing.out(Easing.ease) }),
            withTiming(0.95, { duration: 500, easing: Easing.inOut(Easing.ease) }),
            withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) }),
            withTiming(1, { duration: 1000 }),
          ),
          -1,
          false,
        ),
      ),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={style}>
      <Text style={{ fontSize: 90 }}>{emoji}</Text>
    </Animated.View>
  );
}

function UnlockEmoji({ emoji }: { emoji: string }) {
  const scale = useSharedValue(0.2);
  const rotate = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 8, stiffness: 100 });
    // Quick shake then settle with a small bounce up
    rotate.value = withDelay(
      500,
      withRepeat(
        withSequence(
          withTiming(-12, { duration: 80 }),
          withTiming(12, { duration: 80 }),
          withTiming(-8, { duration: 70 }),
          withTiming(8, { duration: 70 }),
          withTiming(-4, { duration: 60 }),
          withTiming(0, { duration: 100, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: 2000 }),
        ),
        -1,
        false,
      ),
    );
    translateY.value = withDelay(
      960, // after shake finishes
      withRepeat(
        withSequence(
          withSpring(-8, { damping: 6, stiffness: 200 }),
          withSpring(0, { damping: 8, stiffness: 120 }),
          withTiming(0, { duration: 2000 }),
        ),
        -1,
        false,
      ),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
      { translateY: translateY.value },
    ],
  }));

  return (
    <Animated.View style={style}>
      <Text style={{ fontSize: 90 }}>{emoji}</Text>
    </Animated.View>
  );
}

function AnimatedEmoji({ emoji, animation }: { emoji: string; animation: AnimationType }) {
  switch (animation) {
    case 'wave':
      return <WaveEmoji emoji={emoji} />;
    case 'write':
      return <WriteEmoji emoji={emoji} />;
    case 'pulse':
      return <PulseEmoji emoji={emoji} />;
    case 'unlock':
      return <UnlockEmoji emoji={emoji} />;
  }
}

export default function OnboardingScreen() {
  const styles = useThemedStyles(getStyles);
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  const handleFinish = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await markOnboardingComplete();
    router.replace('/(auth)');
  };

  const DoneButton = () => (
    <Pressable
      onPress={handleFinish}
      style={({ pressed }) => [
        styles.doneButton,
        { backgroundColor: theme.accent, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <Text style={styles.doneButtonText}>Get Started</Text>
    </Pressable>
  );

  const NextButton = ({ ...props }: PressableProps) => (
    <Pressable
      {...props}
      style={({ pressed }) => [
        styles.nextButton,
        { opacity: pressed ? 0.6 : 1 },
      ]}
    >
      <Text style={[styles.nextButtonText, { color: theme.accent }]}>Next</Text>
    </Pressable>
  );

  const SkipButton = () => (
    <Pressable
      onPress={handleFinish}
      style={({ pressed }) => [
        styles.skipButton,
        { opacity: pressed ? 0.6 : 1 },
      ]}
    >
      <Text style={[styles.skipButtonText, { color: theme.secondaryText }]}>Skip</Text>
    </Pressable>
  );

  const Dots = ({ selected }: { selected: boolean }) => (
    <View
      style={[
        styles.dot,
        {
          backgroundColor: selected ? theme.accent : theme.border,
          width: selected ? 24 : 8,
        },
      ]}
    />
  );

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Onboarding
        containerStyles={styles.onboardingContainer}
        imageContainerStyles={styles.imageContainer}
        titleStyles={styles.title}
        subTitleStyles={styles.subtitle}
        bottomBarHeight={80}
        bottomBarColor={'transparent'}
        DoneButtonComponent={DoneButton}
        NextButtonComponent={NextButton}
        SkipButtonComponent={SkipButton}
        DotComponent={Dots}
        pages={PAGES.map((page) => ({
          backgroundColor: theme.background,
          image: (
            <View style={[
              styles.emojiContainer,
              { boxShadow: `0 0 24px ${page.accentColor}30, 0 2px 12px rgba(0, 0, 0, 0.15)` },
            ]}>
              <AnimatedEmoji emoji={page.emoji} animation={page.animation} />
            </View>
          ),
          title: page.title,
          subtitle: page.subtitle,
        }))}
      />
    </View>
  );
}

const getStyles = (theme: typeof Colors.light | typeof Colors.dark) => ({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  } as const,
  onboardingContainer: {
    paddingHorizontal: Spacing.lg,
  },
  imageContainer: {
    paddingBottom: Spacing.sm,
  },
  emojiContainer: {
    width: 160,
    height: 160,
    borderRadius: 28,
    borderCurve: 'continuous' as const,
    backgroundColor: theme.cardBackground,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15)',
  },
  title: {
    fontFamily: 'Lora',
    fontSize: 28,
    fontWeight: '700' as const,
    color: theme.text,
    letterSpacing: -0.3,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.lg,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 23,
    color: theme.secondaryText,
    fontWeight: '400' as const,
    paddingHorizontal: Spacing.xl,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 3,
  },
  doneButton: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 24,
    marginRight: Spacing.md,
  } as const,
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  nextButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginRight: Spacing.sm,
  } as const,
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginLeft: Spacing.sm,
  } as const,
  skipButtonText: {
    fontSize: 16,
    fontWeight: '500' as const,
  },
});
