import { ThemedView } from '@/components/ThemedView';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { Colors } from '@/constants/Colors';
import { Linking, Platform, StyleSheet, Text, TouchableOpacity } from 'react-native';

interface Props {
  storeUrl: string;
}

export function UpdateRequiredScreen({ storeUrl }: Props) {
  const styles = useThemedStyles(makeStyles);

  const handleUpdate = () => {
    if (storeUrl) {
      Linking.openURL(storeUrl);
    }
  };

  const buttonLabel = Platform.OS === 'ios' ? 'Update on the App Store' : 'Update on Google Play';

  return (
    <ThemedView style={styles.container}>
      <Text style={styles.title}>Update Required</Text>
      <Text style={styles.body}>A new version of Yapify is required to continue.</Text>
      {storeUrl ? (
        <TouchableOpacity style={styles.button} onPress={handleUpdate} activeOpacity={0.8}>
          <Text style={styles.buttonText}>{buttonLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </ThemedView>
  );
}

function makeStyles(theme: typeof Colors.light | typeof Colors.dark) {
  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    title: {
      fontFamily: 'Lora-Bold',
      fontSize: 28,
      color: theme.text,
      textAlign: 'center',
      marginBottom: 12,
    },
    body: {
      fontSize: 16,
      color: theme.secondaryText,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 32,
    },
    button: {
      backgroundColor: theme.accent,
      paddingVertical: 14,
      paddingHorizontal: 28,
      borderRadius: 12,
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
  });
}
