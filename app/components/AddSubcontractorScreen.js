// Client Portal - Add Subcontractor Screen

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '../../src/services/supabase';

const AddSubcontractorScreen = () => {
 const router = useRouter();
 const [modalVisible, setModalVisible] = useState(false);
 const [subName, setSubName] = useState('');
 const [subEmail, setSubEmail] = useState('');
 const [subPhone, setSubPhone] = useState('');
 const [sending, setSending] = useState(false);

 // Project state
 const [projects, setProjects] = useState([]);
 const [selectedProject, setSelectedProject] = useState('');
 const [gcCompanyName, setGcCompanyName] = useState('');

 // Upload modal state
 const [uploadModalVisible, setUploadModalVisible] = useState(false);
 const [uploadFile, setUploadFile] = useState(null);
 const [uploading, setUploading] = useState(false);

 // Fetch projects when modal opens
 useEffect(() => {
   if (modalVisible || uploadModalVisible) {
     const fetchProjects = async () => {
       const { data: { user } } = await supabase.auth.getUser();
       
       if (!user) {
         setProjects([]);
         return;
       }

       // First try to find client by email
       const { data: clientData } = await supabase
         .from('clients')
         .select('id')
         .ilike('email', user.email)
         .single();

       if (clientData) {
         // Found client - show their projects
         const { data } = await supabase
           .from('projects')
           .select('id, project_name, client_id')
           .eq('client_id', clientData.id)
           .order('project_name');
         setProjects(data || []);
       } else {
         // No client record - show only projects where this user has created subcontractors
         const { data: subData } = await supabase
           .from('subcontractors')
           .select('project_id')
           .ilike('email', user.email);
         
         const projectIds = [...new Set(subData?.map(s => s.project_id).filter(Boolean))];
         
         if (projectIds.length > 0) {
           const { data } = await supabase
             .from('projects')
             .select('id, project_name, client_id')
             .in('id', projectIds)
             .order('project_name');
           setProjects(data || []);
         } else {
           // No projects found - show empty
           setProjects([]);
         }
       }
     };
     fetchProjects();
   }
 }, [modalVisible, uploadModalVisible]);
 const handleProjectChange = async (projectId) => {
 setSelectedProject(projectId);

 if (projectId) {
 const { data: projectData } = await supabase
 .from('projects')
 .select('client_id')
 .eq('id', projectId)
 .single();

 if (projectData?.client_id) {
 const { data: clientData } = await supabase
 .from('clients')
 .select('company_name')
 .eq('id', projectData.client_id)
 .single();
 setGcCompanyName(clientData?.company_name || '');
 }
 }
 };

 // ====== GC UPLOAD FLOW ======
 const handleGCUpload = () => {
 setUploadModalVisible(true);
 };

 const pickDocument = async () => {
 try {
 const result = await DocumentPicker.getDocumentAsync({
 type: ['application/pdf', 'image/jpeg', 'image/png'],
 copyToCacheDirectory: true,
 });

 if (result.canceled) return;

 const asset = result.assets[0];
 setUploadFile({
 name: asset.name,
 uri: asset.uri,
 mimeType: asset.mimeType || 'application/octet-stream',
 });
 } catch (error) {
 alert('Error picking file: ' + error.message);
 }
 };

 const handleUploadCOI = async () => {
   if (!selectedProject) {
     alert('Please select a Project');
     return;
   }
   if (!subName.trim()) {
     alert('Company name is required');
     return;
   }
   if (!uploadFile) {
     alert('Please select a COI file');
     return;
   }

   setUploading(true);

   try {
     // 1. Read file content - handle both native and web builds
     let fileContent;
     try {
       if (uploadFile.uri && uploadFile.uri.startsWith('blob:')) {
         // Web blob URL
         const response = await fetch(uploadFile.uri);
         fileContent = await response.arrayBuffer();
       } else if (uploadFile.uri) {
         // Native file URI
         const response = await fetch(uploadFile.uri);
         const blob = await response.blob();
         fileContent = await blob.arrayBuffer();
       } else {
         throw new Error('Cannot read file');
       }
     } catch (fileError) {
       console.error('File read error:', fileError);
       alert('Error reading file. Please try again.');
       setUploading(false);
       return;
     }

     // 2. Upload file to Supabase Storage
     const fileExt = uploadFile.name.split('.').pop();
     const fileName = `coi/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
     
     let contentType = 'application/pdf';
     if (fileExt.toLowerCase() === 'jpg' || fileExt.toLowerCase() === 'jpeg') contentType = 'image/jpeg';
     else if (fileExt.toLowerCase() === 'png') contentType = 'image/png';

     const { error: uploadError } = await supabase.storage
       .from('coi-files')
       .upload(fileName, fileContent, { contentType, upsert: false });

     if (uploadError) {
       console.error('Storage upload error:', uploadError);
       alert('Upload failed: ' + uploadError.message);
       setUploading(false);
       return;
     }

     // 3. Get public URL
     const { data: { publicUrl } } = supabase.storage
       .from('coi-files')
       .getPublicUrl(fileName);

     // 4. Get project info for client_id
     const selectedProj = projects.find(p => p.id === selectedProject);
     const clientId = selectedProj?.client_id;

     // 5. Insert into subcontractors table
     const { error: insertError } = await supabase
       .from('subcontractors')
       .insert({
         company_name: subName,
         email: subEmail,
         phone: subPhone,
         coi_url: publicUrl,
         client_id: clientId,
         project_id: selectedProject,
         verification_status: 'MANUAL_REVIEW',
         created_at: new Date().toISOString()
       });

     if (insertError) {
       console.error('Insert error:', insertError);
       throw insertError;
     }

     alert('COI uploaded successfully! We\'ll verify it and send you a report.');
     setUploadModalVisible(false);
     resetUploadForm();
     router.push('/');
   } catch (error) {
     alert('Error: ' + error.message);
   } finally {
     setUploading(false);
   }
 };
 const resetUploadForm = () => {
 setSubName('');
 setSubEmail('');
 setSubPhone('');
 setSelectedProject('');
 setGcCompanyName('');
 setUploadFile(null);
 };
 // ====== END GC UPLOAD FLOW ======

 const handleSendLink = () => {
 setModalVisible(true);
 };

 const handleSendInvite = async () => {
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

 const selectedProj = projects.find(p => p.id === selectedProject);
 const clientId = selectedProj?.client_id;

 const { error: insertError } = await supabase
 .from('subcontractors')
 .insert({
 company_name: subName,
 email: subEmail,
 phone: subPhone,
 invite_token: token,
 client_id: clientId,
 project_id: selectedProject,
 verification_status: 'MANUAL_REVIEW',
 created_at: new Date().toISOString()
 });

 if (insertError) {
 console.error('Insert error:', insertError);
 }

 // Send email via Supabase Edge Function
try {
 const { data, error } = await supabase.functions.invoke('send-invite', {
 body: {
 email: subEmail,
 subName: subName,
 projectName: selectedProj?.project_name || 'your project',
 gcName: gcCompanyName || 'CoverageGuard',
 inviteLink: link
 }
});
 if (error) console.log('Function error:', error);
} catch (emailError) {
 console.log('Email send error:', emailError);
}
 alert('Invite sent!\n\nLink: ' + link);
 setModalVisible(false);
 router.push('/');
 setSubName('');
 setSubEmail('');
 setSubPhone('');
 setSelectedProject('');
 setGcCompanyName('');
 } catch (error) {
 alert('Error: ' + error.message);
 } finally {
 setSending(false);
 }
 };

 const resetForm = () => {
 setSubName('');
 setSubEmail('');
 setSubPhone('');
 setSelectedProject('');
 setGcCompanyName('');
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
 <Text style={styles.helpText}>Email us at verifications@coverageguard.net for assistance in adding a subcontractor.</Text>
 </View>

 {/* Send Invite Modal */}
 <Modal visible={modalVisible} animationType="slide" transparent>
 <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
 <ScrollView contentContainerStyle={styles.modalScroll}>
 <View style={styles.modalContent}>
 <Text style={styles.modalTitle}>Send Invite Link</Text>

 <Text style={styles.label}>Select Project *</Text>
 <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
 {projects.map(proj => (
 <TouchableOpacity
 key={proj.id}
 style={[styles.chip, selectedProject === proj.id && styles.chipSelected]}
 onPress={() => handleProjectChange(proj.id)}
 >
 <Text style={[styles.chipText, selectedProject === proj.id && styles.chipTextSelected]}>
 {proj.project_name}
 </Text>
 </TouchableOpacity>
 ))}
 </ScrollView>

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

 {/* Upload COI Modal */}
 <Modal visible={uploadModalVisible} animationType="slide" transparent>
 <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
 <ScrollView contentContainerStyle={styles.modalScroll}>
 <View style={styles.modalContent}>
 <Text style={styles.modalTitle}>📤 Upload COI</Text>

 <Text style={styles.label}>Select Project *</Text>
 <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
 {projects.map(proj => (
 <TouchableOpacity
 key={proj.id}
 style={[styles.chip, selectedProject === proj.id && styles.chipSelected]}
 onPress={() => handleProjectChange(proj.id)}
 >
 <Text style={[styles.chipText, selectedProject === proj.id && styles.chipTextSelected]}>
 {proj.project_name}
 </Text>
 </TouchableOpacity>
 ))}
 </ScrollView>

 <TextInput style={styles.input} placeholder="Subcontractor Company Name *" value={subName} onChangeText={setSubName} placeholderTextColor="#999" />
 <TextInput style={styles.input} placeholder="Email Address (optional)" value={subEmail} onChangeText={setSubEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#999" />
 <TextInput style={styles.input} placeholder="Phone Number (optional)" value={subPhone} onChangeText={setSubPhone} keyboardType="phone-pad" placeholderTextColor="#999" />

 <TouchableOpacity style={styles.filePickerBtn} onPress={pickDocument}>
 <Text style={styles.filePickerIcon}>📎</Text>
 <Text style={styles.filePickerText}>
 {uploadFile ? '✓ ' + uploadFile.name : 'Select COI File (PDF, JPG, PNG)'}
 </Text>
 </TouchableOpacity>

 <TouchableOpacity style={[styles.sendBtn, (!uploadFile || uploading) && styles.sendBtnDisabled]} onPress={handleUploadCOI} disabled={!uploadFile || uploading}>
 {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendBtnText}>📤 Upload COI</Text>}
 </TouchableOpacity>

 <TouchableOpacity style={styles.cancelBtn} onPress={() => { setUploadModalVisible(false); resetUploadForm(); }}>
 <Text style={styles.cancelBtnText}>Cancel</Text>
 </TouchableOpacity>
 </View>
 </ScrollView>
 </KeyboardAvoidingView>
 </Modal>
</ScrollView>
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
 filePickerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderWidth: 2, borderColor: '#e2e8f0', borderRadius: 12, borderStyle: 'dashed', marginBottom: 12 },
 filePickerIcon: { fontSize: 20, marginRight: 8 },
 filePickerText: { fontSize: 14, color: '#4a5568' },
 sendBtn: { backgroundColor: '#38a169', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 12 },
 sendBtnDisabled: { opacity: 0.6 },
 sendBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
 cancelBtn: { padding: 12, alignItems: 'center', marginTop: 8 },
 cancelBtnText: { color: '#718096', fontSize: 14 },
});

export default AddSubcontractorScreen;