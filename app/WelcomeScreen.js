// Client Portal - Welcome Screen
// Entry point for subcontractor COI verification

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Modal
} from 'react-native';
import { useRouter } from 'expo-router';

const WelcomeScreen = () => {
  const router = useRouter();
  const [showWhyModal, setShowWhyModal] = useState(false);

  const handleStart = () => {
    // Navigate to business info screen
    router.push('/business-info');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoIcon}>🛡️</Text>
          </View>
        </View>

        {/* Main Title */}
        <Text style={styles.title}>Workers' Compensation</Text>
        <Text style={styles.titleHighlight}>Verification Required</Text>

        {/* Time Estimate */}
        <View style={styles.timeBox}>
          <Text style={styles.timeIcon}>⏱️</Text>
          <Text style={styles.timeText}>This process typically takes 2–3 minutes</Text>
        </View>

        {/* Start Button */}
        <TouchableOpacity style={styles.startButton} onPress={handleStart}>
          <Text style={styles.startButtonText}>Start Verification</Text>
        </TouchableOpacity>

        {/* Why Required Link */}
        <TouchableOpacity 
          style={styles.whyLink} 
          onPress={() => setShowWhyModal(true)}
        >
          <Text style={styles.whyLinkText}>Why is this required?</Text>
        </TouchableOpacity>

        {/* What You'll Need */}
        <View style={styles.checklist}>
          <Text style={styles.checklistTitle}>What you'll need:</Text>
          <View style={styles.checklistItem}>
            <Text style={styles.checkmark}>✓</Text>
            <Text style={styles.checklistText}>Your business information (FEIN, address)</Text>
          </View>
          <View style={styles.checklistItem}>
            <Text style={styles.checkmark}>✓</Text>
            <Text style={styles.checklistText}>Insurance policy details OR PEO information</Text>
          </View>
          <View style={styles.checklistItem}>
            <Text style={styles.checkmark}>✓</Text>
            <Text style={styles.checklistText}>Photo or PDF of your COI document</Text>
          </View>
        </View>
      </ScrollView>

      {/* Why Required Modal */}
      <Modal
        visible={showWhyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowWhyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Why is this required?</Text>
            
            <Text style={styles.modalText}>
              General contractors are required by law to verify that all subcontractors 
              have valid workers' compensation coverage.
            </Text>
            
            <Text style={styles.modalText}>
              If a subcontractor is injured on the job and lacks coverage, 
              the general contractor can be held liable for:
            </Text>
            
            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>• Medical expenses</Text>
              <Text style={styles.bulletItem}>• Lost wages</Text>
              <Text style={styles.bulletItem}>• Disability benefits</Text>
              <Text style={styles.bulletItem}>• Penalties and fines</Text>
              <Text style={styles.bulletItem}>• Lawsuits</Text>
            </View>

            <Text style={styles.modalText}>
              By verifying coverage upfront, everyone stays protected and compliant.
            </Text>

            <TouchableOpacity 
              style={styles.modalButton}
              onPress={() => setShowWhyModal(false)}
            >
              <Text style={styles.modalButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a365d' },
  content: { padding: 24, paddingTop: 60, alignItems: 'center' },
  logoContainer: { marginBottom: 24 },
  logoCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#d69e2e', alignItems: 'center', justifyContent: 'center' },
  logoIcon: { fontSize: 50 },
  title: { fontSize: 24, color: '#fff', textAlign: 'center', marginBottom: 4 },
  titleHighlight: { fontSize: 28, fontWeight: 'bold', color: '#d69e2e', textAlign: 'center', marginBottom: 32 },
  timeBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginBottom: 32 },
  timeIcon: { fontSize: 20, marginRight: 8 },
  timeText: { color: '#fff', fontSize: 16 },
  startButton: { backgroundColor: '#d69e2e', paddingHorizontal: 48, paddingVertical: 18, borderRadius: 12, marginBottom: 16, width: '100%', alignItems: 'center' },
  startButtonText: { color: '#1a365d', fontSize: 18, fontWeight: 'bold' },
  whyLink: { marginBottom: 40 },
  whyLinkText: { color: '#a0aec0', fontSize: 14, textDecorationLine: 'underline' },
  checklist: { backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '100%' },
  checklistTitle: { fontSize: 16, fontWeight: '600', color: '#1a365d', marginBottom: 16 },
  checklistItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  checkmark: { color: '#38a169', fontSize: 16, fontWeight: 'bold', marginRight: 12 },
  checklistText: { color: '#4a5568', fontSize: 14, flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#1a365d', marginBottom: 16, textAlign: 'center' },
  modalText: { fontSize: 15, color: '#4a5568', lineHeight: 22, marginBottom: 16 },
  bulletList: { marginLeft: 8, marginBottom: 16 },
  bulletItem: { fontSize: 14, color: '#4a5568', marginBottom: 8 },
  modalButton: { backgroundColor: '#1a365d', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  modalButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default WelcomeScreen;