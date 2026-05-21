// Client Portal - Public Verify Screen
// Subcontractor clicks this from the email link to upload their COI

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
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
  const [submitted, setSubmitted] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [fein, setFein] = useState('');
  const [carrierName, setCarrierName] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  // ----- NEW: PEO fields -------------------------------------------------
  const [usesPEO, setUsesPEO] = useState(false);
  const [peoName, setPeoName] = useState('');

  // ----- NEW: Intended Workers ------------------------------------------
  const [workers, setWorkers] = useState([]);

  // Temp fields for adding a new worker
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newWorkerTrade, setNewWorkerTrade] = useState('');
  const [newWorkerProject, setNewWorkerProject] = useState('');
  const [newWorkerStart, setNewWorkerStart] = useState('');
  const [newWorkerEnd, setNewWorkerEnd] = useState('');

  // -----------------------------------------------------------------------
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
          { text: 'OK', onPress: () => router.replace('/') },
        ]);
        return;
      }

      setSubcontractor(data);
      setCompanyName(data.company_name || '');
      setContactEmail(data.email || '');
      // pre‑fill PEO info if it already exists
      setUsesPEO(!!data.has_peo);
      setPeoName(data.peo_name || '');
    } catch (e) {
      console.error('Error:', e);
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
      setSelectedFile({
        name: file.name,
        uri: file.uri,
        type: file.mimeType,
        size: file.size,
      });
    } catch (e) {
      Alert.alert('Error', 'Could not select file.');
    }
  };

  // ----- NEW: add a worker to the local array ----------------------------
  const addWorker = () => {
    if (!newWorkerName.trim()) {
      Alert.alert('Error', 'Worker name is required');
      return;
    }
    if (!newWorkerTrade.trim()) {
      Alert.alert('Error', 'Trade/role is required');
      return;
    }
    if (!newWorkerProject.trim()) {
      Alert.alert('Error', 'Project name is required');
      return;
    }
    if (!newWorkerStart.trim() || !newWorkerEnd.trim()) {
      Alert.alert('Error', 'Both start and end dates are required');
      return;
    }

    const worker = {
      name: newWorkerName.trim(),
      trade: newWorkerTrade.trim(),
      project: newWorkerProject.trim(),
      start_date: newWorkerStart.trim(),
      end_date: newWorkerEnd.trim(),
    };

    setWorkers([...workers, worker]);

    // clear the temporary fields
    setNewWorkerName('');
    setNewWorkerTrade('');
    setNewWorkerProject('');
    setNewWorkerStart('');
    setNewWorkerEnd('');
  };

  const removeWorker = (index) => {
    const copy = [...workers];
    copy.splice(index, 1);
    setWorkers(copy);
  };

  // -----------------------------------------------------------------------
  const handleSubmit = async () => {
    // ----- basic validation ------------------------------------------------
    if (!companyName.trim()) {
      Alert.alert('Error', 'Company name is required');
      return;
    }
    if (!selectedFile) {
      Alert.alert('Error', 'Please upload your COI file');
      return;
    }

    setUploading(true);
    try {
      // ----- upload COI ----------------------------------------------------
      let fileUrl = null;
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `coi/${subcontractor.id}/${Date.now()}.${fileExt}`;
        let contentType = 'application/pdf';
        if (['jpg', 'jpeg'].includes(fileExt.toLowerCase())) contentType = 'image/jpeg';
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

      // ----- update subcontractor with COI + PEO info ----------------------
      const { error: subError } = await supabase
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
          has_peo: usesPEO,
          peo_name: usesPEO ? peoName : null,
          submitted_at: new Date().toISOString(),
        })
        .eq('id', subcontractor.id);

      if (subError) throw subError;

      // ----- insert intended workers (if any) -----------------------------
      if (workers.length > 0) {
        const workerRows = workers.map((w) => ({
          subcontractor_id: subcontractor.id,
          worker_name: w.name,
          trade: w.trade,
          project_name: w.project,
          start_date: w.start_date,
          end_date: w.end_date,
          verification_status: 'pending',
        }));

        const { error: workersError } = await supabase
          .from('intended_workers')
          .insert(workerRows);

        if (workersError) {
          console.error('Intended workers insert error:', workersError);
          // we don't abort the whole submission – just log
        }
        // If we got here, workers (if any) have been inserted
  }   // <-- closes the “if (workers.length > 0)” block

  // ----- finish up --------------------------------------------------------
  setSubmitted(true);
  Alert.alert('✅ Success!', 'Your information has been submitted for verification.', [
    { text: 'OK', onPress: () => router.replace('/') },
  ]);
} catch (error) {
  console.error('Error:', error);
  Alert.alert('Error', 'Failed to submit.');
} finally {
  setUploading(false);
}
}; // <-- end of handleSubmit

// -------------------------------------------------------------------------
if (loading) {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#d69e2e" />
      <Text style={styles.loadingText}>Verifying...</Text>
    </View>
  );
}

if (!subcontractor) {
  return (
    <View style={styles.container}>
      <Text style={styles.errorText}>Invalid verification link</Text>
    </View>
  );
}

// Success state -----------------------------------------------------------
if (submitted) {
  return (
    <View style={styles.container}>
      <View style={styles.successBox}>
        <Text style={styles.successIcon}>✅</Text>
        <Text style={styles.successTitle}>Verification Submitted!</Text>
        <Text style={styles.successText}>
          Your information has been submitted for review. You will be notified once your coverage has been verified.
        </Text>
      </View>
    </View>
  );
}

// Main form ---------------------------------------------------------------
return (
  <ScrollView style={styles.container} contentContainerStyle={styles.content}>
    {/* …the rest of your JSX (header, info box, core fields, PEO toggle,
          intended‑workers UI, COI upload, submit button) … */}
  </ScrollView>
);
} // <-- end of VerifyScreen component