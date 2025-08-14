// app/(drawer)/_layout.tsx
import { Drawer } from 'expo-router/drawer';
import { Href, useRouter } from 'expo-router';
import {
    DrawerContentScrollView,
    DrawerItem
} from '@react-navigation/drawer';
import { DrawerActions, useNavigation, NavigationProp } from '@react-navigation/native';
import { ActivityIndicator, useWindowDimensions, View } from 'react-native';
import { findDrawerParent } from '@/utils/nav';
import { HeaderProfileLeft } from '@/components/HeaderProfileLeft';
import { useUser } from '@/hooks/useUser';
import { User } from '@/types/api';
import { getInitials } from '@/utils/user';

function MenuContent() {
    const router = useRouter();
    const navigation = useNavigation();

    const go = (href: Href) => {
        // Safely close the drawer if we're inside one; otherwise skip closing.
        const drawerNav: any = findDrawerParent(navigation);
        if (drawerNav) {
            drawerNav.dispatch(DrawerActions.closeDrawer());
        }
        // Push onto the root stack so we get a Back button to the current tab.
        router.push(href);
    };

    return (
        <DrawerContentScrollView>
            <View style={{ paddingTop: 8 }} />
            <DrawerItem label="Profile" onPress={() => go('/profile')} />
            <DrawerItem label="Post" onPress={() => go('/post')} />
            <DrawerItem label="Test" onPress={() => go('/test')} />
        </DrawerContentScrollView>
    );
}

export default function DrawerLayout() {
    // responsive width (e.g., 40% of screen, max 300dip)
    const { width } = useWindowDimensions();
    const drawerWidth = Math.min(width * 0.4, 300);
    //   const navigation = useNavigation();
    const { user, loading } = useUser();

    if (loading) {
        return <ActivityIndicator></ActivityIndicator>
    }

    return (
        <Drawer
            screenOptions={{
                drawerPosition: 'left',
                headerShown: true,
                drawerStyle: { width: drawerWidth },
                headerLeft: () => {
                    const navigation = useNavigation<NavigationProp<any>>();
                    return (
                        <HeaderProfileLeft
                            user={user}
                            size={36}
                            onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
                        />
                    );
                },
            }}
            drawerContent={() => <MenuContent />}
        >
            {/* Hide the Tabs route from the drawer menu itself */}
            <Drawer.Screen
                name="(tabs)"
                options={{
                    title: 'Home',
                    drawerItemStyle: { display: 'none' }
                }}
            />
        </Drawer>
    );
}
