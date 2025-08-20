// app/(drawer)/_layout.tsx
import { HeaderProfileLeft } from '@/components/HeaderProfileLeft';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { findDrawerParent } from '@/utils/nav';
import {
    DrawerContentScrollView,
    DrawerItem
} from '@react-navigation/drawer';
import { DrawerActions, NavigationProp, useNavigation } from '@react-navigation/native';
import { Href, useRouter } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { Alert, useWindowDimensions, View } from 'react-native';
import { DataPreloader } from '@/components/DataPreloader';
import { useUser } from '@/context/UserContext';

function MenuContent() {
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

function DrawerContent() {
    const { width } = useWindowDimensions();
    const drawerWidth = Math.min(width * 0.4, 300);
    const { user } = useUser();

    return (
        <Drawer
            screenOptions={{
                drawerPosition: 'left',
                headerShown: true,
                drawerStyle: { width: drawerWidth },
                headerLeft: () => {
                    // eslint-disable-next-line react-hooks/rules-of-hooks
                    const navigation = useNavigation<NavigationProp<any>>();
                    return (
                        <HeaderProfileLeft
                            user={user!}
                            size={30}
                            onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
                        />
                    );
                },
            }}
            drawerContent={() => <MenuContent />}
        >
            <Drawer.Screen
                name="(tabs)"
                options={{
                    title: '',
                    drawerItemStyle: { display: 'none' }
                }}
            />
        </Drawer>
    );
}

export default function DrawerLayout() {
    return (
        <DataPreloader>
            <DrawerContent />
        </DataPreloader>
    );
}
