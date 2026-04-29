// Client Portal - Reports Screen

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Alert } from 'react-native';
import { useRouter } from 'expo-router';

const demoSubcontractors = [
 { id: '1', name: 'ABC Framing LLC', status: 'verified', lastVerified: '2024-04-25', blocked: false },
 { id: '2', name: 'XYZ Drywall Inc', status: 'pending', lastVerified: null, blocked: false },
 { id: '3', name: '123 Electric Co', status: 'issue', lastVerified: '2024-04-24', blocked: false },
 { id: '4', name: 'SafeWay Painting', status: 'pending', lastVerified: null, blocked: false },
];

const demoReports = [
 {
 id: '1',
 date: '2024-04-20',
 projectName: 'Downtown Office Building',
 clientName: 'ABC Construction',
 subcontractors: [
 { name: 'XYZ Electric Inc', fein: '12-3456789', carrier: 'Liberty Mutual', naic: '12345', status: 'verified', effectiveDate: '2024-01-01' },
 { name: 'Quick Plumbing Co', fein: '23-4567890', carrier: 'State Farm', naic: '54321', status: 'expired', effectiveDate: '2023-06-01' },
 ]
 },
 {
 id: '2',
 date: '2024-04-18',
 projectName: 'Shopping Center Renovation',
 clientName: 'XYZ Developers',
 subcontractors: [
 { name: 'Elite HVAC', fein: '45-6789012', carrier: 'Hartford', naic: '11111', status: 'verified', effectiveDate: '2024-02-01' },
 ]
 }
];

