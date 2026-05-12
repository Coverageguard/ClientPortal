import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import 'react-native-reanimated';

export default function RootLayout() {
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