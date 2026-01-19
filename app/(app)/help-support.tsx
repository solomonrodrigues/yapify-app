// app/(app)/help-support.tsx
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol, IconSymbolName } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextStyle,
  useColorScheme,
  View,
} from 'react-native';

type FAQItem = {
  question: string;
  answer: string;
};

type LinkItem = {
  title: string;
  icon: IconSymbolName;
  onPress: () => void;
};

const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'How do I post a quote?',
    answer: 'Tap the + button in the bottom navigation bar to create a new quote. Enter the quote text and tag the person who said it.',
  },
  {
    question: 'What is quote visibility?',
    answer: 'Quote visibility controls who can see quotes you are tagged in. You can set this to "Mutual Friends Only" or "Friends of Friends" in Privacy & Security settings.',
  },
  {
    question: 'How do I block someone?',
    answer: 'Visit their profile, tap the menu icon (three dots), and select "Block". You can manage blocked users in Privacy & Security settings.',
  },
  {
    question: 'Can I delete a quote I posted?',
    answer: 'Yes, tap on the quote to open it, then tap the menu icon and select "Delete". You can only delete quotes you posted.',
  },
  {
    question: 'How do witnesses work?',
    answer: 'When you witness a quote, you confirm that you heard the person say it. This adds credibility to the quote.',
  },
];

export default function HelpSupportScreen() {
  const styles = useThemedStyles(getStyles);
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@yapify.net?subject=Yapify Support Request');
  };

  const handlePrivacyPolicy = () => {
    Linking.openURL('https://yapify.net/privacy');
  };

  const handleTermsOfService = () => {
    Linking.openURL('https://yapify.net/terms');
  };

  const linkItems: LinkItem[] = [
    {
      title: 'Contact Support',
      icon: 'envelope',
      onPress: handleContactSupport,
    },
    {
      title: 'Privacy Policy',
      icon: 'doc.text',
      onPress: handlePrivacyPolicy,
    },
    {
      title: 'Terms of Service',
      icon: 'doc.plaintext',
      onPress: handleTermsOfService,
    },
  ];

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* FAQ Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="questionmark.circle" size={20} color={theme.text} />
            <ThemedText style={styles.sectionTitle}>
              Frequently Asked Questions
            </ThemedText>
          </View>

          <View style={styles.faqContainer}>
            {FAQ_ITEMS.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.faqItem,
                  index < FAQ_ITEMS.length - 1 && styles.faqItemBorder,
                ]}
              >
                <ThemedText style={styles.faqQuestion}>{item.question}</ThemedText>
                <ThemedText style={styles.faqAnswer}>{item.answer}</ThemedText>
              </View>
            ))}
          </View>
        </View>

        {/* Links Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="link" size={20} color={theme.text} />
            <ThemedText style={styles.sectionTitle}>Resources</ThemedText>
          </View>

          <View style={styles.linksContainer}>
            {linkItems.map((item, index) => (
              <Pressable
                key={item.title}
                style={({ pressed }) => [
                  styles.linkItem,
                  pressed && styles.linkItemPressed,
                  index < linkItems.length - 1 && styles.linkItemBorder,
                ]}
                onPress={item.onPress}
              >
                <View style={styles.linkContent}>
                  <IconSymbol name={item.icon} size={20} color={theme.text} />
                  <ThemedText style={styles.linkText}>{item.title}</ThemedText>
                </View>
                <IconSymbol
                  name="chevron.right"
                  size={16}
                  color={theme.secondaryText}
                />
              </Pressable>
            ))}
          </View>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <ThemedText style={styles.appName}>Yapify</ThemedText>
          <ThemedText style={styles.appVersion}>Version {appVersion}</ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const getStyles = (theme: typeof Colors.light | typeof Colors.dark) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 40,
    },
    section: {
      marginBottom: 28,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      gap: 8,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600' as TextStyle['fontWeight'],
      color: theme.text,
    },
    faqContainer: {
      backgroundColor: theme.cardBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.divider,
      overflow: 'hidden',
    },
    faqItem: {
      padding: 16,
    },
    faqItemBorder: {
      borderBottomWidth: 1,
      borderBottomColor: theme.divider,
    },
    faqQuestion: {
      fontSize: 15,
      fontWeight: '600' as TextStyle['fontWeight'],
      color: theme.text,
      marginBottom: 6,
    },
    faqAnswer: {
      fontSize: 14,
      color: theme.secondaryText,
      lineHeight: 20,
    },
    linksContainer: {
      backgroundColor: theme.cardBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.divider,
      overflow: 'hidden',
    },
    linkItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
    },
    linkItemPressed: {
      opacity: 0.7,
    },
    linkItemBorder: {
      borderBottomWidth: 1,
      borderBottomColor: theme.divider,
    },
    linkContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    linkText: {
      fontSize: 16,
      color: theme.text,
    },
    appInfo: {
      alignItems: 'center',
      paddingVertical: 20,
    },
    appName: {
      fontSize: 16,
      fontWeight: '600' as TextStyle['fontWeight'],
      color: theme.text,
    },
    appVersion: {
      fontSize: 14,
      color: theme.secondaryText,
      marginTop: 4,
    },
  });
