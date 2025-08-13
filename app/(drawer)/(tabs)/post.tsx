import { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function AddPostScreen() {
  const [quote, setQuote] = useState('');
  const [author, setAuthor] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!quote.trim()) {
      Alert.alert('Error', 'Please enter a quote');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert('Success', 'Quote posted successfully!', [
        {
          text: 'OK',
          onPress: () => {
            setQuote('');
            setAuthor('');
          }
        }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to post quote. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearForm = () => {
    setQuote('');
    setAuthor('');
  };

  const characterLimit = 280;
  const remainingChars = characterLimit - quote.length;

  return (
    <ThemedView>
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <ThemedText type="title" style={styles.headerTitle}>Share a Quote</ThemedText>
            <ThemedText style={styles.headerSubtitle}>
              Inspire others with your favorite quotes
            </ThemedText>
          </View>

          {/* Quote Input */}
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.label}>Quote *</ThemedText>
            <TextInput
              style={[
                styles.textInput, 
                styles.quoteInput,
                quote.length > characterLimit && styles.inputError
              ]}
              placeholder="Enter your favorite quote..."
              placeholderTextColor="#999"
              value={quote}
              onChangeText={setQuote}
              multiline
              textAlignVertical="top"
              maxLength={characterLimit + 50} // Allow slight overflow for warning
            />
            <View style={styles.charCounter}>
              <ThemedText style={[
                styles.charCountText,
                remainingChars < 0 && styles.charCountError
              ]}>
                {remainingChars} characters remaining
              </ThemedText>
            </View>
          </View>

          {/* Author Input */}
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.label}>Author</ThemedText>
            <TextInput
              style={styles.textInput}
              placeholder="Author name (optional)"
              placeholderTextColor="#999"
              value={author}
              onChangeText={setAuthor}
              maxLength={50}
            />
          </View>

          {/* Preview */}
          {quote.trim() && (
            <View style={styles.section}>
              <ThemedText type="subtitle" style={styles.label}>Preview</ThemedText>
              <View style={styles.previewCard}>
                <ThemedText style={styles.previewQuote}>{quote}</ThemedText>
                {author && (
                  <ThemedText style={styles.previewAuthor}>— {author}</ThemedText>
                )}
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.clearButton} 
              onPress={clearForm}
              disabled={!quote && !author}
            >
              <ThemedText style={styles.clearButtonText}>Clear</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.submitButton,
                (!quote.trim() || remainingChars < 0 || isSubmitting) && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={!quote.trim() || remainingChars < 0 || isSubmitting}
            >
              {isSubmitting ? (
                <ThemedText style={styles.submitButtonText}>Posting...</ThemedText>
              ) : (
                <>
                  <ThemedText style={styles.submitButtonText}>Share Quote</ThemedText>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: '#1a1a1a',
    marginBottom: 20,
  },
  headerTitle: {
    marginTop: 10,
    marginBottom: 5,
    color: '#ffffff',
  },
  headerSubtitle: {
    color: '#a0a0a0',
    textAlign: 'center',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
    color: '#ffffff',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
  },
  quoteInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  charCounter: {
    alignItems: 'flex-end',
    marginTop: 5,
  },
  charCountText: {
    fontSize: 12,
    color: '#a0a0a0',
  },
  charCountError: {
    color: '#e74c3c',
  },
  previewCard: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#6c5ce7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  quoteIcon: {
    marginBottom: 10,
  },
  previewQuote: {
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
    marginBottom: 10,
    color: '#ffffff',
  },
  previewAuthor: {
    fontSize: 14,
    color: '#a0a0a0',
    textAlign: 'right',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 15,
  },
  clearButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e74c3c',
    backgroundColor: '#1a1a1a',
    gap: 8,
  },
  clearButtonText: {
    color: '#e74c3c',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    backgroundColor: '#6c5ce7',
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#404040',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});