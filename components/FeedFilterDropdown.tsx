import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Pressable,
  Animated,
  useColorScheme,
} from 'react-native';
import { IconSymbol, type IconSymbolName } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useFeedFilter, FeedFilterType, FEED_FILTER_LABELS } from '@/context/FeedFilterContext';
import * as Haptics from 'expo-haptics';

const FILTER_OPTIONS: { type: FeedFilterType; icon: IconSymbolName; description: string }[] = [
  { type: 'latest', icon: 'clock.fill', description: 'All recent quotes' },
  { type: 'guessable', icon: 'person.fill.viewfinder', description: 'Quotes you can guess' },
  { type: 'respondable', icon: 'bubble.left.fill', description: 'Quotes you can respond to' },
];

const FeedFilterDropdown: React.FC = () => {
  const styles = useThemedStyles(getStyles);
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const { filter, setFilter } = useFeedFilter();
  const [isOpen, setIsOpen] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handleOpen = () => {
    Haptics.selectionAsync().catch(() => {});
    setIsOpen(true);
  };

  const handleSelect = (type: FeedFilterType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setFilter(type);
    setIsOpen(false);
  };

  return (
    <>
      <Animated.View style={{ transform: [{ scale }] }}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleOpen}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
        >
          <Text style={styles.buttonText}>{FEED_FILTER_LABELS[filter]}</Text>
          <IconSymbol
            name="chevron.down"
            size={16}
            color={theme.secondaryText}
            style={{ marginLeft: 6 }}
          />
        </TouchableOpacity>
      </Animated.View>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setIsOpen(false)}>
          <View style={styles.dropdown}>
            {FILTER_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.type}
                style={[
                  styles.option,
                  option.type === filter && styles.optionSelected,
                ]}
                onPress={() => handleSelect(option.type)}
                activeOpacity={0.7}
              >
                <View style={styles.optionLeft}>
                  <IconSymbol
                    name={option.icon}
                    size={18}
                    color={option.type === filter ? theme.accent : theme.text}
                    style={{ marginRight: 12 }}
                  />
                  <View>
                    <Text
                      style={[
                        styles.optionLabel,
                        option.type === filter && styles.optionLabelSelected,
                      ]}
                    >
                      {FEED_FILTER_LABELS[option.type]}
                    </Text>
                    <Text style={styles.optionDescription}>{option.description}</Text>
                  </View>
                </View>
                {option.type === filter && (
                  <IconSymbol name="checkmark" size={16} color={theme.accent} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const getStyles = (theme: typeof Colors.light | typeof Colors.dark) =>
  StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 16,
    },
    buttonText: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.text,
    },
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'flex-start',
      paddingTop: 100,
    },
    dropdown: {
      marginHorizontal: 16,
      backgroundColor: theme.cardBackground,
      borderRadius: 14,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.divider,
    },
    optionSelected: {
      backgroundColor: theme.accent + '10',
    },
    optionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    optionLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.text,
    },
    optionLabelSelected: {
      color: theme.accent,
    },
    optionDescription: {
      fontSize: 12,
      color: theme.secondaryText,
      marginTop: 2,
    },
  });

export default FeedFilterDropdown;
