// Client Portal - Messages Screen

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';

const demoMessages = [
  { id: '1', from: 'CoverageGuard', message: 'Your COI verification is complete.', time: '2 hours ago' },
  { id: '2', from: 'CoverageGuard', message: 'New report available for Downtown Office Building.', time: 'Yesterday' },
];

export default function MessagesScreen() {
  const router = useRouter();
  const [newMessage, setNewMessage] = useState('');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {demoMessages.map((msg) => (
          <View key={msg.id} style={styles.messageCard}>
            <View style={styles.messageHeader}>
              <Text style={styles.fromText}>{msg.from}</Text>
              <Text style={styles.timeText}>{msg.time}</Text>
            </View>
            <Text style={styles.messageText}>{msg.message}</Text>
          </View>
        ))}

        {demoMessages.length === 0 && (
          <Text style={styles.emptyText}>No messages yet</Text>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={newMessage}
          onChangeText={setNewMessage}
        />
        <TouchableOpacity style={styles.sendButton}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 50, backgroundColor: '#1a365d' },
  backText: { color: '#d69e2e', fontSize: 16, fontWeight: '600' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  content: { flex: 1, padding: 16 },
  messageCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  messageHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  fromText: { fontSize: 14, fontWeight: '600', color: '#1a365d' },
  timeText: { fontSize: 12, color: '#666' },
  messageText: { fontSize: 14, color: '#333', lineHeight: 20 },
  emptyText: { textAlign: 'center', color: '#666', marginTop: 40 },
  inputContainer: { flexDirection: 'row', padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  input: { flex: 1, backgroundColor: '#f7fafc', borderRadius: 8, padding: 12, marginRight: 8 },
  sendButton: { backgroundColor: '#007AFF', borderRadius: 8, padding: 12, justifyContent: 'center' },
  sendText: { color: '#fff', fontWeight: '600' },
});