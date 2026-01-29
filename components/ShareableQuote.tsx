import { Quote } from '@/types/api';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import ViewShot from 'react-native-view-shot';

interface ShareableQuoteProps {
  quote: Quote;
  onCapture?: () => void;
}

/**
 * Hidden component that renders a styled quote card and captures it as an image for sharing.
 * Call the `share()` method via ref to trigger capture + share.
 */
const ShareableQuoteInner: React.ForwardRefRenderFunction<{ share: () => Promise<void> }, ShareableQuoteProps> = ({ quote, onCapture }, ref) => {
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

    const authorName = quote.quoted_user?.display_name || quote.quoted_name || 'Unknown';
    const posterName = quote.author?.display_name || 'Someone';

    return (
      <View style={styles.offscreen} collapsable={false}>
        <ViewShot
          ref={viewShotRef}
          options={{ format: 'png', quality: 1, result: 'tmpfile' }}
        >
          <View style={styles.card}>
            {/* Background gradient effect using overlapping views */}
            <View style={styles.gradientTop} />
            <View style={styles.gradientBottom} />

            {/* Content */}
            <View style={styles.content}>
              {/* Open quote mark */}
              <Text style={styles.quoteMark}>&ldquo;</Text>

              {/* Quote text */}
              <Text style={styles.quoteText}>{quote.text}</Text>

              {/* Close quote mark */}
              <Text style={[styles.quoteMark, styles.quoteMarkClose]}>&rdquo;</Text>

              {/* Attribution */}
              <View style={styles.attribution}>
                <Text style={styles.attributionText}>
                  &mdash; {authorName}
                </Text>
                <Text style={styles.postedBy}>
                  posted by {posterName}
                </Text>
              </View>
            </View>

            {/* Branding */}
            <View style={styles.branding}>
              <Text style={styles.brandText}>yapify</Text>
            </View>
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
  card: {
    width: 400,
    minHeight: 300,
    backgroundColor: '#0e1113',
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'rgba(161, 53, 210, 0.15)',
  },
  gradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'rgba(161, 53, 210, 0.08)',
  },
  content: {
    padding: 32,
    paddingBottom: 16,
  },
  quoteMark: {
    fontSize: 48,
    color: '#a135d2',
    fontWeight: '700',
    lineHeight: 48,
    marginBottom: -8,
  },
  quoteMarkClose: {
    textAlign: 'right',
    marginTop: -8,
    marginBottom: 16,
  },
  quoteText: {
    fontSize: 22,
    lineHeight: 32,
    color: '#ECEDEE',
    fontWeight: '300',
    letterSpacing: 0.3,
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  attribution: {
    marginTop: 8,
    paddingLeft: 8,
  },
  attributionText: {
    fontSize: 16,
    color: '#ECEDEE',
    fontWeight: '600',
  },
  postedBy: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  branding: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignItems: 'flex-end',
  },
  brandText: {
    fontSize: 14,
    color: 'rgba(161, 53, 210, 0.6)',
    fontWeight: '700',
    letterSpacing: 2,
  },
});
