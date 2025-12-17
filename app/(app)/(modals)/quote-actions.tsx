import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { hideQuote, saveQuote } from '@/lib/api/quotes';

type Params = {
  quoteId?: string;
  text?: string;
  authorId?: string;
  authorUsername?: string;
  quotedUserId?: string;
  quotedUsername?: string;
  guessable?: string; // '1' or '0'
};

const QuoteActionsModal = () => {
  const params = useLocalSearchParams<Params>();
  const router = useRouter();

  const {
    quoteId,
    text,
    authorId,
    authorUsername,
    quotedUserId,
    quotedUsername,
    guessable,
  } = params;

  const isGuessable = guessable === '1';
  const showAuthor = !!authorId && !isGuessable;
  const showQuotedUser = !!quotedUserId && !isGuessable;

  const close = () => {
    router.back();
  };

  const goToProfile = (userId: string | undefined) => {
    if (!userId) return;
    // Close the modal, then navigate
    router.dismiss(); // closes this modal screen
    router.push({
      pathname: '/user/[userID]',
      params: { userID: userId },
    });
  };

  const handleCopy = async () => {
    if (text) {
      await Clipboard.setStringAsync(text);
      Toast.show({
        type: 'success',
        text1: 'Copied. Try not to misuse this power.'
      });
    }
    close();
  };

  const handleSave = () => {
    if (quoteId) {
      saveQuote(parseInt(quoteId))
      Toast.show({
        type: 'info',
        text1: 'Saved. For future contemplation.'
      });
    }
    close();
  };

  const handleHide = () => {
    if (quoteId) {
      hideQuote(parseInt(quoteId))
      Toast.show({
        type: 'info',
        text1: 'Hidden. Nothing to see here.'
      });
    }
    // ToDo: Update quote UI to hide immediately the user requests it to be hidden. Display a way to immediately unhide aswell.
    close();
  };

  return (
    <View style={styles.overlay}>
      {/* Dismiss on tap outside */}
      <TouchableWithoutFeedback onPress={close}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      {/* Bottom sheet */}
      <View style={styles.sheet}>
        <View style={styles.handle} />

        <Text style={styles.title}>Quote Actions</Text>

        {/* Actions list */}
        <TouchableOpacity style={styles.item} onPress={handleSave}>
          <IconSymbol
            name={'bookmark'}
            size={styles.itemText.fontSize}
            color={styles.itemText.color}
            style={{ marginRight: 6 }}
          />
          <Text style={styles.itemText}>Save</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.item} onPress={handleCopy}>
          <IconSymbol
            name={'doc.on.doc'}
            size={styles.itemText.fontSize}
            color={styles.itemText.color}
            style={{ marginRight: 6 }}
          />
          <Text style={styles.itemText}>Copy text</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.item} onPress={handleHide}>
          <IconSymbol
            name={'eye.slash'}
            size={styles.itemText.fontSize}
            color={styles.destructive.color}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.itemText, styles.destructive]}>Hide this quote</Text>
        </TouchableOpacity>

        {(showAuthor || showQuotedUser) && (
          <View style={styles.separator} />
        )}

        {showAuthor && (
          <TouchableOpacity
            style={styles.item}
            onPress={() => goToProfile(authorId)}
          >
            <Text style={styles.itemText}>View {authorUsername} (poster)</Text>
          </TouchableOpacity>
        )}

        {(showAuthor && showQuotedUser) && (
          <View style={styles.separator} />
        )}

        {showQuotedUser && (
          <TouchableOpacity
            style={styles.item}
            onPress={() => goToProfile(quotedUserId)}
          >
            <Text style={styles.itemText}>View {quotedUsername} (speaker)</Text>
          </TouchableOpacity>
        )}

        {(showAuthor || showQuotedUser) && (
          <View style={styles.separator} />
        )}
      </View>
    </View>
  );
};

export default QuoteActionsModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: '#101113',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  item: {
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemText: {
    fontSize: 16,
    color: '#fff',
  },
  destructive: {
    color: '#ff4d4d',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 8,
    marginHorizontal: -20,
  },
});
