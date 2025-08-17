import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { createQuote } from '@/api/quotes';
import { Quote, CreateQuote } from '@/types/api';

// Theme types
interface Theme {
  background: string;
  cardBackground: string;
  primaryText: string;
  secondaryText: string;
  accent: string;
  border: string;
  success: string;
  error: string;
  inputBackground: string;
  placeholder: string;
}

// Theme colors
const themes: { light: Theme; dark: Theme } = {
  light: {
    background: '#FFFFFF',
    cardBackground: '#F8F9FA',
    primaryText: '#1A1A1A',
    secondaryText: '#6B7280',
    accent: '#3B82F6',
    border: '#E5E7EB',
    success: '#10B981',
    error: '#EF4444',
    inputBackground: '#FFFFFF',
    placeholder: '#9CA3AF',
  },
  dark: {
    background: '#000000',
    cardBackground: '#1F2937',
    primaryText: '#FFFFFF',
    secondaryText: '#9CA3AF',
    accent: '#60A5FA',
    border: '#374151',
    success: '#34D399',
    error: '#F87171',
    inputBackground: '#111827',
    placeholder: '#6B7280',
  },
};

// Component props
interface CreateQuoteScreenProps {
  onQuoteCreated?: (quote: Quote) => void;
  onCancel?: () => void;
}

// Create Quote Screen Component
const CreateQuoteScreen: React.FC<CreateQuoteScreenProps> = ({ 
  onQuoteCreated, 
  onCancel 
}) => {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme: Theme = themes[colorScheme];

  const [quoteContent, setQuoteContent] = useState<string>('');
  const [quotedUserEmail, setQuotedUserEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<{
    text?: string;
    email?: string;
    general?: string;
  }>({});

  const textInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);

  // Validate email format
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate form inputs
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    // Validate quote text
    if (!quoteContent.trim()) {
      newErrors.text = 'Quote text is required';
    } else if (quoteContent.trim().length < 3) {
      newErrors.text = 'Quote must be at least 3 characters long';
    } else if (quoteContent.trim().length > 500) {
      newErrors.text = 'Quote must be less than 500 characters';
    }

    // Validate email
    if (!quotedUserEmail.trim()) {
      newErrors.email = 'User email is required';
    } else if (!validateEmail(quotedUserEmail.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle quote submission
  const handleSubmit = async (): Promise<void> => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const quoteData: Partial<CreateQuote> = {
        text: quoteContent.trim(),
        quoted_user_email: quotedUserEmail.trim(),
      };

      const newQuote = await createQuote(quoteData);
      
      // Show success message
      Alert.alert(
        'Success',
        'Quote created successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setQuoteContent('');
              setQuotedUserEmail('');
              // Call callback if provided
              onQuoteCreated?.(newQuote);
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error creating quote:', error);
      
      // Handle specific API errors
      if (error?.response?.data) {
        const apiErrors = error.response.data;
        setErrors({
          text: apiErrors.text?.[0],
          email: apiErrors.quoted_user_email?.[0],
          general: apiErrors.non_field_errors?.[0] || 'Failed to create quote',
        });
      } else {
        setErrors({
          general: 'Failed to create quote. Please try again.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = (): void => {
    if (quoteContent.trim() || quotedUserEmail.trim()) {
      Alert.alert(
        'Discard Changes',
        'Are you sure you want to discard your quote?',
        [
          { text: 'Keep Writing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              setQuoteContent('');
              setQuotedUserEmail('');
              setErrors({});
              onCancel?.();
            },
          },
        ]
      );
    } else {
      onCancel?.();
    }
  };

  // Clear specific error when user starts typing
  const handleContentChange = (text: string): void => {
    setQuoteContent(text);
    if (errors.text) {
      setErrors(prev => ({ ...prev, text: undefined }));
    }
  };

  const handleEmailChange = (text: string): void => {
    setQuotedUserEmail(text);
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: undefined }));
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleCancel}
            style={styles.headerButton}
            disabled={isLoading}
          >
            <Text style={[styles.headerButtonText, { color: theme.secondaryText }]}>
              Cancel
            </Text>
          </TouchableOpacity>
          
          <Text style={[styles.title, { color: theme.primaryText }]}>
            Create Quote
          </Text>
          
          <TouchableOpacity
            onPress={handleSubmit}
            style={[
              styles.headerButton,
              styles.submitButton,
              { 
                backgroundColor: theme.accent,
                opacity: isLoading ? 0.6 : 1,
              }
            ]}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.submitButtonText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* General Error */}
        {errors.general && (
          <View style={[styles.errorContainer, { backgroundColor: theme.error + '20' }]}>
            <Text style={[styles.errorText, { color: theme.error }]}>
              {errors.general}
            </Text>
          </View>
        )}

        {/* Form */}
        <View style={styles.form}>
          {/* Quote Content */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.primaryText }]}>
              Quote Content *
            </Text>
            <View style={[
              styles.textInputContainer,
              { 
                backgroundColor: theme.inputBackground,
                borderColor: errors.text ? theme.error : theme.border,
              }
            ]}>
              <TextInput
                ref={textInputRef}
                style={[
                  styles.textInput,
                  styles.multilineInput,
                  { color: theme.primaryText }
                ]}
                value={quoteContent}
                onChangeText={handleContentChange}
                placeholder="Enter the quote..."
                placeholderTextColor={theme.placeholder}
                multiline
                numberOfLines={4}
                maxLength={500}
                returnKeyType="next"
                onSubmitEditing={() => emailInputRef.current?.focus()}
                editable={!isLoading}
              />
            </View>
            <View style={styles.inputFooter}>
              {errors.text && (
                <Text style={[styles.errorText, { color: theme.error }]}>
                  {errors.text}
                </Text>
              )}
              <Text style={[styles.characterCount, { color: theme.secondaryText }]}>
                {quoteContent.length}/500
              </Text>
            </View>
          </View>

          {/* Quoted User Email */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.primaryText }]}>
              User Email *
            </Text>
            <View style={[
              styles.textInputContainer,
              { 
                backgroundColor: theme.inputBackground,
                borderColor: errors.email ? theme.error : theme.border,
              }
            ]}>
              <TextInput
                ref={emailInputRef}
                style={[styles.textInput, { color: theme.primaryText }]}
                value={quotedUserEmail}
                onChangeText={handleEmailChange}
                placeholder="user@example.com"
                placeholderTextColor={theme.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                editable={!isLoading}
              />
            </View>
            {errors.email && (
              <Text style={[styles.errorText, { color: theme.error }]}>
                {errors.email}
              </Text>
            )}
          </View>

          {/* Helper Text */}
          <View style={styles.helperContainer}>
            <Text style={[styles.helperText, { color: theme.secondaryText }]}>
              💡 Tip: Make sure the email belongs to a registered user
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 8,
  },
  headerButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  submitButton: {
    minWidth: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInputContainer: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textInput: {
    fontSize: 16,
    lineHeight: 24,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  characterCount: {
    fontSize: 14,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
  },
  helperContainer: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  helperText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default CreateQuoteScreen;
