import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import 'react-native-reanimated';
import { supabase } from '../src/services/supabase';

console.log('Supabase:', supabase);

export default function RootLayout() {
 const [session, setSession] = useState(null);
 const [loading, setLoading] = useState(true);
 const router = useRouter();
 const pathname = usePathname();

 useEffect(() => {
 supabase.auth.getSession().then(({ data: { session } }) => {
 setSession(session);
 setLoading(false);
 });

 const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
 setSession(session);
 setLoading(false);
 });

 return () => subscription.unsubscribe();
 }, []);

 useEffect(() => {
 if (!loading) {
 // Allow verify page to be public (no auth required)
 const isVerifyPage = pathname === '/verify' || pathname?.startsWith('/verify');
 
 if (!session && !isVerifyPage) {
 router.replace('/login');
 } else if (session && (pathname === '/login' || pathname === '/signup')) {
 router.replace('/');
 }
 }
 }, [session, loading, pathname]);

 if (loading) {
 return (
 <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7fafc' }}>
 <ActivityIndicator size="large" color="#007AFF" />
 </View>
 );
 }

 return (
 <ThemeProvider value={DefaultTheme}>
 <Stack>
 <Stack.Screen name="login" options={{ headerShown: false }} />
 <Stack.Screen name="signup" options={{ headerShown: false }} />
 <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
 <Stack.Screen name="verify" options={{ headerShown: false }} />
 </Stack>
 <StatusBar style="auto" />
 </ThemeProvider>
 );
}