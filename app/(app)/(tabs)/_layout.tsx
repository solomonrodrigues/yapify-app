// app/(app)/(tabs)/_layout.tsx
import { router, Tabs } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Platform, Pressable, useColorScheme } from 'react-native';
import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import QuotePostModal from '@/components/modals/QuotePostModal';
import { Quote } from '@/types/api';
import { InitialsAvatar } from '@/components/InitialsAvatar';
import { useUser } from '@/context/UserContext';
import { DataPreloader } from '@/components/DataPreloader';
import Toast from 'react-native-toast-message';
import { markAllNotificationsRead } from '@/lib/api/notifications';
import { FeedFilterProvider } from '@/context/FeedFilterContext';
import FeedFilterDropdown from '@/components/FeedFilterDropdown';

function TabContent() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme]
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const { user } = useUser();

  const handleQuoteCreated = (newQuote: Quote) => {
    console.log('New quote created:', newQuote);
    // Refresh your quotes list, show success message, etc.
  };

  const tabBarIconSize = Platform.OS === 'ios' ? 28 : 20
  const headerIconSize = Platform.OS === 'ios' ? 28 : 20
  const headerIconMarginRight = 16;

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      Toast.show({
        type: 'info',
        text1: 'You\'re all caught up.'
      });
      // ToDo: update notifications is_read if possible.
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to mark all notifications as read');
    }
  };


  const openNotificationsMenu = () => {
    Alert.alert(
      "",
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
                onPress={(e: any) => {
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
            tabBarIcon: ({ color }) => <IconSymbol size={tabBarIconSize} name="bell.fill" color={color} />,
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
        onQuoteCreated={handleQuoteCreated} // Optional callback
      />
    </>
  );
}

export default function TabLayout() {
    return (
        <FeedFilterProvider>
            <DataPreloader>
                <TabContent />
            </DataPreloader>
        </FeedFilterProvider>
    );
}
