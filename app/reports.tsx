// Client Portal - Reports Screen

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../src/services/supabase';

export default function ReportsScreen() {
  const [selectedReport, setSelectedReport] = useState(null);
  const [subcontractors, setSubcontractors] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalWorkers, setModalWorkers] = useState({});
  const router = useRouter();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: clientData } = await supabase.from('clients').select('id, company_name').ilike('email', user.email).single();
      if (!clientData) { setLoading(false); return; }

      const { data: subs } = await supabase.from('subcontractors').select('id, company_name, fein, carrier_name, policy_number, verification_status, created_at, has_peo, peo_name, updated_at, submitted_at').eq('client_id', clientData.id).order('created_at', { ascending: false });

      if (subs) {
        setSubcontractors(subs.map(s => ({
          id: s.id, name: s.company_name, fein: s.fein, carrier: s.carrier_name, policy: s.policy_number,
          status: s.verification_status?.toLowerCase() || 'pending',
          lastVerified: s.verification_status === 'VERIFIED' ? (s.submitted_at || s.updated_at || s.created_at)?.split('T')[0] : null,
          blocked: false,
          has_peo: s.has_peo || false, peo_name: s.peo_name || null
        })));
      }

      const { data: projects } = await supabase.from('projects').select('id, project_name, client_id, created_at').eq('client_id', clientData.id).order('created_at', { ascending: false });

      if (projects && projects.length > 0) {
        const projectIds = projects.map(p => p.id);
        const { data: projectSubs } = await supabase.from('subcontractors').select('id, company_name, fein, carrier_name, policy_number, verification_status, project_id, has_peo').in('project_id', projectIds);

        const builtReports = projects.slice(0, 10).map(project => {
          const projectSubList = (projectSubs || []).filter(ps => ps.project_id === project.id);
          return {
            id: project.id,
            date: project.created_at ? project.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
            projectName: project.project_name,
            clientName: clientData.company_name,
            subcontractors: projectSubList.map(ps => ({
              id: ps.id,
              name: ps.company_name || 'Unknown', fein: ps.fein || 'N/A', carrier: ps.carrier_name || 'N/A',
              policy: ps.policy_number || 'N/A', status: ps.verification_status?.toLowerCase() || 'pending',
              has_peo: ps.has_peo || false
            }))
          };
        });
        setReports(builtReports);
      }
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  };

  const fetchReportWorkers = async (projectId) => {
    try {
      const { data: projectSubs } = await supabase.from('subcontractors').select('id').eq('project_id', projectId);
      if (!projectSubs?.length) return;
      const subIds = projectSubs.map(ps => ps.id);
      const { data: workers } = await supabase.from('intended_workers').select('*').in('subcontractor_id', subIds);
      const workersBySub = {};
      workers?.forEach(w => {
        if (!workersBySub[w.subcontractor_id]) workersBySub[w.subcontractor_id] = [];
        workersBySub[w.subcontractor_id].push(w);
      });
      setModalWorkers(workersBySub);
    } catch (e) { console.error(e); }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified': return '#38a169';
      case 'expired': return '#e53e3e';
      case 'peo': return '#d69e2e';
      case 'pending': return '#d69e2e';
      case 'issue': return '#e53e3e';
      default: return '#718096';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'verified': return '🟢 Verified';
      case 'expired': return '🔴 Expired';
      case 'peo': return '🟡 PEO';
      case 'pending': return '🟡 Pending';
      case 'issue': return '🔴 Issue';
      default: return status;
    }
  };

  const toggleBlock = (subId) => {
    const sub = subcontractors.find(s => s.id === subId);
    if (sub.blocked) {
      Alert.alert('Unblock', `Allow ${sub.name}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Unblock', onPress: () => setSubcontractors(subs => subs.map(s => s.id === subId ? { ...s, blocked: false } : s)) },
      ]);
    } else {
      Alert.alert('Block', `Block ${sub.name}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Block', style: 'destructive', onPress: () => setSubcontractors(subs => subs.map(s => s.id === subId ? { ...s, blocked: true } : s)) },
      ]);
    }
  };

  if (loading) return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#1a365d" />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.backText}>‹ Back</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Reports</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Subcontractor Status</Text>
        <View style={styles.subListContainer}>
          <View style={styles.subListHeader}>
            <Text style={[styles.subHeaderText, { flex: 2 }]}>Subcontractor</Text>
            <Text style={[styles.subHeaderText, { flex: 1.3, textAlign: 'center' }]}>Status</Text>
            <Text style={[styles.subHeaderText, { flex: 0.7, textAlign: 'center' }]}>Actions</Text>
          </View>
          {subcontractors.map((sub) => (
            <View key={sub.id} style={[styles.subListRow, sub.blocked && styles.subListRowBlocked]}>
              <View style={{ flex: 2 }}>
                <Text style={styles.subName}>{sub.name}</Text>
                <Text style={styles.lastVerified}>{sub.lastVerified ? `Verified: ${sub.lastVerified}` : 'Awaiting verification'}</Text>
                {sub.has_peo && <Text style={styles.peoLabel}>PEO: {sub.peo_name}</Text>}
              </View>
              <View style={{ flex: 1.3 }}>
                <Text style={[styles.statusBadge, { color: getStatusColor(sub.status) }]}>{getStatusLabel(sub.status)}</Text>
              </View>
              <View style={{ flex: 0.7, alignItems: 'center' }}>
                <TouchableOpacity onPress={() => toggleBlock(sub.id)}><Text style={styles.blockIcon}>🚫</Text></TouchableOpacity>
              </View>
            </View>
          ))}
          {subcontractors.length === 0 && <Text style={styles.emptyText}>No subcontractors</Text>}
        </View>
        <Text style={styles.helpText}>🚫 Tap to block a subcontractor from verifying on your projects</Text>

        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Coverage Reports</Text>

        {reports.map((report) => (
          <TouchableOpacity key={report.id} style={styles.reportCard} onPress={() => { setSelectedReport(report); fetchReportWorkers(report.id); }}>
            <Text style={styles.reportTitle}>{report.projectName}</Text>
            <Text style={styles.reportDate}>{report.date} - {report.subcontractors.length} subs</Text>
          </TouchableOpacity>
        ))}
        {reports.length === 0 && <Text style={styles.emptyText}>No reports</Text>}
      </ScrollView>
