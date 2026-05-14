import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ActivityIndicator, View } from 'react-native';

const supabase = createClient(
  'https://rumcdinmuiqhcakhuscs.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1bWNkaW5tdWlxaGNha2h1c2NzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4ODA0MDgsImV4cCI6MjA5MjQ1NjQwOH0.FhFwMISNZdc9b99RdhsGE8rcPB25KSa_1xKfYY8yE04'
);

export default function RootLayout() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7fafc' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <>
      <Stack>
        {user ? (
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="signup" options={{ headerShown: false }} />
          </>
        )}
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}