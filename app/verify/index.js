// Client Portal - Public Verify Screen
// Subcontractor clicks this from the email link to upload their COI

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '../../src/services/supabase';
export default function VerifyScreen() {
  const { token } = useLocalSearchParams();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [subcontractor, setSubcontractor] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [fein, setFein] = useState('');
  const [carrierName, setCarrierName] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  useEffect(() => {
    if (token) validateToken();
    else setLoading(false);
  }, [token]);

  const validateToken = async () => {
    try {
      const { data, error } = await supabase
        .from('subcontractors')
        .select('*')
        .eq('invite_token', token)
        .single();

      if (error || !data) {
        Alert.alert('Invalid Link', 'This verification link is invalid or has expired.', [
          { text: 'OK', onPress: () => router.replace('/') }
        ]);
        return;
      }

      setSubcontractor(data);
      setCompanyName(data.company_name || '');
      setContactEmail(data.email || '');
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Could not validate this link.');
    } finally {
      setLoading(false);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;
      const file = result.assets[0];
      setSelectedFile({ name: file.name, uri: file.uri, type: file.mimeType, size: file.size });
    } catch (error) {
      Alert.alert('Error', 'Could not select file.');
    }
  };

  const handleSubmit = async () => {
    if (!companyName.trim()) { Alert. alert('Error', 'Company name is required'); return; }

    setUploading(true);
    try {
      let fileUrl = null;

      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `coi/${subcontractor.id}/${Date.now()}.${fileExt}`;
        let contentType = 'application/pdf';
        if (fileExt.toLowerCase() === 'jpg' || fileExt.toLowerCase() === 'jpeg') contentType = 'image/jpeg';
        else if (fileExt.toLowerCase() === 'png') contentType = 'image/png';

        const response = await fetch(selectedFile.uri);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('coi-files')
          .upload(fileName, uint8Array, { contentType, upsert: false });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('coi-files').getPublicUrl(fileName);
          fileUrl = publicUrl;
        }
      }

      await supabase
        .from('subcontractors')
        .update({
          company_name: companyName,
          fein: fein || null,
          carrier_name: carrierName || null,
          policy_number: policyNumber || null,
          contact_name: contactName || null,
          email: contactEmail || null,
          coi_url: fileUrl,
          verification_status: 'PENDING_REVIEW',
          submitted_at: new Date().toISOString()
        })
        .eq('id', subcontractor.id);

      Alert.alert('✅ Success!', 'Your information has been submitted for verification.', [
        { text: 'OK', onPress: () => router.replace('/') }
      ]);

    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to submit.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#d69e2e" />
      <Text style={styles.loadingText}>Verifying...</Text>
    </View>
  );

  if (!subcontractor) return (
    <View style={styles.container}>
      <Text style={styles.errorText}>Invalid verification link</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.logoText}>🛡️ CoverageGuard</Text>
        <Text style={styles.headerTitle}>Verify Your Coverage</Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>Please provide your workers' compensation insurance information. This typically takes 2-3 minutes.</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Company Name *</Text>
        <TextInput style={styles.input} placeholder="Your company name" placeholderTextColor="#999" value={companyName} onChangeText={setCompanyName} />

        <Text style={styles.label}>FEIN (Federal EIN)</Text>
        <TextInput style={styles.input} placeholder="XX-XXXXXXX" placeholderTextColor="#999" value={fein} onChangeText={setFein} keyboardType="numeric" />

        <Text style={styles.label}>Insurance Carrier</Text>
        <TextInput style={styles.input} placeholder="e.g., Hartford, Liberty Mutual" placeholderTextColor="#999" value={carrierName} onChangeText={setCarrierName} />

        <Text style={styles.label}>Policy Number</Text>
        <TextInput style={styles.input} placeholder="Policy number" placeholderTextColor="#999" value={policyNumber} onChangeText={setPolicyNumber} />

        <Text style={styles.label}>Contact Name</Text>
        <TextInput style={styles.input} placeholder="Your name" placeholderTextColor="#999" value={contactName} onChangeText={setContactName} />

        <Text style={styles.label}>Contact Email</Text>
        <TextInput style={styles.input} placeholder="your@email.com" placeholderTextColor="#999" value={contactEmail} onChangeText={setContactEmail} keyboardType="email-address" autoCapitalize="none" />

        <View style={styles.uploadSection}>
          <Text style={styles.label}>Upload COI (Certificate of Insurance) *</Text>
          <TouchableOpacity style={styles.uploadButton} onPress={pickDocument}>
            <Text style={styles.uploadButtonText}>📷 Select File</Text>
          </TouchableOpacity>
          {selectedFile && (
            <View style={styles.fileSelected}>
              <Text style={styles.fileName}>✓ {selectedFile.name}</Text>
              <TouchableOpacity onPress={pickDocument}><Text style={styles.changeFile}>Change</Text></TouchableOpacity>
            </View>
          )}
          <Text style={styles.uploadHint}>PDF, JPG, or PNG up to 10MB</Text>
        </View>

        <TouchableOpacity style={[styles.submitButton, uploading && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={uploading}>
          {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Submit for Verification</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7fafc' },
  content: { padding: 20, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7fafc' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#666' },
  errorText: { fontSize: 18, color: '#e53e3e', textAlign: 'center', marginTop: 100 },
  header: { alignItems: 'center', marginBottom: 20, paddingTop: 50 },
  logoText: { fontSize: 32, marginBottom: 8 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1a365d' },
  infoBox: { backgroundColor: '#ebf8ff', padding: 16, borderRadius: 12, marginBottom: 20 },
  infoText: { fontSize: 14, color: '#2b6cb0', lineHeight: 20 },
  form: { backgroundColor: '#fff', padding: 20, borderRadius: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#4a5568', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#f7fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, fontSize: 16, color: '#1a365d' },
  uploadSection: { marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  uploadButton: { backgroundColor: '#007AFF', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  uploadButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  fileSelected: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#c6f6d5', padding: 12, borderRadius: 8, marginTop: 12 },
  fileName: { fontSize: 14, fontWeight: '600', color: '#276749' },
  changeFile: { fontSize: 14, color: '#007AFF', fontWeight: '600' },
  uploadHint: { fontSize: 12, color: '#718096', marginTop: 8 },
  submitButton: { backgroundColor: '#d69e2e', padding: 18, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  submitButtonDisabled: { backgroundColor: '#ccc' },
  submitButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});