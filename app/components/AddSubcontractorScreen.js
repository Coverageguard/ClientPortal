// Client Portal - Add Subcontractor Screen

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/services/supabase';

const AddSubcontractorScreen = () => {
 const router = useRouter();
 const [modalVisible, setModalVisible] = useState(false);
 const [subName, setSubName] = useState('');
 const [subEmail, setSubEmail] = useState('');
 const [subPhone, setSubPhone] = useState('');
 const [sending, setSending] = useState(false);

 // NEW: Add dropdown state
 const [clients, setClients] = useState([]);
 const [projects, setProjects] = useState([]);
 const [selectedClient, setSelectedClient] = useState('');
 const [selectedProject, setSelectedProject] = useState('');

 // Auto-fetch current user's GC and projects when modal opens
useEffect(() => {
 // Fetch all clients for now (user can pick their company)
 const fetchClients = async () => {
 const { data } = await supabase
 .from('clients')
 .select('id, company_name')
 .order('company_name');
 setClients(data || []);
 };
 fetchClients();
}, []);
 // NEW: When client changes, fetch their projects
 const handleClientChange = async (clientId) => {
   setSelectedClient(clientId);
   setSelectedProject('');
   if (clientId) {
     const { data } = await supabase.from('projects').select('id, project_name').eq('client_id', clientId);
     setProjects(data || []);
   } else {
     setProjects([]);
   }
 };

 const handleGCUpload = () => {
 router.push('/upload');
 };

 const handleSendLink = () => {
 setModalVisible(true);
 };

 const handleSendInvite = async () => {
 if (!selectedClient) {
 alert('Please select a GC (General Contractor)');
 return;
 }
 if (!selectedProject) {
 alert('Please select a Project');
 return;
 }
 if (!subName.trim()) {
 alert('Company name is required');
 return;
 }
 if (!subEmail.trim() && !subPhone.trim()) {
 alert('Email or phone number is required');
 return;
 }

 setSending(true);

 try {
 const token = 'sub-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
 const link = 'https://coverageguard.net/verify?token=' + token;

 const { error: insertError } = await supabase
 .from('subcontractors')
 .insert({
 company_name: subName,
 email: subEmail,
 phone: subPhone,
 invite_token: token,
 client_id: selectedClient,
 project_id: selectedProject,
 verification_status: 'MANUAL_REVIEW',
 created_at: new Date().toISOString()
 });

 if (insertError) {
 console.error('Insert error:', insertError);
 }

 // Send email via Supabase Edge Function (bypasses CORS)
 try {
 await fetch('https://rumcdinmuiqhcakhuscs.supabase.co/functions/v1/send-invite', {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 'Authorization': 'Bearer eyJhbG…yE04'
 },
 body: JSON.stringify({
 email: subEmail,
 companyName: subName,
 link: link
 })
 });
 } catch (emailError) {
 console.log('Email send error:', emailError);
 }

 alert('Invite sent!\n\nLink: ' + link);
 setModalVisible(false);
router.push('/');
 setSubName('');
 setSubEmail('');
 setSubPhone('');
 setSelectedClient('');
 setSelectedProject('');
 } catch (error) {
 alert('Error: ' + error.message);
 } finally {
 setSending(false);
 }
 };

 // Helper to reset form
 const resetForm = () => {
   setSubName('');
   setSubEmail('');
   setSubPhone('');
   setSelectedClient('');
   setSelectedProject('');
   setProjects([]);
   setModalVisible(false);
 };

 return (
 <View style={styles.container}>
 <View style={styles.header}>
 <TouchableOpacity onPress={() => router.back()}>
 <Text style={styles.backText}>← Back</Text>
 </TouchableOpacity>
 <Text style={styles.headerTitle}>Add Subcontractor</Text>
 <View style={{ width: 50 }} />
 </View>

 <ScrollView style={styles.content}>
 <Text style={styles.subtitle}>Choose how to add a subcontractor:</Text>

 <TouchableOpacity style={styles.optionCard} onPress={handleSendLink}>
 <View style={styles.optionIcon}><Text style={styles.iconText}>📧</Text></View>
 <View style={styles.optionContent}>
 <Text style={styles.optionTitle}>Send Invite Link</Text>
 <Text style={styles.optionDesc}>We'll email them a link to upload their COI directly.</Text>
 </View>
 <Text style={styles.arrow}>›</Text>
 </TouchableOpacity>

 <TouchableOpacity style={styles.optionCard} onPress={handleGCUpload}>
 <View style={styles.optionIcon}><Text style={styles.iconText}>📤</Text></View>
 <View style={styles.optionContent}>
 <Text style={styles.optionTitle}>Upload COI for Them</Text>
 <Text style={styles.optionDesc}>If they can't do it themselves, you can upload their COI.</Text>
 </View>
 <Text style={styles.arrow}>›</Text>
 </TouchableOpacity>

 <View style={styles.helpBox}>
 <Text style={styles.helpTitle}>Need Help?</Text>
 <Text style={styles.helpText}>Call us at (555) 123-4567 for assisted onboarding.</Text>
 </View>
 </ScrollView>

 <Modal visible={modalVisible} animationType="slide" transparent>
 <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
 <ScrollView contentContainerStyle={styles.modalScroll}>
 <View style={styles.modalContent}>
 <Text style={styles.modalTitle}>Send Invite Link</Text>

 {/* NEW: GC Dropdown */}
 <Text style={styles.label}>Select GC *</Text>
 <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
 {clients.map(client => (
   <TouchableOpacity 
     key={client.id} 
     style={[styles.chip, selectedClient === client.id && styles.chipSelected]}
     onPress={() => handleClientChange(client.id)}
   >
     <Text style={[styles.chipText, selectedClient === client.id && styles.chipTextSelected]}>
       {client.company_name}
     </Text>
   </TouchableOpacity>
 ))}
 </ScrollView>

 {/* NEW: Project Dropdown */}
 {selectedClient ? (
   <>
   <Text style={styles.label}>Select Project *</Text>
   <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
     {projects.map(proj => (
       <TouchableOpacity 
         key={proj.id} 
         style={[styles.chip, selectedProject === proj.id && styles.chipSelected]}
         onPress={() => setSelectedProject(proj.id)}
       >
         <Text style={[styles.chipText, selectedProject === proj.id && styles.chipTextSelected]}>
           {proj.project_name}
         </Text>
       </TouchableOpacity>
     ))}
   </ScrollView>
   </>
 ) : null}

 <TextInput style={styles.input} placeholder="Company Name *" value={subName} onChangeText={setSubName} placeholderTextColor="#999" />
 <TextInput style={styles.input} placeholder="Email Address" value={subEmail} onChangeText={setSubEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#999" />
 <TextInput style={styles.input} placeholder="Phone Number" value={subPhone} onChangeText={setSubPhone} keyboardType="phone-pad" placeholderTextColor="#999" />

 <TouchableOpacity style={[styles.sendBtn, sending && styles.sendBtnDisabled]} onPress={handleSendInvite} disabled={sending}>
 {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendBtnText}>📤 Send Invite Link</Text>}
 </TouchableOpacity>

 <TouchableOpacity style={styles.cancelBtn} onPress={resetForm}>
 <Text style={styles.cancelBtnText}>Cancel</Text>
 </TouchableOpacity>
 </View>
 </ScrollView>
 </KeyboardAvoidingView>
 </Modal>
 </View>
 );
};