export default function ReportsScreen() {
 const [selectedReport, setSelectedReport] = useState(null);
 const [subcontractors, setSubcontractors] = useState(demoSubcontractors);
 const router = useRouter();

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

 const getActionIcon = (status) => {
 switch (status) {
 case 'verified': return '📄';
 case 'pending': return '🔔';
 case 'issue': return '⚠️';
 default: return '📄';
 }
 };

 const toggleBlock = (subId) => {
 const sub = subcontractors.find(s => s.id === subId);
 if (sub.blocked) {
 Alert.alert(
 'Unblock Subcontractor',
 `Allow ${sub.name} on site?`,
 [
 { text: 'Cancel', style: 'cancel' },
 { text: 'Unblock', onPress: () => {
 setSubcontractors(subs => subs.map(s =>
 s.id === subId ? { ...s, blocked: false } : s
 ));
 }},
 ]
 );
 } else {
 Alert.alert(
 '🚫 Block Subcontractor',
 `Mark "${sub.name}" as Do Not Allow On Site?`,
 [
 { text: 'Cancel', style: 'cancel' },
 { text: 'Block', style: 'destructive', onPress: () => {
 setSubcontractors(subs => subs.map(s =>
 s.id === subId ? { ...s, blocked: true } : s
 ));
 }},
 ]
 );
 }
 };

 const handleAction = (sub) => {
 if (sub.status === 'pending') {
 Alert.alert(
 'Send Reminder',
 `Send a reminder to ${sub.name}?`,
 [
 { text: 'Cancel', style: 'cancel' },
 { text: 'Send', onPress: () => Alert.alert('Sent!', `Reminder sent to ${sub.name}`) },
 ]
 );
 } else if (sub.status === 'issue') {
 Alert.alert('Issue', `${sub.name} has a coverage issue that needs to be fixed.`);
 } else {
 Alert.alert('View Report', `Viewing report for ${sub.name}`);
 }
 };

 return (
 <View style={styles.container}>
 <View style={styles.header}>
 <TouchableOpacity onPress={() => router.back()}>
 <Text style={styles.backText}>‹ Back</Text>
 </TouchableOpacity>
 <Text style={styles.headerTitle}>Reports</Text>
 <View style={{ width: 40 }} />
 </View>

 <ScrollView style={styles.content}>
 <Text style={styles.sectionTitle}>Subcontractor Status</Text>
 <View style={styles.subListContainer}>
 <View style={styles.subListHeader}>
 <Text style={[styles.subHeaderText, { flex: 2 }]}>Subcontractor</Text>
 <Text style={[styles.subHeaderText, { flex: 1.3 }]}>Status</Text>
 <Text style={[styles.subHeaderText, { flex: 0.8, fontSize: 9 }]}>Actions</Text>
 </View>
 {subcontractors.map((sub) => (
 <View key={sub.id} style={[styles.subListRow, sub.blocked && styles.subListRowBlocked]}>
 <View style={{ flex: 2 }}>
 <Text style={[styles.subName, sub.blocked && styles.subNameBlocked]}>{sub.name}</Text>
 <Text style={styles.lastVerified}>
 {sub.lastVerified ? `Verified: ${sub.lastVerified}` : 'Awaiting verification'}
 </Text>
 {sub.blocked && <Text style={styles.blockedLabel}>🚫 Do Not Allow</Text>}
 </View>
 <View style={{ flex: 1.3 }}>
 <Text style={[styles.statusBadge, { color: getStatusColor(sub.status) }]}>
 {getStatusLabel(sub.status)}
 </Text>
 </View>
 <View style={{ flex: 0.7, flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
 <TouchableOpacity
 style={styles.actionBtn}
 onPress={() => handleAction(sub)}
 >
 <Text style={styles.actionIcon}>{getActionIcon(sub.status)}</Text>
 </TouchableOpacity>
 <TouchableOpacity
 style={[styles.blockBtn, sub.blocked && styles.blockBtnActive]}
 onPress={() => toggleBlock(sub.id)}
 >
 <Text style={styles.blockIcon}>{sub.blocked ? '🚫' : '🚫'}</Text>
 </TouchableOpacity>
 </View>
 </View>
 ))}
 </View>

 <View style={styles.divider} />

 <Text style={styles.sectionTitle}>Coverage Reports</Text>
 <Text style={styles.subtitle}>View your verification results</Text>

 {demoReports.map((report) => (
 <TouchableOpacity
 key={report.id}
 style={styles.reportCard}
 onPress={() => setSelectedReport(report)}
 >
 <View style={styles.reportHeader}>
 <View style={styles.logoCircle}>
 <Text style={styles.logoText}>CG</Text>
 </View>
 <View style={styles.reportInfo}>
 <Text style={styles.reportTitle}>Coverage Report</Text>
 <Text style={styles.reportDate}>{report.date}</Text>
 </View>
 </View>
 <Text style={styles.projectName}>{report.projectName}</Text>
 <Text style={styles.clientName}>{report.clientName}</Text>
 <Text style={styles.subCount}>
 {report.subcontractors.length} subcontractor{report.subcontractors.length !== 1 ? 's' : ''} verified
 </Text>
 </TouchableOpacity>
 ))}

 {demoReports.length === 0 && (
 <View style={styles.emptyState}>
 <Text style={styles.emptyText}>No reports yet</Text>
 <Text style={styles.emptySubtext}>Upload a COI to receive your first report</Text>
 </View>
 )}
 </ScrollView>

 <Modal visible={selectedReport !== null} animationType="slide">
 {selectedReport && (
 <View style={styles.modalContainer}>
 <View style={styles.modalHeader}>
 <TouchableOpacity onPress={() => setSelectedReport(null)}>
 <Text style={styles.closeBtn}>✕ Close</Text>
 </TouchableOpacity>
 </View>

 <ScrollView style={styles.modalContent}>
 <View style={styles.reportHeaderModal}>
 <View style={styles.logoCircle}>
 <Text style={styles.logoText}>CG</Text>
 </View>
 <Text style={styles.modalTitle}>COVERAGE REPORT</Text>
 <Text style={styles.modalDate}>{selectedReport.date}</Text>
 </View>

 <View style={styles.clientSection}>
 <Text style={styles.sectionLabel}>Client:</Text>
 <Text style={styles.sectionValue}>{selectedReport.clientName}</Text>
 <Text style={styles.sectionLabel}>Project:</Text>
 <Text style={styles.sectionValue}>{selectedReport.projectName}</Text>
 </View>

 <Text style={styles.tableTitle}>Submitted Subcontractors</Text>
 <View style={styles.table}>
 <View style={styles.tableHeader}>
 <Text style={[styles.tableHeaderText, { flex: 2 }]}>Name & FEIN</Text>
 <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>Carrier/NAIC</Text>
 <Text style={[styles.tableHeaderText, { flex: 1 }]}>Status</Text>
 </View>
 {selectedReport.subcontractors.map((sub, index) => (
 <View key={index} style={styles.tableRow}>
 <View style={{ flex: 2 }}>
 <Text style={styles.subName}>{sub.name}</Text>
 <Text style={styles.subFein}>FEIN: {sub.fein}</Text>
 </View>
 <View style={{ flex: 1.5 }}>
 <Text style={styles.carrierName}>{sub.carrier}</Text>
 <Text style={styles.naic}>NAIC: {sub.naic}</Text>
 </View>
 <View style={{ flex: 1 }}>
 <Text style={[styles.status, { color: getStatusColor(sub.status) }]}>
 {getStatusLabel(sub.status)}
 </Text>
 {sub.effectiveDate && (
 <Text style={styles.effectiveDate}>Eff: {sub.effectiveDate}</Text>
 )}
 </View>
 </View>
 ))}
 </View>

 <View style={styles.disclaimer}>
 <Text style={styles.disclaimerText}>
 The information contained in this report is intended to furnish users with general coverage information.
 The information contained in this report is provided by CoverageGuard for general guidance and is not
 intended to replace or serve to substitute any legal, audit, advisory, tax, insurance coverage, or
 other professional advice.
 </Text>
 </View>
 </ScrollView>
 </View>
 )}
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
 statusBadge: { fontSize: 11, fontWeight: '500' },
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
 clientName: { fontSize: 14, color: '#666', marginBottom: 8 },
 subCount: { fontSize: 12, color: '#007AFF' },
 emptyState: { alignItems: 'center', padding: 40 },
 emptyText: { fontSize: 16, color: '#666' },
 emptySubtext: { fontSize: 14, color: '#999', marginTop: 8 },
 modalContainer: { flex: 1, backgroundColor: '#fff' },
 modalHeader: { padding: 16, paddingTop: 50, backgroundColor: '#1a365d' },
 closeBtn: { color: '#fff', fontSize: 16 },
 modalContent: { flex: 1, padding: 20 },
 reportHeaderModal: { alignItems: 'center', marginBottom: 24 },
 modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#1a365d', marginTop: 12 },
 modalDate: { fontSize: 14, color: '#666', marginTop: 4 },
 clientSection: { marginBottom: 24 },
 sectionLabel: { fontSize: 12, color: '#666', marginTop: 8 },
 sectionValue: { fontSize: 16, fontWeight: '500', color: '#333' },
tableRow: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
 subFein: { fontSize: 11, color: '#666' },
 carrierName: { fontSize: 13, color: '#333' },
 naic: { fontSize: 11, color: '#666' },
 status: { fontSize: 12, fontWeight: '500' },
 effectiveDate: { fontSize: 10, color: '#666' },
 disclaimer: { marginTop: 24, padding: 16, backgroundColor: '#f7fafc', borderRadius: 8 },
 disclaimerText: { fontSize: 11, color: '#666', lineHeight: 16 },
});