<Modal visible={selectedReport !== null} animationType="slide">
  <View style={styles.modalContainer}>
    <View style={styles.modalHeader}>
      <TouchableOpacity onPress={() => setSelectedReport(null)}><Text style={styles.closeBtn}>✕ Close</Text></TouchableOpacity>
    </View>
    <ScrollView style={styles.modalContent}>
      <Text style={styles.modalTitle}>COVERAGE REPORT</Text>
      <Text style={styles.modalDate}>{selectedReport?.date}</Text>
      <Text style={styles.projectName}>{selectedReport?.projectName}</Text>
      <Text style={styles.clientName}>{selectedReport?.clientName}</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={{ flex: 2 }}>Name</Text>
          <Text style={{ flex: 1.5 }}>Carrier</Text>
          <Text style={{ flex: 1 }}>Status</Text>
        </View>
        {selectedReport?.subcontractors.map((sub, i) => (
          <View key={i} style={styles.tableRow}>
            <View style={{ flex: 2 }}>
              <Text style={styles.subName}>{sub.name}</Text>
              {sub.has_peo && (
                <Text style={styles.peoWarning}>
                  ⚠️ PEO WARNING: Insurance carriers for subcontractors using a PEO can deny claims if no payroll was reported for the day of the accident. Coverage changes weekly - verify covered employees weekly. If this subcontractor sub-contracts to an uninsured company, your company could be liable for injuries of those sub-sub-contractors.
                </Text>
              )}
              <Text style={styles.subFein}>FEIN: {sub.fein}</Text>
              <Text style={{fontSize: 10, color: '#d69e2e', marginTop: 4}}>
                {modalWorkers[sub.id]?.map(w => w.full_name).join(', ') || ''}
              </Text>
            </View>
            <View style={{ flex: 1.5 }}><Text>{sub.carrier}</Text><Text style={styles.naic}>Pol: {sub.policy}</Text></View>
            <View style={{ flex: 1 }}><Text style={{ color: getStatusColor(sub.status) }}>{getStatusLabel(sub.status)}</Text></View>
          </View>
        ))}
      </View>
    </ScrollView>
  </View>
</Modal>
</View>
);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 50, backgroundColor: '#1a365d' },
  backText: { color: '#d69e2e', fontSize: 16, fontWeight: '600' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  content: { flex: 1, padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a365d', marginBottom: 8 },
  subListContainer: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', marginBottom: 20 },
  subListHeader: { flexDirection: 'row', backgroundColor: '#f7fafc', padding: 10, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  subHeaderText: { fontSize: 10, fontWeight: '600', color: '#666', textTransform: 'uppercase' },
  subListRow: { flexDirection: 'row', padding: 10, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  subListRowBlocked: { backgroundColor: '#fff5f5' },
  subName: { fontSize: 13, fontWeight: '500', color: '#333' },
  lastVerified: { fontSize: 10, color: '#999', marginTop: 2 },
  peoLabel: { fontSize: 10, color: '#d69e2e', marginTop: 2 },
  statusBadge: { fontSize: 11, fontWeight: '500' },
  blockIcon: { fontSize: 16 },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 20 },
  reportCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  reportTitle: { fontSize: 16, fontWeight: '600', color: '#1a365d' },
  reportDate: { fontSize: 12, color: '#666', marginTop: 4 },
  emptyText: { textAlign: 'center', color: '#666', padding: 20 },
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { padding: 16, paddingTop: 50, backgroundColor: '#1a365d' },
  closeBtn: { color: '#fff', fontSize: 16 },
  modalContent: { flex: 1, padding: 20 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#1a365d' },
  modalDate: { fontSize: 14, color: '#666' },
  projectName: { fontSize: 16, fontWeight: '500', marginTop: 16 },
  clientName: { fontSize: 14, color: '#666', marginBottom: 16 },
  table: { backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f7fafc', padding: 10, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tableRow: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  subFein: { fontSize: 11, color: '#666' },
  naic: { fontSize: 11, color: '#666' },
  helpText: { fontSize: 11, color: '#666', textAlign: 'center', marginTop: -10, marginBottom: 20 },
  peoWarning: { fontSize: 9, color: '#c53030', fontWeight: '600', marginTop: 2, lineHeight: 11 },
});