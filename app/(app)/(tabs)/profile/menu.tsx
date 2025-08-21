// app/(app)/(tabs)/profile/menu.tsx
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { findDrawerParent } from '@/utils/nav';
import {
    DrawerContentScrollView,
    DrawerItem
} from '@react-navigation/drawer';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { Href, useRouter } from 'expo-router';
import { Alert, View } from 'react-native';

export default function MenuScreen() {
    const router = useRouter();
    const navigation = useNavigation();
    const { logout } = useAuth();

    const go = (href: Href) => {
        // Safely close the drawer if we're inside one; otherwise skip closing.
        const drawerNav: any = findDrawerParent(navigation);
        if (drawerNav) {
            drawerNav.dispatch(DrawerActions.closeDrawer());
        }
        // Push onto the root stack so we get a Back button to the current tab.
        router.push(href);
    };

    async function handleLogout() {
        Alert.alert(
        "Confirm Logout",
        "Are you sure you want to log out?",
        [
            { text: "Cancel", style: "cancel" },
            { 
                text: "Log out", 
                style: "destructive",
                onPress: async () => {
                    await logout();
                }
            }
        ]
        );
    }

    return (
        <DrawerContentScrollView>
            <View style={{ paddingTop: 8 }} />
            <DrawerItem label="Profile" onPress={() => go('/profile')} />
            <DrawerItem label="Log out" onPress={handleLogout} inactiveTintColor={Colors.dark.error} />
        </DrawerContentScrollView>
    );
}
