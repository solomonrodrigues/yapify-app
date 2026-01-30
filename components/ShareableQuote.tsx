import { ProfileColorHexMap } from '@/constants/Colors';
import { getInitials } from '@/lib/utils/user';
import { MinimalUser, ProfileColorEnum, Quote } from '@/types/api';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import ViewShot from 'react-native-view-shot';

interface ShareableQuoteProps {
  quote: Quote;
  onCapture?: () => void;
}

const AVATAR_SIZE = 36;

function Avatar({ user }: { user: MinimalUser }) {
  const bg = ProfileColorHexMap[user.profile_color as ProfileColorEnum] ?? '#9E9E9E';
  return (
    <View style={[styles.avatar, { backgroundColor: bg }]}>
      <Text style={styles.avatarText}>{getInitials(user)}</Text>
    </View>
  );
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

    const quotedName = quote.quoted_user?.display_name || quote.quoted_name || 'Unknown';
    const posterName = quote.author?.display_name || 'Someone';
    const profileColor = ProfileColorHexMap[quote.quoted_user?.profile_color as ProfileColorEnum] ?? '#9E9E9E';

    return (
      <View style={styles.offscreen} collapsable={false}>
        <ViewShot
          ref={viewShotRef}
          options={{ format: 'png', quality: 1, result: 'tmpfile' }}
        >
          {/* Outer coloured background */}
          <View style={[styles.outer, { backgroundColor: darken(profileColor, 0.45) }]}>
            {/* Inner frosted card */}
            <View style={styles.card}>
              {/* Quote text */}
              <Text style={styles.quoteText}>{quote.text}</Text>

              {/* Attribution */}
              <View style={styles.attribution}>
                {quote.quoted_user && <Avatar user={quote.quoted_user} />}
                <View>
                  <Text style={styles.quotedName}>{quotedName}</Text>
                  <Text style={styles.postedByText}>posted by {posterName}</Text>
                </View>
              </View>
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
    borderRadius: 16,
    padding: 28,
  },
  quoteText: {
    fontSize: 20,
    lineHeight: 30,
    color: '#fff',
    fontWeight: '500',
    letterSpacing: 0.2,
    marginBottom: 24,
  },
  attribution: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontFamily: 'Sansation',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: AVATAR_SIZE * 0.45,
  },
  quotedName: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
  postedByText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
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
