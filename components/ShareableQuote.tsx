import { Colors, ProfileColorHexMap } from '@/constants/Colors';
import { getPastelFromId } from '@/lib/utils/style';
import { ProfileColorEnum, Quote } from '@/types/api';
import * as Sharing from 'expo-sharing';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import ViewShot from 'react-native-view-shot';

interface ShareableQuoteProps {
  quote: Quote;
  guessable?: boolean;
  onCapture?: () => void;
}

/** Darken a hex colour by mixing it toward black. amt 0-1. */
function darken(hex: string, amt: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const f = 1 - amt;
  return `rgb(${Math.round(r * f)}, ${Math.round(g * f)}, ${Math.round(b * f)})`;
}

/**
 * Hidden component that renders a styled quote card and captures it as an image for sharing.
 * Call the `share()` method via ref to trigger capture + share.
 */
// Use dark theme for pastel colors in shareable images
const SHARE_THEME = Colors.dark;

const ShareableQuoteInner: React.ForwardRefRenderFunction<{ share: () => Promise<void> }, ShareableQuoteProps> = ({ quote, guessable, onCapture }, ref) => {
    const viewShotRef = useRef<ViewShot>(null);

    const share = useCallback(async () => {
      try {
        const uri = await viewShotRef.current?.capture?.();
        if (!uri) {
          Toast.show({ type: 'error', text1: 'Failed to generate image' });
          return;
        }
        onCapture?.();
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          UTI: 'public.png',
        });
      } catch (error) {
        console.error('Failed to share quote:', error);
        Toast.show({ type: 'error', text1: 'Failed to share quote' });
      }
    }, [onCapture]);

    React.useImperativeHandle(ref, () => ({ share }));

    const quotedName = guessable ? '???' : (quote.quoted_user?.display_name || quote.quoted_name || 'Unknown');
    const posterName = guessable ? '???' : (quote.author?.display_name || 'Someone');
    const profileColor = guessable ? '#9E9E9E' : (ProfileColorHexMap[quote.quoted_user?.profile_color as ProfileColorEnum] ?? '#9E9E9E');
    const pastel = getPastelFromId(quote.id, SHARE_THEME);
    const gradientColors: [string, string] = [pastel, profileColor];

    return (
      <View style={styles.offscreen} collapsable={false}>
        <ViewShot
          ref={viewShotRef}
          options={{ format: 'png', quality: 1, result: 'tmpfile' }}
        >
          {/* Outer coloured background */}
          <View style={[styles.outer, { backgroundColor: darken(profileColor, 0.45) }]}>
            {/* Card — mirrors FeedQuote structure */}
            <View style={styles.card}>
              {/* Gradient left strip */}
              <View style={styles.gradientStrip}>
                <LinearGradient
                  colors={gradientColors}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              </View>

              {/* Header: "X quoted Y" */}
              <View style={styles.header}>
                <Text style={styles.authorName}>{posterName}</Text>
                <Text style={styles.headerText}> quoted </Text>
                <Text style={styles.quotedName}>{quotedName}</Text>
              </View>

              {/* Context — hidden when guessable to avoid leaking clues */}
              {quote.context && !guessable ? (
                <Text style={[styles.contextText, { color: pastel }]}>{quote.context}</Text>
              ) : null}

              {/* Quote text */}
              <Text style={styles.quoteText}>&ldquo;{quote.text}&rdquo;</Text>
            </View>

            {/* Branding */}
            <Text style={styles.brandText}>yapify</Text>
          </View>
        </ViewShot>
      </View>
    );
};

export const ShareableQuote = React.forwardRef(ShareableQuoteInner);

const styles = StyleSheet.create({
  offscreen: {
    position: 'absolute',
    left: -500,
    top: 0,
  },
  outer: {
    width: 400,
    minHeight: 320,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  card: {
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    overflow: 'hidden',
  },
  gradientStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  authorName: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.5)',
  },
  headerText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  quotedName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  contextText: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  quoteText: {
    fontSize: 22,
    lineHeight: 32,
    color: '#fff',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  brandText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
    fontWeight: '700',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginTop: 16,
  },
});
