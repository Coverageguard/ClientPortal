// Client Portal - Add Subcontractor Screen

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../src/services/supabase';
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

 // NEW: Auto-fetch current user's GC and projects
 useEffect(() => {
 const fetchCurrentClient = async () => {
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) return;

 const { data } = await supabase
 .from('clients')
 .select('id, company_name')
 .eq('email', user.email)
 .single();

 if (data) {
 setSelectedClient(data.id);
 setClients([data]);

 const { data: projectData } = await supabase
 .from('projects')
 .select('id, project_name')
 .eq('client_id', data.id);
 setProjects(projectData || []);
 }
 };
 fetchCurrentClient();
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