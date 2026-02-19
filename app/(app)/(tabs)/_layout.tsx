// app/(app)/(tabs)/_layout.tsx
import { router, Tabs } from 'expo-router';
import React, { useState } from 'react';
import { Alert, GestureResponderEvent, Platform, Pressable, StyleSheet, useColorScheme, View } from 'react-native';
import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import QuotePostModal from '@/components/modals/QuotePostModal';
import { InitialsAvatar } from '@/components/InitialsAvatar';
import { useUser } from '@/context/UserContext';
import { useNotifications } from '@/context/NotificationsContext';
import { DataPreloader } from '@/components/DataPreloader';
import Toast from 'react-native-toast-message';
import FeedFilterDropdown from '@/components/FeedFilterDropdown';
import { ThemedText } from '@/components/ThemedText';

function NotificationBadge({ count }: { count: number }) {
  if (count === 0) return null;

  return (
    <View style={badgeStyles.badge}>
      <ThemedText style={badgeStyles.badgeText}>
        {count <= 99 ? count : '99+'}
      </ThemedText>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: '#FF3B30',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
  },
});

function TabContent() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme]
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const { user } = useUser();
  const { markAllAsRead, unreadCount } = useNotifications();

  const tabBarIconSize = Platform.OS === 'ios' ? 28 : 20
  const headerIconSize = Platform.OS === 'ios' ? 28 : 20
  const headerIconMarginRight = 16;

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      Toast.show({
        type: 'info',
        text1: 'You\'re all caught up.'
      });
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to mark all notifications as read');
    }
  };


  const openNotificationsMenu = () => {
    Alert.alert(
      "Notifications",
      undefined,
      [
        {
          text: "Mark all as read",
          onPress: () => handleMarkAllRead(),
          style: "default",
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: theme.tint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarStyle: Platform.select({
            ios: {
              // Use a transparent background on iOS to show the blur effect
              position: 'absolute',
            },
            default: {},
          }),
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <IconSymbol size={tabBarIconSize} name="house.fill" color={color} />,
            headerShown: true,
            headerTitle: '',
            headerLeft: () => <FeedFilterDropdown />,
            headerRight: () => (
              <Pressable onPress={() => router.push('/search')}>
                <IconSymbol
                  name="magnifyingglass"
                  size={headerIconSize}
                  color={theme.text}
                  style={{ marginRight: headerIconMarginRight }}
                />
              </Pressable>
            ),
          }}
        />
        <Tabs.Screen
          name="post"
          options={{
            title: 'Post',
            tabBarIcon: ({ color }) => <IconSymbol size={tabBarIconSize} name="plus.square.fill" color={color} />,
            tabBarButton: (props) => (
              <HapticTab
                {...props}
                onPress={(e: GestureResponderEvent) => {
                  e?.preventDefault?.();
                  setShowQuoteModal(true);
                }}
              />
            )
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            title: 'Notifications',
            tabBarIcon: ({ color }) => (
              <View>
                <IconSymbol size={tabBarIconSize} name="bell.fill" color={color} />
                <NotificationBadge count={unreadCount} />
              </View>
            ),
            headerShown: true,
            headerTitle: '',
            headerRight: () => (
              <>
                <Pressable onPress={() => openNotificationsMenu()}>
                  <IconSymbol
                    name="ellipsis"
                    size={headerIconSize}
                    color={theme.text}
                    style={{ marginRight: headerIconMarginRight }}
                  />
                </Pressable>
                <Pressable onPress={() => router.push('/search')}>
                  <IconSymbol
                    name="magnifyingglass"
                    size={headerIconSize}
                    color={theme.text}
                    style={{ marginRight: headerIconMarginRight }}
                  />
                </Pressable>
              </>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ focused }) => (
              <InitialsAvatar
                user={user!}
                size={tabBarIconSize}
                style={{
                  marginBottom: 2,
                  borderWidth: focused ? 1 : 0.5,
                  borderColor: focused ? theme.tabIconSelected : theme.avatarBorder,
                }}
              />
            ),
            headerShown: true,
            headerTitle: '',
            headerRight: () => (
              <Pressable onPress={() => router.push('/my-account')}>
                <IconSymbol
                  name="line.horizontal.3"
                  size={headerIconSize}
                  color={theme.text}
                  style={{ marginRight: headerIconMarginRight }}
                />
              </Pressable>
            ),
          }}
        />
      </Tabs>

      {/* React Native Modal lives alongside the Tabs */}
      <QuotePostModal
        visible={showQuoteModal}
        onClose={() => setShowQuoteModal(false)}
      />
    </>
  );
}

export default function TabLayout() {
    return (
        <DataPreloader>
            <TabContent />
        </DataPreloader>
    );
}
