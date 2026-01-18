import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import React from 'react';
import {
  StyleSheet,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

interface SearchBarProps extends Omit<TextInputProps, 'style'> {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  autoFocus?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search',
  onClear,
  autoFocus = false,
  ...textInputProps
}) => {
  const styles = useThemedStyles(getStyles);
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  const handleClear = () => {
    onChangeText('');
    onClear?.();
  };

  return (
    <View style={styles.container}>
      <IconSymbol
        name="magnifyingglass"
        size={16}
        color={theme.secondaryText}
        style={styles.searchIcon}
      />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={theme.secondaryText}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus={autoFocus}
        returnKeyType="search"
        {...textInputProps}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
          <IconSymbol name="xmark.circle.fill" size={18} color={theme.secondaryText} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const getStyles = (theme: typeof Colors.light | typeof Colors.dark) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.inputBackground,
      borderRadius: 20,
      paddingHorizontal: 12,
    },
    searchIcon: {
      marginRight: 8,
    },
    input: {
      flex: 1,
      fontSize: 16,
      paddingVertical: 10,
      color: theme.text,
    },
    clearButton: {
      marginLeft: 8,
      padding: 2,
    },
  });
