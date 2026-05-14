// Client Portal - Login Screen
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { authService } from '../src/services/supabase';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [loading, setLoading] = useState(false);
 const router = useRouter();

 const goToSignup = () => {
 if (typeof window !== 'undefined') {
 window.location.href = '/signup';
 } else {
 router.push('/signup');
 }
 };

 const handleLogin = async () => {
 if (!email || !password) {
 alert('Please enter email and password');
 return;
 }
 setLoading(true);
 try {
 await authService.signIn(email, password);
 setLoading(false);
 if (typeof window !== 'undefined') {
 window.location.href = '/';
 } else {
 router.replace('/');
 }
 } catch (error) {
 alert('Login Failed: ' + error.message);
 setLoading(false);
 }
 };

 return (
 <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
 <ScrollView contentContainerStyle={styles.scrollContent}>
 <View style={styles.logoContainer}>
 <Image source={require('../assets/logo.png')} style={styles.logoImage} />
 <Text style={styles.subtitleText}>Workers' Compensation Verification Platform</Text>
 </View>

 <TouchableOpacity style={styles.signUpButton} onPress={goToSignup}>
 <Text style={styles.signUpButtonText}>Create Account</Text>
 <Text style={styles.signUpButtonSubtext}>Register your company and projects</Text>
 </TouchableOpacity>

 <View style={styles.form}>
 <Text style={styles.title}>Sign In</Text>
 <Text style={styles.formSubtitle}>Already have an account?</Text>
 <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#999" />
 <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor="#999" />
 <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleLogin} disabled={loading}>
 <Text style={styles.buttonText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
 </TouchableOpacity>
 </View>
 </ScrollView>
 </KeyboardAvoidingView>
 );
}

const styles = StyleSheet.create({
 container: { flex: 1, backgroundColor: '#f7fafc' },
 scrollContent: { flexGrow: 1, padding: 24, justifyContent: 'center' },
 logoContainer: { alignItems: 'center', marginBottom: 24 },
 logoImage: { width: 320, height: 150, resizeMode: 'contain', marginBottom: 8 },
 subtitleText: { fontSize: 14, color: '#d69e2e', fontWeight: '500', textAlign: 'center' },
 signUpButton: { backgroundColor: '#38a169', borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 20 },
 signUpButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
 signUpButtonSubtext: { color: '#c6f6d5', fontSize: 13, marginTop: 4 },
 form: { backgroundColor: '#fff', borderRadius: 16, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
 title: { fontSize: 24, fontWeight: 'bold', color: '#1a365d', marginBottom: 4 },
 formSubtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
 input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 16, backgroundColor: '#f7fafc' },
 button: { backgroundColor: '#007AFF', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
 buttonDisabled: { opacity: 0.6 },
 buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});