import { router, Tabs } from 'expo-router';
import React, { useState } from 'react';
import { Platform, Pressable, useColorScheme } from 'react-native';
import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import QuotePostModal from '@/components/modals/QuotePostModal';
import { Quote } from '@/types/api';
import { InitialsAvatar } from '@/components/InitialsAvatar';
import { useUser } from '@/context/UserContext';
import { DataPreloader } from '@/components/DataPreloader';

function TabContent() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme]
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const { user } = useUser();

  const handleQuoteCreated = (newQuote: Quote) => {
    console.log('New quote created:', newQuote);
    // Refresh your quotes list, show success message, etc.
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
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: 'Search',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="magnifyingglass" color={color} />,
          }}
        />
        <Tabs.Screen
          name="post"
          options={{
            title: 'Post',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="plus.square.fill" color={color} />,
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
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="bell.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ focused }) => (
              <InitialsAvatar
                user={user!}
                size={28}
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
              <Pressable onPress={() => router.push('/menu')}>
                <IconSymbol
                  name="line.horizontal.3"
                  size={24}
                  color={theme.text}
                  style={{ marginRight: 12 }}
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
        <DataPreloader>
            <TabContent />
        </DataPreloader>
    );
}
