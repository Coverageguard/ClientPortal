// Client Portal - Upload COI Screen

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
 'https://rumcdinmuiqhcakhuscs.supabase.co',
 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1bWNkaW5tdWlxaGNha2h1c2NzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4ODA0MDgsImV4cCI6MjA5MjQ1NjQwOH0.FhFwMISNZdc9b99RdhsGE8rcPB25KSa_1xKfYY8yE04'
);

// Helper to convert blob to Uint8Array
const blobToUint8Array = (blob) => {
 return new Promise((resolve, reject) => {
 const reader = new FileReader();
 reader.onload = () => resolve(new Uint8Array(reader.result));
 reader.onerror = reject;
 reader.readAsArrayBuffer(blob);
 });
};

export default function UploadScreen() {
 const router = useRouter();
 const [selectedFile, setSelectedFile] = useState(null);
 const [uploading, setUploading] = useState(false);

 const pickDocument = async () => {
 try {
 const result = await DocumentPicker.getDocumentAsync({
 type: ['application/pdf', 'image/jpeg', 'image/png'],
 copyToCacheDirectory: true,
 });

 if (result.canceled) return;

 const file = result.assets[0];

 if (file.size && file.size > 10 * 1024 * 1024) {
 Alert.alert('File too large', 'Maximum file size is 10MB');
 return;
 }

 setSelectedFile({
 name: file.name,
 uri: file.uri,
 type: file.mimeType,
 size: file.size,
 });
 } catch (error) {
 console.error('Error picking document:', error);
 Alert.alert('Error', 'Could not select file. Please try again.');
 }
 };

 const handleUpload = async () => {
 if (!selectedFile) {
 Alert.alert('No file selected', 'Please select a COI file first.');
 return;
 }

 setUploading(true);

 try {
 const clientId = '00000000-0000-0000-0000-000000000001';

 const fileExt = selectedFile.name.split('.').pop();
 const fileName = `${clientId}/${Date.now()}.${fileExt}`;

 let contentType = 'application/pdf';
 if (fileExt.toLowerCase() === 'jpg' || fileExt.toLowerCase() === 'jpeg') {
 contentType = 'image/jpeg';
 } else if (fileExt.toLowerCase() === 'png') {
 contentType = 'image/png';
 }

 // Fetch the file and convert
 const response = await fetch(selectedFile.uri);
 const blob = await response.blob();
 const fileData = await blobToUint8Array(blob);

 const { error: uploadError } = await supabase.storage
 .from('coi-files')
 .upload(fileName, fileData, {
 contentType: contentType,
 upsert: false,
 });

 if (uploadError) {
 console.error('Upload error:', uploadError);
 throw uploadError;
 }

 const { data: { publicUrl } } = supabase.storage
 .from('coi-files')
 .getPublicUrl(fileName);

 const { error: dbError } = await supabase
 .from('coi_uploads')
 .insert({
 client_id: clientId,
 file_name: selectedFile.name,
 file_url: publicUrl,
 file_type: contentType,
 status: 'pending',
 });

 if (dbError) {
 console.error('Database error:', dbError);
 throw dbError;
 }

 Alert.alert('Success', 'COI uploaded successfully!', [
 { text: 'OK', onPress: () => router.replace('/') }
 ]);
 } catch (error) {
 console.error('Upload failed:', error);
 Alert.alert('Upload Failed', 'Could not upload file. Please try again.');
 } finally {
 setUploading(false);
 }
 };

 return (
 <View style={styles.container}>
 <View style={styles.header}>
 <TouchableOpacity onPress={() => router.back()}>
 <Text style={styles.backText}>‹ Back</Text>
 </TouchableOpacity>
 <Text style={styles.headerTitle}>Upload COI</Text>
 <View style={{ width: 40 }} />
 </View>

 <ScrollView style={styles.content}>
 <TouchableOpacity style={styles.uploadBox} onPress={pickDocument} disabled={uploading}>
 {selectedFile ? (
 <View style={styles.selectedFile}>
 <Text style={styles.uploadIcon}>✅</Text>
 <Text style={styles.selectedFileName}>{selectedFile.name}</Text>
 <Text style={styles.changeFileText}>Tap to change</Text>
 </View>
 ) : (
 <View>
 <Text style={styles.uploadIcon}>📄</Text>
 <Text style={styles.uploadText}>Tap to select COI file</Text>
 <Text style={styles.uploadSubtext}>PDF, JPG, or PNG up to 10MB</Text>
 </View>
 )}
 </TouchableOpacity>

 <View style={styles.infoBox}>
 <Text style={styles.infoTitle}>What happens next?</Text>
 <Text style={styles.infoText}>1. We'll verify the coverage directly with the carrier</Text>
 <Text style={[styles.infoText, styles.infoHighlight]}>2. COI alone is not relied upon</Text>
 <Text style={styles.infoText}>3. You'll receive a coverage report</Text>
 <Text style={styles.infoText}>4. Any issues will be highlighted in color</Text>
 </View>

 <TouchableOpacity
 style={[styles.button, (!selectedFile || uploading) && styles.buttonDisabled]}
 onPress={handleUpload}
 disabled={!selectedFile || uploading}
 >
 {uploading ? (
 <ActivityIndicator color="#fff" />
 ) : (
 <Text style={styles.buttonText}>Upload COI</Text>
 )}
 </TouchableOpacity>
 </ScrollView>
 </View>
 );
}

const styles = StyleSheet.create({
 container: { flex: 1, backgroundColor: '#f7fafc' },
 header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 50, backgroundColor: '#1a365d' },
 backText: { color: '#d69e2e', fontSize: 16, fontWeight: '600' },
 headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
 content: { flex: 1, padding: 20 },
 uploadBox: { backgroundColor: '#fff', borderRadius: 12, padding: 40, alignItems: 'center', borderWidth: 2, borderColor: '#e2e8f0', borderStyle: 'dashed', marginBottom: 20 },
 uploadIcon: { fontSize: 48, marginBottom: 12 },
 uploadText: { fontSize: 16, fontWeight: '600', color: '#1a365d', marginBottom: 4 },
 uploadSubtext: { fontSize: 14, color: '#666' },
 selectedFile: { alignItems: 'center' },
 selectedFileName: { fontSize: 14, fontWeight: '600', color: '#1a365d', marginBottom: 8, textAlign: 'center' },
 changeFileText: { fontSize: 12, color: '#007AFF' },
 infoBox: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 20 },
 infoTitle: { fontSize: 16, fontWeight: '600', color: '#1a365d', marginBottom: 12 },
 infoText: { fontSize: 14, color: '#666', lineHeight: 22 },
 infoHighlight: { fontSize: 14, color: '#d69e2e', fontWeight: '600', marginTop: 4 },
 button: { backgroundColor: '#007AFF', borderRadius: 12, padding: 16, alignItems: 'center' },
 buttonDisabled: { backgroundColor: '#a0aec0' },
 buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});