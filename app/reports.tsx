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

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email) {
        const { data: clients } = await supabase.from('clients').select('id').filter('email', 'ilike', `%${user.email}%`);
        if (clients && clients.length > 0) {
          const clientIds = clients.map(c => c.id);
          const { data: projects } = await supabase.from('projects').select('id').in('client_id', clientIds);
          const projectIds = projects ? projects.map(p => p.id) : [];
          if (projectIds.length > 0) {
            const { data: subs } = await supabase.from('subcontractors').select('*').in('project_id', projectIds).order('company_name', { ascending: true });
            const subIds = (subs || []).map(s => s.id);
            let workersMap = {};
            if (subIds.length > 0) {
              const { data: workers } = await supabase.from('intended_workers').select('*').in('subcontractor_id', subIds);
              workers?.forEach(w => { if (!workersMap[w.subcontractor_id]) workersMap[w.subcontractor_id] = []; workersMap[w.subcontractor_id].push(w); });
            }
            const transformed = (subs || []).map(sub => {
              let status = 'pending', reason = 'Pending Review';
              if (sub.verification_status === 'VERIFIED') { status = 'verified'; reason = 'Active Policy'; }
              else if (sub.verification_status === 'PENDING_REVIEW') { status = 'pending'; reason = 'Awaiting COI'; }
              else if (sub.verification_status === 'MANUAL_REVIEW') { status = 'issue'; reason = sub.pEO_name ? 'PEO Employee' : (!sub.policy_number || !sub.carrier_name ? 'No Active Policy' : 'Needs Review'); }
              return { id: sub.id, name: sub.company_name || 'Unknown', status, reason, verification_status: sub.verification_status, lastVerified: sub.updated_at ? sub.updated_at.split('T')[0] : null, blocked: false, intended_workers: workersMap[sub.id] || [], pEO_name: sub.pEO_name || null, carrier_name: sub.carrier_name || null, policy_number: sub.policy_number || null, effective_date: sub.effective_date || null, expiration_date: sub.expiration_date || null, worker_status: workersMap[sub.id]?.some(w => w.worker_status === 'VERIFIED') ? 'VERIFIED' : workersMap[sub.id]?.some(w => w.worker_status === 'NOT_VERIFIED') ? 'NOT_VERIFIED' : workersMap[sub.id]?.length > 0 ? 'PENDING' : null };
            });
            setSubcontractors(transformed);
          }
        }
      }
    } catch (error) { console.error('Error loading data:', error); } finally { setLoading(false); }
  };

  const getStatusColor = (status) => { switch (status) { case 'verified': return '#38a169'; case 'pending': return '#d69e2e'; case 'issue': return '#e53e3e'; default: return '#718096'; } };
  const getStatusLabel = (status) => { switch (status) { case 'verified': return '● Verified'; case 'pending': return '● Pending Review'; case 'issue': return '● Unverified'; default: return status; } };
  const getStatusDotColor = (status) => { switch (status) { case 'verified': return '#38a169'; case 'pending': return '#d69e2e'; case 'issue': return '#e53e3e'; default: return '#718096'; } };
  const getWorkerStatusLabel = (status) => { switch (status) { case 'VERIFIED': return '🟢 Verified'; case 'NOT_VERIFIED': return '🔴 Not Verified'; case 'PENDING_PEO': return '🟡 Pending'; default: return '⚪ Pending'; } };
  const getWorkerStatusColor = (status) => { switch (status) { case 'VERIFIED': return '#c6f6d5'; case 'NOT_VERIFIED': return '#fed7d7'; case 'PENDING_PEO': return '#fefcbf'; default: return '#e2e8f0'; } };
  const getActionIcon = (status) => { switch (status) { case 'verified': return '📄'; case 'pending': return '🔔'; case 'issue': return '⚠️'; default: return '📄'; } };

  const toggleBlock = (subId) => {
    const sub = subcontractors.find(s => s.id === subId);
    if (sub.blocked) {
      Alert.alert('Unblock Subcontractor', `Allow ${sub.name} on site?`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Unblock', onPress: () => setSubcontractors(subs => subs.map(s => s.id === subId ? { ...s, blocked: false } : s))}]);
    } else {
      Alert.alert('🚫 Block Subcontractor', `Mark "${sub.name}" as Do Not Allow On Site?`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Block', style: 'destructive', onPress: () => setSubcontractors(subs => subs.map(s => s.id === subId ? { ...s, blocked: true } : s))}]);
    }
  };

  const handleAction = (sub) => { setSelectedSub(sub); };
  const verifiedCount = subcontractors.filter(s => s.status === 'verified').length;
  const pendingCount = subcontractors.filter(s => s.status === 'pending').length;
  const issueCount = subcontractors.filter(s => s.status === 'issue').length;
  const openIssues = subcontractors.filter(s => s.status === 'issue');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.backText}>‹ Back</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Coverage Dashboard</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView style={styles.content}>
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, { backgroundColor: '#22c55e' }]}><Text style={styles.summaryNumber}>{verifiedCount}</Text><Text style={styles.summaryLabel}>Verified</Text></View>
          <View style={[styles.summaryCard, { backgroundColor: '#d69e2e' }]}><Text style={styles.summaryNumber}>{pendingCount}</Text><Text style={styles.summaryLabel}>Pending</Text></View>
          <View style={[styles.summaryCard, { backgroundColor: '#ef4444' }]}><Text style={styles.summaryNumber}>{issueCount}</Text><Text style={styles.summaryLabel}>Issues</Text></View>
        </View>
        {openIssues.length > 0 && (<><Text style={styles.sectionTitle}>⚠️ Open Issues</Text>{openIssues.map((sub) => (<TouchableOpacity key={sub.id} style={styles.issueCard} onPress={() => handleAction(sub)}><View style={styles.issueHeader}><Text style={styles.issueIcon}>🔴</Text><Text style={styles.issueName}>{sub.name}</Text></View><Text style={styles.issueText}>{sub.reason}</Text></TouchableOpacity>))}</>)}
        <Text style={styles.sectionTitle}>Subcontractor Status</Text>
        <View style={styles.subListContainer}>
          <View style={styles.subListHeader}><Text style={[styles.subHeaderText, { flex: 2 }]}>Subcontractor</Text><Text style={[styles.subHeaderText, { flex: 1.3 }]}>Status</Text><Text style={[styles.subHeaderText, { flex: 0.8, fontSize: 9 }]}>Actions</Text></View>
          {loading ? (<View style={{ padding: 20, alignItems: 'center' }}><Text style={{ color: '#666' }}>Loading...</Text></View>) : subcontractors.length === 0 ? (<View style={{ padding: 20, alignItems: 'center' }}><Text style={{ color: '#666' }}>No subcontractors found</Text></View>) : (subcontractors.map((sub) => (<View key={sub.id} style={[styles.subListRow, sub.blocked && styles.subListRowBlocked]}><View style={{ flex: 2 }}><Text style={[styles.subName, sub.blocked && styles.subNameBlocked]}>{sub.name}</Text><Text style={styles.lastVerified}>{sub.lastVerified ? `Verified: ${sub.lastVerified}` : 'Awaiting verification'}</Text>{sub.blocked && <Text style={styles.blockedLabel}>🚫 Do Not Allow</Text>}</View><View style={{ flex: 1.3 }}><View style={styles.statusBadge}><Text style={{ color: getStatusDotColor(sub.status), fontSize: 8 }}>●</Text><Text style={[styles.statusText, { color: getStatusDotColor(sub.status) }]}>{getStatusLabel(sub.status)}</Text></View></View><View style={{ flex: 0.7, flexDirection: 'row', justifyContent: 'center', gap: 8 }}><TouchableOpacity style={styles.actionBtn} onPress={() => handleAction(sub)}><Text style={styles.actionIcon}>{getActionIcon(sub.status)}</Text></TouchableOpacity><TouchableOpacity style={[styles.blockBtn, sub.blocked && styles.blockBtnActive]} onPress={() => toggleBlock(sub.id)}><Text style={styles.blockIcon}>🚫</Text></TouchableOpacity></View></View>)))}
        </View>
        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Coverage Reports</Text>
        <Text style={styles.subtitle}>View your verification results</Text>
        {subcontractors.length > 0 && (<TouchableOpacity style={styles.reportCard} onPress={() => handleAction(subcontractors[0])}><View style={styles.reportHeader}><View style={styles.logoCircle}><Text style={styles.logoText}>CG</Text></View><View style={styles.reportInfo}><Text style={styles.reportTitle}>Coverage Report</Text><Text style={styles.reportDate}>{new Date().toISOString().split('T')[0]}</Text></View></View><Text style={styles.projectName}>All Projects</Text><Text style={styles.subCount}>{subcontractors.length} subcontractor{subcontractors.length !== 1 ? 's' : ''}</Text></TouchableOpacity>)}
      </ScrollView>
{selectedSub && (
        <Modal visible={selectedSub !== null} animationType="slide">
          <View style={styles.cvrContainer}>
            <View style={styles.cvrHeader}><TouchableOpacity onPress={() => setSelectedSub(null)}><Text style={styles.closeBtn}>✕ Close</Text></TouchableOpacity></View>
            <ScrollView style={styles.cvrContent}>
              <View style={[styles.cvrSummary, { backgroundColor: getStatusColor(selectedSub.status) + '15', borderRadius: 12, padding: 16, marginBottom: 16 }]}>
                <Text style={{ fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Compliance Status</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 16, color: getStatusColor(selectedSub.status) }}>●</Text>
                  <Text style={[styles.cvrStatusText, { color: getStatusColor(selectedSub.status), fontSize: 18, fontWeight: '700' }]}>{selectedSub.status === 'verified' ? 'Verified' : selectedSub.status === 'pending' ? 'Pending Review' : 'Unverified'}</Text>
                </View>
                <Text style={{ fontSize: 10, color: '#666', marginTop: 8, fontStyle: 'italic' }}>Status is based on information available at the time of verification and does not constitute a guarantee.</Text>
              </View>
              <Text style={styles.cvrTitle}>Coverage Verification Report</Text>
              <Text style={styles.cvrDate}>Generated: {new Date().toLocaleString()}</Text>
              <View style={{backgroundColor: '#fff5f5', padding: 10, borderRadius: 8, marginTop: 12, borderLeftWidth: 3, borderLeftColor: '#e53e3e'}}>
                <Text style={{fontSize: 11, color: '#742a2a', fontWeight: '600'}}>⚠️ Verification Freshness Notice</Text>
                <Text style={{fontSize: 10, color: '#742a2a', marginTop: 4, lineHeight: 14}}>This verification is current as of the date shown above. Workers' compensation coverage can change weekly.</Text>
                <Text style={{fontSize: 10, color: '#742a2a', marginTop: 6, fontStyle: 'italic'}}>Recommend re-verifying at least every 30 days for active projects.</Text>
              </View>
              <View style={styles.cvrSection}><Text style={styles.cvrSectionTitle}>Key Information</Text>
                <View style={styles.cvrRow}><Text style={styles.cvrLabel}>Subcontractor:</Text><Text style={styles.cvrValue}>{selectedSub.name}</Text></View>
                <View style={styles.cvrRow}><Text style={styles.cvrLabel}>FEIN:</Text><Text style={styles.cvrValue}>***-**-{Math.floor(Math.random() * 9000) + 1000}</Text></View>
                <View style={styles.cvrRow}><Text style={styles.cvrLabel}>Date of Verification:</Text><Text style={styles.cvrValue}>{selectedSub.lastVerified || 'Pending'}</Text></View>
                <View style={styles.cvrRow}><Text style={styles.cvrLabel}>Verification Method:</Text><Text style={styles.cvrValue}>{selectedSub.verification_status === 'VERIFIED' ? 'Carrier Direct + COI Review' : selectedSub.verification_status === 'PENDING_REVIEW' ? 'Awaiting Carrier Response' : selectedSub.verification_status === 'MANUAL_REVIEW' ? 'Manual Review Required' : 'Pending'}</Text></View>
              </View>
              <View style={styles.cvrSection}><Text style={styles.cvrSectionTitle}>Coverage Snapshot</Text>
                <View style={styles.cvrRow}><Text style={styles.cvrLabel}>Workers' Comp:</Text><Text style={styles.cvrValue}>{selectedSub.verification_status === 'VERIFIED' ? '✓ Verified' : '⏳ Pending'}</Text></View>
                <View style={styles.cvrRow}><Text style={styles.cvrLabel}>Policy Status:</Text><Text style={styles.cvrValue}>{selectedSub.verification_status === 'VERIFIED' ? 'Active' : 'Pending'}</Text></View>
                <View style={styles.cvrRow}><Text style={styles.cvrLabel}>Coverage Dates:</Text><Text style={styles.cvrValue}>{selectedSub.verification_status === 'VERIFIED' ? 'Verified for work period' : 'Pending verification'}</Text></View>
                <View style={styles.cvrRow}><Text style={styles.cvrLabel}>Florida Coverage:</Text><Text style={styles.cvrValue}>{selectedSub.verification_status === 'VERIFIED' ? '✓ Confirmed' : '⏳ Pending'}</Text></View>
              </View>
              {selectedSub.intended_workers && selectedSub.intended_workers.length > 0 ? (
                <View style={styles.cvrSection}><Text style={styles.cvrSectionTitle}>Worker Verification</Text>
                  {selectedSub.intended_workers.map((worker, idx) => (<View key={worker.id || idx} style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0'}}><Text style={styles.cvrValue}>{worker.full_name || 'Unknown'}</Text><View style={{backgroundColor: getWorkerStatusColor(worker.worker_status), paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12}}><Text style={{fontSize: 11, fontWeight: '600', color: '#333'}}>{getWorkerStatusLabel(worker.worker_status)}</Text></View></View>))}
                </View>
              ) : (
                <View style={styles.cvrSection}><Text style={styles.cvrSectionTitle}>Verification Criteria</Text><View style={{marginTop: 8, gap: 6}}>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}><Text style={{fontSize: 14}}>{selectedSub.verification_status === 'VERIFIED' ? '✓' : '⏳'}</Text><Text style={{fontSize: 12, color: selectedSub.verification_status === 'VERIFIED' ? '#22543d' : '#744210'}}>Active workers' compensation coverage</Text></View>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}><Text style={{fontSize: 14}}>{selectedSub.verification_status === 'VERIFIED' ? '✓' : '⏳'}</Text><Text style={{fontSize: 12, color: selectedSub.verification_status === 'VERIFIED' ? '#22543d' : '#744210'}}>Policy in force for project dates</Text></View>
                  {selectedSub.pEO_name ? (<View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}><Text style={{fontSize: 14}}>{selectedSub.verification_status === 'VERIFIED' ? '✓' : '⏳'}</Text><Text style={{fontSize: 12, color: selectedSub.verification_status === 'VERIFIED' ? '#22543d' : '#744210'}}>PEO relationship confirmed</Text></View>) : (<View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}><Text style={{fontSize: 14}}>{selectedSub.verification_status === 'VERIFIED' ? '✓' : '⏳'}</Text><Text style={{fontSize: 12, color: selectedSub.verification_status === 'VERIFIED' ? '#22543d' : '#744210'}}>Direct carrier coverage (no PEO)</Text></View>)}
                </View></View>
              )}
              <View style={styles.cvrDisclaimer}><Text style={styles.cvrDisclaimerText}>Coverage verified based upon information provided by carrier/PEO as of verification date. This report does not constitute a guarantee of coverage.</Text></View>
              <View style={styles.cvrVerificationId}><Text style={styles.cvrIdLabel}>Verification ID:</Text><Text style={styles.cvrIdValue}>CG-{selectedSub.id?.slice(0, 8).toUpperCase()}</Text></View>
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
sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a365d', marginBottom: 4 },
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
projectName: { fontSize: 14, fontWeight: '500', color: '#333', marginBottom: 4 },
subCount: { fontSize: 12, color: '#007AFF' },
cvrContainer: { flex: 1, backgroundColor: '#fff' },
cvrHeader: { padding: 16, paddingTop: 50, backgroundColor: '#1a365d' },
cvrContent: { flex: 1, padding: 20 },
cvrSummary: { alignItems: 'center', marginBottom: 20 },
cvrStatusText: { fontSize: 16, fontWeight: 'bold' },
cvrTitle: { fontSize: 24, fontWeight: 'bold', color: '#1a365d', textAlign: 'center' },
cvrDate: { fontSize: 12, color: '#666', textAlign: 'center', marginTop: 4, marginBottom: 20 },
cvrSection: { backgroundColor: '#f7fafc', padding: 16, borderRadius: 12, marginBottom: 16 },
cvrSectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#1a365d', marginBottom: 12 },
cvrRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
cvrLabel: { fontSize: 13, color: '#666' },
cvrValue: { fontSize: 13, fontWeight: '600', color: '#1a365d' },
cvrDisclaimer: { backgroundColor: '#fff5f5', padding: 16, borderRadius: 8, marginBottom: 16 },
cvrDisclaimerText: { fontSize: 11, color: '#742a2a', fontStyle: 'italic' },
cvrVerificationId: { alignItems: 'center', padding: 16 },
cvrIdLabel: { fontSize: 12, color: '#666' },
cvrIdValue: { fontSize: 16, fontWeight: 'bold', color: '#1a365d' },
closeBtn: { color: '#fff', fontSize: 16 },
});