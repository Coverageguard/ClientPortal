// Client Portal - Business Info Screen (Step 3)
// Collects: Business name, FEIN, business type, contact info

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';

const BusinessInfoScreen = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    companyName: '',
    fein: '',
    businessType: '',
    contactName: '',
    email: '',
    phone: '',
  });
  const [errors, setErrors] = useState({});

  const businessTypes = ['Corporation', 'LLC', 'Sole Proprietor', 'Partnership'];

  const validate = () => {
    const newErrors = {};
    if (!formData.companyName.trim()) newErrors.companyName = 'Business name is required';
    if (!formData.fein.trim()) newErrors.fein = 'FEIN is required';
    if (!formData.businessType) newErrors.businessType = 'Select a business type';
    if (!formData.contactName.trim()) newErrors.contactName = 'Contact name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      router.push({ pathname: '/coverage-type', params: formData });
    }
  };

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) setErrors({ ...errors, [field]: null });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Business Information</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.stepIndicator}>Step 3 of 8</Text>
        <Text style={styles.subtitle}>Tell us about your business</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Legal Business Name *</Text>
          <TextInput
            style={[styles.input, errors.companyName && styles.inputError]}
            value={formData.companyName}
            onChangeText={(v) => updateField('companyName', v)}
            placeholder="ABC Construction LLC"
            placeholderTextColor="#999"
          />
          {errors.companyName && <Text style={styles.errorText}>{errors.companyName}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>FEIN (Federal EIN) *</Text>
          <TextInput
            style={[styles.input, errors.fein && styles.inputError]}
            value={formData.fein}
            onChangeText={(v) => updateField('fein', v)}
            placeholder="12-3456789"
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
          <Text style={styles.hint}>Or SSN if sole proprietor</Text>
          {errors.fein && <Text style={styles.errorText}>{errors.fein}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Business Type *</Text>
          <View style={styles.typeGrid}>
            {businessTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.typeButton, formData.businessType === type && styles.typeButtonActive]}
                onPress={() => updateField('businessType', type)}
              >
                <Text style={[styles.typeButtonText, formData.businessType === type && styles.typeButtonTextActive]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.businessType && <Text style={styles.errorText}>{errors.businessType}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Contact Name *</Text>
          <TextInput
            style={[styles.input, errors.contactName && styles.inputError]}
            value={formData.contactName}
            onChangeText={(v) => updateField('contactName', v)}
            placeholder="John Smith"
            placeholderTextColor="#999"
          />
          {errors.contactName && <Text style={styles.errorText}>{errors.contactName}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            value={formData.email}
            onChangeText={(v) => updateField('email', v)}
            placeholder="john@abcconstruction.com"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone *</Text>
          <TextInput
            style={[styles.input, errors.phone && styles.inputError]}
            value={formData.phone}
            onChangeText={(v) => updateField('phone', v)}
            placeholder="(555) 123-4567"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
          />
          {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>Continue</Text>
        </TouchableOpacity>
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
  stepIndicator: { color: '#d69e2e', fontWeight: '600', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 24 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#1a365d', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 14, fontSize: 16, color: '#1a365d' },
  inputError: { borderColor: '#e53e3e' },
  errorText: { color: '#e53e3e', fontSize: 12, marginTop: 4 },
  hint: { fontSize: 12, color: '#718096', marginTop: 4 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  typeButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff' },
  typeButtonActive: { backgroundColor: '#1a365d', borderColor: '#1a365d' },
  typeButtonText: { color: '#4a5568', fontSize: 14 },
  typeButtonTextActive: { color: '#fff' },
  nextButton: { backgroundColor: '#d69e2e', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 20, marginBottom: 40 },
  nextButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default BusinessInfoScreen;