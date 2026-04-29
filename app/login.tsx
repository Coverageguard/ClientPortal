// Client Portal - Login Screen

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { authService } from '../src/services/supabase';

export default function LoginScreen() {
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [loading, setLoading] = useState(false);

 const handleLogin = async () => {
 if (!email || !password) {
 Alert.alert('Error', 'Please enter email and password');
 return;
 }

 setLoading(true);
 try {
 await authService.signIn(email, password);
 } catch (error) {
 Alert.alert('Login Failed', error.message);
 } finally {
 setLoading(false);
 }
 };

 return (
 <KeyboardAvoidingView
 style={styles.container}
 behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
 >
 <ScrollView contentContainerStyle={styles.scrollContent}>
 {/* Logo */}
 <View style={styles.logoContainer}>
 <Image source={require('../assets/logo.png')} style={styles.logoImage} />
 <Text style={styles.subtitleText}>Workers' Compensation Verification Platform</Text>
 </View>

 {/* Login Form */}
 <View style={styles.form}>
 <Text style={styles.title}>Welcome Back</Text>
 <Text style={styles.formSubtitle}>Sign in to continue</Text>

 <TextInput
 style={styles.input}
 placeholder="Email"
 value={email}
 onChangeText={setEmail}
 keyboardType="email-address"
 autoCapitalize="none"
 placeholderTextColor="#999"
 />

 <TextInput
 style={styles.input}
 placeholder="Password"
 value={password}
 onChangeText={setPassword}
 secureTextEntry
 placeholderTextColor="#999"
 />

 <TouchableOpacity
 style={[styles.button, loading && styles.buttonDisabled]}
 onPress={handleLogin}
 disabled={loading}
 >
 <Text style={styles.buttonText}>
 {loading ? 'Signing in...' : 'Sign In'}
 </Text>
 </TouchableOpacity>
 </View>

 {/* Sign Up Link */}
 <View style={styles.footer}>
 <Text style={styles.footerText}>Don't have an account? </Text>
 <TouchableOpacity>
 <Text style={styles.linkText}>Sign Up</Text>
 </TouchableOpacity>
 </View>
 </ScrollView>
 </KeyboardAvoidingView>
 );
}

const styles = StyleSheet.create({
 container: { flex: 1, backgroundColor: '#f7fafc' },
 scrollContent: { flexGrow: 1, padding: 24, justifyContent: 'center' },
 logoContainer: { alignItems: 'center', marginBottom: 40 },
 logoImage: { width: 320, height: 150, resizeMode: 'contain', marginBottom: 8 },
 subtitleText: { fontSize: 14, color: '#d69e2e', fontWeight: '500', textAlign: 'center' },
 form: { backgroundColor: '#fff', borderRadius: 16, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
 title: { fontSize: 24, fontWeight: 'bold', color: '#1a365d', marginBottom: 4 },
 formSubtitle: { fontSize: 14, color: '#666', marginBottom: 24 },
 input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 16, backgroundColor: '#f7fafc' },
 button: { backgroundColor: '#007AFF', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
 buttonDisabled: { opacity: 0.6 },
 buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
 footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
 footerText: { color: '#666', fontSize: 14 },
 linkText: { color: '#007AFF', fontSize: 14, fontWeight: '500' },
});