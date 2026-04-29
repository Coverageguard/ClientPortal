// Client Portal - Add Subcontractor Screen
// Gives GC 3 options to add a subcontractor

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/services/supabase';

const AddSubcontractorScreen = () => {
  const router = useRouter();
  
  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [subName, setSubName] = useState('');
  const [subEmail, setSubEmail] = useState('');
  const [subPhone, setSubPhone] = useState('');
  const [sending, setSending] = useState(false);

  const handleGCUpload = () => {
    router.push('/upload');
  };

  const handleSendLink = () => {
    setModalVisible(true);
  };

  const handleAssisted = () => {
    alert('Request submitted! Our team will contact the subcontractor. (Coming soon)');
  };

  const handleSendInvite = async () => {
    if (!subName.trim()) {
      Alert.alert('Error', 'Company name is required');
      return;
    }
    if (!subEmail.trim() && !subPhone.trim()) {
      Alert.alert('Error', 'Email or phone number is required');
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
          verification_status: 'MANUAL_REVIEW',
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Insert error:', insertError);
      }

      if (subEmail.trim()) {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 're_fYuNLDCZ_EurUkJNxMmJ5xK9pX34qDz71'
          },
          body: JSON.stringify({
            from: 'CoverageGuard <onboarding@resend.dev>',
            to: subEmail,
            subject: "Worker's Compensation Verification Required - " + subName,
            html: '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;"><h2 style="color: #1a365d;">Workers Compensation Verification Required</h2><p>Hello,</p><p><strong>' + subName + '</strong> is requiring workers compensation verification.</p><p>Please complete your verification by clicking the link below:</p><p style="margin: 24px 0;"><a href="' + link + '" style="background-color: #d69e2e; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block;">Complete Verification</a></p><p style="color: #718096; font-size: 14px;">This verification typically takes 2-3 minutes.</p><hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;"><p style="color: #718096; font-size: 12px;">CoverageGuard - Workers Compensation Verification<br>www.coverageguard.net</p></div>'
          })
        });

        if (response.ok) {
          Alert.alert('Success', 'Invite sent to ' + subName + '!\n\nThey will receive an email with a link to upload their COI.');
        } else {
          Alert.alert('Link Generated', 'Invite link: ' + link + '\n\nPlease copy and send manually.');
        }
      } else if (subPhone.trim()) {
        Alert.alert('Link Generated', 'SMS coming soon!\n\nLink: ' + link);
      }

      setSubName('');
      setSubEmail('');
      setSubPhone('');
      setModalVisible(false);

    } catch (error) {
      console.error('Error sending invite:', error);
      Alert.alert('Error', 'Failed to send invite. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Subcontractor</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>Choose how to add a subcontractor</Text>

        <TouchableOpacity style={styles.optionCard} onPress={handleGCUpload}>
          <View style={styles.optionIcon}>
            <Text style={styles.iconText}>📤</Text>
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Upload COI Yourself</Text>
            <Text style={styles.optionDesc}>If you already have the certificate of insurance, upload it here directly.</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionCard} onPress={handleSendLink}>
          <View style={styles.optionIcon}>
            <Text style={styles.iconText}>📱</Text>
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Send Link to Subcontractor</Text>
            <Text style={styles.optionDesc}>We'll send them a text/email with a link to upload their own info.</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionCard} onPress={handleAssisted}>
          <View style={styles.optionIcon}>
            <Text style={styles.iconText}>🤝</Text>
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>We'll Handle It</Text>
            <Text style={styles.optionDesc}>We'll call the subcontractor, get the info, and complete the verification for you.</Text>
            <Text style={styles.premiumBadge}>Premium Service</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <View style={styles.helpBox}>
          <Text style={styles.helpTitle}>Need help?</Text>
          <Text style={styles.helpText}>Most subcontractors complete this in 2-3 minutes. Option 2 typically gets the best response.</Text>
        </View>
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>📱 Send Invite</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Text style={styles.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.modalLabel}>Subcontractor Company Name *</Text>
              <TextInput style={styles.input} placeholder="Company name" placeholderTextColor="#999" value={subName} onChangeText={setSubName} />

              <Text style={styles.modalLabel}>Email Address</Text>
              <TextInput style={styles.input} placeholder="subcontractor@email.com" placeholderTextColor="#999" value={subEmail} onChangeText={setSubEmail} keyboardType="email-address" autoCapitalize="none" />

              <Text style={styles.modalLabel}>Phone Number (optional)</Text>
              <TextInput style={styles.input} placeholder="(555) 123-4567" placeholderTextColor="#999" value={subPhone} onChangeText={setSubPhone} keyboardType="phone-pad" />

              <TouchableOpacity style={[styles.sendBtn, sending && styles.sendBtnDisabled]} onPress={handleSendInvite} disabled={sending}>
                {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendBtnText}>📤 Send Invite Link</Text>}
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setSubName(''); setSubEmail(''); setSubPhone(''); setModalVisible(false); }}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
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
  premiumBadge: { fontSize: 11, color: '#d69e2e', fontWeight: '600', marginTop: 6, backgroundColor: '#fefcbf', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' },
  arrow: { fontSize: 24, color: '#cbd5e0', marginLeft: 8 },
  helpBox: { backgroundColor: '#ebf8ff', borderRadius: 12, padding: 16, marginTop: 20 },
  helpTitle: { fontSize: 14, fontWeight: '600', color: '#2b6cb0', marginBottom: 8 },
  helpText: { fontSize: 13, color: '#4a5568', lineHeight: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a365d' },
  closeBtn: { fontSize: 20, color: '#666' },
  modalLabel: { fontSize: 13, fontWeight: '600', color: '#4a5568', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#f7fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, fontSize: 15, color: '#1a365d' },
  sendBtn: { backgroundColor: '#d69e2e', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  sendBtnDisabled: { backgroundColor: '#ccc' },
  sendBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancelBtn: { padding: 16, alignItems: 'center', marginTop: 10 },
  cancelBtnText: { color: '#666', fontSize: 16 },
});

export default AddSubcontractorScreen;