const styles = StyleSheet.create({
 container: { flex: 1, backgroundColor: '#f7fafc' },
 header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 50, backgroundColor: '#1a365d' },
 backText: { color: '#d69e2e', fontSize: 16 },
 headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
 content: { flex: 1, padding: 20 },
 subtitle: { fontSize: 16, color: '#666', marginBottom: 24, textAlign: 'center' },
 optionCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
 optionIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#f7fafc', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
 iconText: { fontSize: 24 },
 optionContent: { flex: 1 },
 optionTitle: { fontSize: 16, fontWeight: '600', color: '#1a365d', marginBottom: 4 },
 optionDesc: { fontSize: 13, color: '#718096', lineHeight: 18 },
 arrow: { fontSize: 24, color: '#cbd5e0', marginLeft: 8 },
 helpBox: { backgroundColor: '#ebf8ff', borderRadius: 12, padding: 16, marginTop: 20 },
 helpTitle: { fontSize: 14, fontWeight: '600', color: '#2c5282', marginBottom: 4 },
 helpText: { fontSize: 13, color: '#4a5568' },
 modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
 modalScroll: { flexGrow: 1, justifyContent: 'center', paddingVertical: 20 },
 modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '85%', maxWidth: 400 },
 modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a365d', marginBottom: 20, textAlign: 'center' },
 label: { fontSize: 14, fontWeight: '600', color: '#4a5568', marginBottom: 8, marginTop: 8 },
 chipScroll: { marginBottom: 12 },
 chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#e2e8f0', marginRight: 8 },
 chipSelected: { backgroundColor: '#007AFF' },
 chipText: { fontSize: 14, color: '#4a5568' },
 chipTextSelected: { color: '#fff' },
 input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 12, backgroundColor: '#f7fafc' },
 sendBtn: { backgroundColor: '#38a169', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 12 },
 sendBtnDisabled: { opacity: 0.6 },
 sendBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
 cancelBtn: { padding: 12, alignItems: 'center', marginTop: 8 },
 cancelBtnText: { color: '#718096', fontSize: 14 },
});

export default AddSubcontractorScreen;