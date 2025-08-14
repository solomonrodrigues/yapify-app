// app/(drawer)/BaseLayout.tsx
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useUser } from "@/hooks/useUser";
import { useRouter } from "expo-router";

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { isLoading: authLoading, isLoggedIn } = useAuth();
  const { loading: userLoading } = useUser();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  // If not logged in, redirect to /auth
  useEffect(() => {
    if (!authLoading && !userLoading && !isLoggedIn) {
      setRedirecting(true);
      router.replace("/auth");
    }
  }, [authLoading, userLoading, isLoggedIn]);

  // Show loading until auth + user finish
  if (authLoading || userLoading || redirecting || !isLoggedIn) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <>{children}</>;
}
