import { Colors } from '@/constants/Colors';
import React from 'react';
import { Appearance, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = { children: React.ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const colorScheme = Appearance.getColorScheme() ?? 'dark';
    const theme = Colors[colorScheme];

    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text }]}>Something went wrong</Text>
        <Text style={[styles.message, { color: theme.secondaryText }]}>
          An unexpected error occurred. Your data is safe.
        </Text>
        <TouchableOpacity
          style={[styles.button, { borderColor: theme.border }]}
          onPress={this.handleReset}
          activeOpacity={0.7}
        >
          <Text style={[styles.buttonText, { color: theme.text }]}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  button: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
