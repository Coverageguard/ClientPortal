// Client Portal - Coverage Dashboard Screen

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://rumcdinmuiqhcakhuscs.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1bWNkaW5tdWlxaGNha2h1c2NzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4ODA0MDgsImV4cCI6MjA5MjQ1NjQwOH0.FhFwMISNZdc9b99RdhsGE8rcPB25KSa_1xKfYY8yE04');

export default function ReportsScreen() {
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedSub, setSelectedSub] = useState(null);
  const [subcontractors, setSubcontractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user && user.email) {
        const { data: clients } = await supabase
          .from('clients')
          .select('id')
          .filter('email', 'ilike', `%${user.email}%`);

        if (clients && clients.length > 0) {
          const clientIds = clients.map(c => c.id);
          
          const { data: projects } = await supabase
            .from('projects')
            .select('id')
            .in('client_id', clientIds);

          const projectIds = projects ? projects.map(p => p.id) : [];
          
          if (projectIds.length > 0) {
            const { data: subs } = await supabase
              .from('subcontractors')
              .select('*')
              .in('project_id', projectIds)
              .order('company_name', { ascending: true });

            const subIds = (subs || []).map(s => s.id);
            let workersMap = {};

            if (subIds.length > 0) {
              const { data: workers } = await supabase
                .from('intended_workers')
                .select('*')
                .in('subcontractor_id', subIds);

              workers?.forEach(w => {
                if (!workersMap[w.subcontractor_id]) workersMap[w.subcontractor_id] = [];
                workersMap[w.subcontractor_id].push(w);
              });
            }

            const transformed = (subs || []).map(sub => ({
              id: sub.id,
              name: sub.company_name || 'Unknown',
              status: sub.verification_status === 'VERIFIED' ? 'verified' : 
                      sub.verification_status === 'IN_PROGRESS' ? 'pending' : 'issue',
              verification_status: sub.verification_status,
              lastVerified: sub.updated_at ? sub.updated_at.split('T')[0] : null,
              blocked: false,
              intended_workers: workersMap[sub.id] || [],
              pEO_name: sub.pEO_name || null,
            }));

            setSubcontractors(transformed);
          }
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified': return '#22c55e';
      case 'pending': return '#d69e2e';
      case 'issue': return '#ef4444';
      default: return '#718096';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'verified': return '🟢 Verified';
      case 'pending': return '🟡 Pending';
      case 'issue': return '🔴 Issue';
      default: return status;
    }
  };

  const getStatusDotColor = (status) => {
    switch (status) {
      case 'verified': return '#22c55e';
      case 'pending': return '#d69e2e';
      case 'issue': return '#ef4444';
      default: return '#718096';
    }
  };

  const toggleBlock = (subId) => {
    const sub = subcontractors.find(s => s.id === subId);
    if (sub.blocked) {
      Alert.alert('Unblock', `Allow ${sub.name}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Unblock', onPress: () => setSubcontractors(subs => subs.map(s => s.id === subId ? { ...s, blocked: false } : s))},
      ]);
    } else {
      Alert.alert('Block', `Block ${sub.name}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Block', style: 'destructive', onPress: () => setSubcontractors(subs => subs.map(s => s.id === subId ? { ...s, blocked: true } : s))},
      ]);
    }
  };

  const handleAction = (sub) => {
    setSelectedSub(sub);
  };

  // Stats
  const verifiedCount = subcontractors.filter(s => s.status === 'verified').length;
  const pendingCount = subcontractors.filter(s => s.status === 'pending').length;
  const issueCount = subcontractors.filter(s => s.status === 'issue').length;
  const openIssues = subcontractors.filter(s => s.status === 'issue');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Coverage Dashboard</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Coverage Summary */}
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, { backgroundColor: '#22c55e' }]}>
            <Text style={styles.summaryNumber}>{verifiedCount}</Text>
            <Text style={styles.summaryLabel}>Verified</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#d69e2e' }]}>
            <Text style={styles.summaryNumber}>{pendingCount}</Text>
            <Text style={styles.summaryLabel}>Pending</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#ef4444' }]}>
            <Text style={styles.summaryNumber}>{issueCount}</Text>
            <Text style={styles.summaryLabel}>Issues</Text>
          </View>
        </View>

        {/* Open Issues */}
        {openIssues.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>⚠️ Open Issues</Text>
            {openIssues.map((sub) => (
              <View key={sub.id} style={styles.issueCard}>
                <View style={styles.issueHeader}>
                  <Text style={styles.issueIcon}>🔴</Text>
                  <Text style={styles.issueName}>{sub.name}</Text>
                </View>
                <Text style={styles.issueText}>Coverage needs attention</Text>
              </View>
            ))}
          </>
        )}

        <Text style={styles.sectionTitle}>Subcontractor Status</Text>
        <View style={styles.subListContainer}>
          <View style={styles.subListHeader}>
            <Text style={[styles.subHeaderText, { flex: 2 }]}>Subcontractor</Text>
            <Text style={[styles.subHeaderText, { flex: 1.3 }]}>Status</Text>
            <Text style={[styles.subHeaderText, { flex: 0.8, fontSize: 9 }]}>Actions</Text>
          </View>
          {loading ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: '#666' }}>Loading...</Text>
            </View>
          ) : subcontractors.length === 0 ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: '#666' }}>No subcontractors found</Text>
            </View>
          ) : (
            subcontractors.map((sub) => (
              <View key={sub.id} style={[styles.subListRow, sub.blocked && styles.subListRowBlocked]}>
                <View style={{ flex: 2 }}>
                  <Text style={[styles.subName, sub.blocked && styles.subNameBlocked]}>{sub.name}</Text>
                  <Text style={styles.lastVerified}>
                    {sub.lastVerified ? `Verified: ${sub.lastVerified}` : 'Awaiting verification'}
                  </Text>
{sub.blocked && <Text style={styles.blockedLabel}>🚫 Do Not Allow</Text>}
                </View>
                <View style={{ flex: 1.3 }}>
                  <View style={styles.statusBadge}>
                    <Text style={{ color: getStatusDotColor(sub.status), fontSize: 8 }}>●</Text>
                    <Text style={[styles.statusText, { color: getStatusDotColor(sub.status) }]}>
                      {getStatusLabel(sub.status)}
                    </Text>
                  </View>
                </View>
                <View style={{ flex: 0.7, flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleAction(sub)}>
                    <Text style={styles.actionIcon}>📄</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.blockBtn, sub.blocked && styles.blockBtnActive]} onPress={() => toggleBlock(sub.id)}>
                    <Text style={styles.blockIcon}>🚫</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Coverage Reports</Text>

{subcontractors.length > 0 ? (
  subcontractors.map((sub) => (
    <TouchableOpacity key={sub.id} style={styles.reportSubCard} onPress={() => handleAction(sub)}>
      <View style={styles.reportSubHeader}>
        <Text style={styles.reportSubName}>{sub.name}</Text>
        <Text style={[styles.reportSubStatusBadge, { color: getStatusColor(sub.status) }]}>
          {getStatusLabel(sub.status)}
        </Text>
      </View>
      <View style={styles.reportSubDetails}>
        <Text style={styles.reportSubDetail}>
          {sub.lastVerified ? `Verified: ${sub.lastVerified}` : 'Awaiting verification'}
        </Text>
        {sub.verification_status === 'VERIFIED' && (
          <Text style={styles.reportSubConfirm}>✓ Coverage Active</Text>
        )}
      </View>
    </TouchableOpacity>
  ))
) : (
  <Text style={styles.emptyText}>No reports</Text>
)}
      </ScrollView>

      {selectedSub && (
        <Modal visible={selectedSub !== null} animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setSelectedSub(null)}>
                <Text style={styles.closeBtn}>✕ Close</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              <Text style={styles.modalTitle}>{selectedSub.name}</Text>
              <Text style={styles.modalStatus}>{getStatusLabel(selectedSub.status)}</Text>
              <Text style={styles.modalDate}>
                {selectedSub.lastVerified ? `Last verified: ${selectedSub.lastVerified}` : 'Awaiting verification'}
              </Text>
            </ScrollView>
          </View>
        </Modal>
      )}

      {selectedReport && !selectedSub && (
        <Modal visible={selectedReport !== null && !selectedSub} animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setSelectedReport(null)}>
                <Text style={styles.closeBtn}>✕ Close</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              <Text style={styles.modalTitle}>Coverage Report</Text>
              <Text style={styles.modalDate}>{new Date().toLocaleDateString()}</Text>
              
              <Text style={[styles.sectionTitle, { marginTop: 20 }]}>All Subcontractors</Text>
              {selectedReport.map((sub) => (
                <View key={sub.id} style={styles.reportSubRow}>
                  <Text style={styles.reportSubName}>{sub.name}</Text>
                  <Text style={[styles.reportSubStatus, { color: getStatusColor(sub.status) }]}>
                    {getStatusLabel(sub.status)}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 50, backgroundColor: '#1a365d' },
  backText: { color: '#d69e2e', fontSize: 16, fontWeight: '600' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  content: { flex: 1, padding: 20 },
  summaryContainer: { flexDirection: 'row', marginBottom: 20, gap: 10 },
  summaryCard: { flex: 1, borderRadius: 12, padding: 16, alignItems: 'center' },
  summaryNumber: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  summaryLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  issueCard: { backgroundColor: '#fef2f2', borderRadius: 8, padding: 12, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#ef4444' },
  issueHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  issueIcon: { fontSize: 14, marginRight: 8 },
  issueName: { fontSize: 14, fontWeight: '600', color: '#1a365d' },
  issueText: { fontSize: 12, color: '#666', marginLeft: 22 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a365d', marginBottom: 8, marginTop: 16 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 16 },
  subListContainer: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', marginBottom: 20 },
  subListHeader: { flexDirection: 'row', backgroundColor: '#f7fafc', padding: 10, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  subHeaderText: { fontSize: 10, fontWeight: '600', color: '#666', textTransform: 'uppercase' },
  subListRow: { flexDirection: 'row', padding: 10, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  subListRowBlocked: { backgroundColor: '#fff5f5' },
  subName: { fontSize: 13, fontWeight: '500', color: '#333' },
  subNameBlocked: { color: '#e53e3e' },
  lastVerified: { fontSize: 10, color: '#999', marginTop: 2 },
  blockedLabel: { fontSize: 10, color: '#e53e3e', fontWeight: '600', marginTop: 4 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusText: { fontSize: 10, fontWeight: '600' },
  actionBtn: { padding: 4 },
  actionIcon: { fontSize: 18 },
  blockBtn: { padding: 4, opacity: 0.4 },
  blockBtnActive: { opacity: 1 },
  blockIcon: { fontSize: 16 },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 20 },
  reportCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  reportHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  logoCircle: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  logoText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  reportInfo: { flex: 1 },
  reportTitle: { fontSize: 16, fontWeight: '600', color: '#1a365d' },
  reportDate: { fontSize: 12, color: '#666' },
reportSubCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
reportSubHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
reportSubDetails: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
reportSubDetail: { fontSize: 12, color: '#666' },
reportSubConfirm: { fontSize: 11, color: '#22c55e', fontWeight: '600' },
  projectName: { fontSize: 14, fontWeight: '500', color: '#333', marginBottom: 4 },
  subCount: { fontSize: 12, color: '#007AFF' },
  tapHint: { fontSize: 11, color: '#007AFF', marginTop: 8 },
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { padding: 16, paddingTop: 50, backgroundColor: '#1a365d' },
  modalContent: { flex: 1, padding: 20 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#1a365d' },
  modalStatus: { fontSize: 16, marginTop: 8 },
  modalDate: { fontSize: 14, color: '#666', marginTop: 4 },
  closeBtn: { color: '#fff', fontSize: 16 },
  reportSubRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  reportSubName: { fontSize: 14, fontWeight: '500' },
  reportSubStatus: { fontSize: 12, fontWeight: '600' },
});