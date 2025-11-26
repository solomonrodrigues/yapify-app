import ActionChip from '@/components/ActionChip';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { router } from 'expo-router';
import React from 'react';
import {
  StyleSheet,
  Text,
  useColorScheme,
  View
} from 'react-native';
import Onboarding from 'react-native-onboarding-swiper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function OnboardingScreen() {
  const styles = useThemedStyles(getStyles);
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  const FinishButton = ({ ...props }) => (
  <View style={{ marginRight: 10 }}>
    <ActionChip
      label={'Finish'}
      color={theme.text}
      icon={'checkmark'}
      onPress={() => router.back()}
      />
      </View>
    );

    
    return (
      <ThemedView style={{paddingBottom: insets.bottom}}>    
      <Onboarding
        skipToPage={3}
        containerStyles={styles.container}
        DoneButtonComponent={FinishButton}
        pages={[
        {
          backgroundColor: theme.cardBackground,
          image: (
            <View>
              <Text>👁️</Text>
            </View>
          ),
          title: 'Welcome to Yapify',
          subtitle: 'Where the things your friends say can never be unsaid.',
          titleStyles: styles.titleStyles,
          
        },
        {
          backgroundColor: theme.cardBackground,
          image: (
            <View>
              <Text>🪦</Text>
            </View>
          ),
          title: 'Immortalise Their Crimes',
          subtitle: 'Screenshot energy, but worse. Every cursed quote lives here forever.',
          titleStyles: styles.titleStyles,
        },
        {
          backgroundColor: theme.cardBackground,
          image: (
            <View>
              <Text>🍖</Text>
            </View>
          ),
          title: 'Cause Chaos',
          subtitle: 'Inside jokes, out-of-pocket statements, and verbal war crimes — all welcome.',
          titleStyles: styles.titleStyles,
        },
        {
          backgroundColor: theme.cardBackground,
          image: (
            <View>
              <Text>🔪</Text>
            </View>
          ),
          title: 'Unleash the Yaps',
          subtitle: 'Begin collecting the quotes your friends will deny saying.',
          titleStyles: styles.titleStyles,
        },
        ]}
      />
  </ThemedView>
  );
}

export const getStyles = (theme: typeof Colors.light | typeof Colors.dark) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    feedContainer: {
      paddingBottom: 48,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: theme.background,
    },
    titleStyles: {
      color: theme.text,
    }
  }
);
