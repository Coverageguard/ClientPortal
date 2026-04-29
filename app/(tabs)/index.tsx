// Client Portal - Dashboard (Home Tab)

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Link } from 'expo-router';
import { useRouter } from 'expo-router';
import { authService } from '../../src/services/supabase';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
 'https://rumcdinmuiqhcakhuscs.supabase.co',
 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1bWNkaW5tdWlxaGNha2h1c2NzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4ODA0MDgsImV4cCI6MjA5MjQ1NjQwOH0.FhFwMISNZdc9b99RdhsGE8rcPB25KSa_1xKfYY8yE04'
);

export default function DashboardScreen() {
 const [profile, setProfile] = useState(null);
 const [subs, setSubs] = useState([]);
 const [loading, setLoading] = useState(true);
 const router = useRouter();

 useEffect(() => {
 loadData();
 }, []);

 const loadData = async () => {
 setLoading(true);
 try {
 const { data: { user } } = await supabase.auth.getUser();
 
 const { data: subcontractors } = await supabase
 .from('subcontractors')
 .select('*');
 
 setSubs(subcontractors || []);
 
 if (user) {
 setProfile({ company_name: user.email });
 }
 } catch (error) {
 console.error('Error loading data:', error);
 } finally {
 setLoading(false);
 }
 };
 const handleLogout = async () => {
 await authService.signOut();
 router.replace('/login');
 };

 const totalSubs = subs.length;
 const pendingCount = subs.filter(s => s.verification_status === 'PENDING' || s.verification_status === 'MANUAL_REVIEW' || !s.verification_status).length;
 const issueCount = subs.filter(s => s.verification_status === 'issue' || s.verification_status === 'ISSUE' || s.verification_status === 'expired' || s.verification_status === 'EXPIRED').length;
 const verifiedCount = subs.filter(s => s.verification_status === 'verified' || s.verification_status === 'VERIFIED' || s.verification_status === 'ACTIVE').length;

 return (
 <View style={styles.container}>
 <View style={styles.header}>
 <View>
 <Text style={styles.headerTitle}>Dashboard</Text>
 <Text style={styles.headerSubtitle}>{profile?.company_name || 'Client'}</Text>
 </View>
 <TouchableOpacity onPress={handleLogout}>
 <Text style={styles.logoutText}>Logout</Text>
 </TouchableOpacity>
 </View>

 <View style={styles.logoContainer}>
 <Image source={require('../../assets/logo.png')} style={styles.logoImage} />
 </View>

 <View style={styles.statsContainer}>
 <View style={styles.statCard}>
 <Text style={styles.statNumber}>{totalSubs}</Text>
 <Text style={styles.statLabel}>Total Subs</Text>
 </View>
 <View style={styles.statCard}>
 <Text style={[styles.statNumber, { color: '#d69e2e' }]}>
 {pendingCount}
 </Text>
 <Text style={styles.statLabel}>Pending</Text>
 </View>
 <View style={styles.statCard}>
 <Text style={[styles.statNumber, { color: '#e53e3e' }]}>
 {issueCount}
 </Text>
 <Text style={styles.statLabel}>Issues</Text>
 </View>
 <View style={styles.statCard}>
 <Text style={[styles.statNumber, { color: '#38a169' }]}>
 {verifiedCount}
 </Text>
 <Text style={styles.statLabel}>Verified</Text>
 </View>
 </View>

 <View style={styles.actionsContainer}>
 <Link href="/add-subcontractor" asChild>
 <TouchableOpacity style={styles.actionButton}>
 <Text style={styles.actionIcon}>📤</Text>
 <Text style={styles.actionText}>Add Sub</Text>
 </TouchableOpacity>
</Link>

 <Link href="/reports" asChild>
 <TouchableOpacity style={styles.actionButton}>
 <Text style={styles.actionIcon}>📊</Text>
 <Text style={styles.actionText}>Reports</Text>
 </TouchableOpacity>
 </Link>

 <Link href="/messages" asChild>
 <TouchableOpacity style={styles.actionButton}>
 <Text style={styles.actionIcon}>🔔</Text>
 <Text style={styles.actionText}>Alerts</Text>
 </TouchableOpacity>
 </Link>

 <Link href="/settings" asChild>
 <TouchableOpacity style={styles.actionButton}>
 <Text style={styles.actionIcon}>⚙️</Text>
 <Text style={styles.actionText}>Settings</Text>
 </TouchableOpacity>
 </Link>
 </View>
 </View>
 );
}

const styles = StyleSheet.create({
 container: { flex: 1, backgroundColor: '#f7fafc' },
 header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#1a365d' },
 headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
 headerSubtitle: { fontSize: 14, color: '#a0aec0', marginTop: 2 },
 logoutText: { color: '#d69e2e', fontSize: 14, fontWeight: '500' },
 logoContainer: { padding: 16 },
 logoImage: { width: 380, height: 160, resizeMode: 'contain', alignSelf: 'center' },
 statsContainer: { flexDirection: 'row', padding: 16, backgroundColor: '#1a365d' },
 statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 16, marginHorizontal: 4, alignItems: 'center' },
 statNumber: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
 statLabel: { fontSize: 12, color: '#a0aec0', marginTop: 4 },
 actionsContainer: { flexDirection: 'row', padding: 20, justifyContent: 'space-around', backgroundColor: '#fff', marginTop: 8 },
 actionButton: { alignItems: 'center', padding: 12 },
 actionIcon: { fontSize: 28, marginBottom: 4 },
 actionText: { fontSize: 12, color: '#4a5568', fontWeight: '500' },
});