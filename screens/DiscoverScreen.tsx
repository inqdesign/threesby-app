import React from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'

const { width: screenWidth } = Dimensions.get('window')

const picks = [
  { id: '1', title: 'Figma', description: 'Design tool', category: 'Tools', rank: 1 },
  { id: '2', title: 'Linear', description: 'Issue tracking', category: 'Tools', rank: 2 },
  { id: '3', title: 'Notion', description: 'All-in-one workspace', category: 'Productivity', rank: 3 },
  { id: '4', title: 'Arc Browser', description: 'Better browser', category: 'Tools', rank: 4 },
]

export default function DiscoverScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
        <TouchableOpacity>
          <Ionicons name="search" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔥 Featured Picks</Text>
        </View>

        {picks.map((pick) => (
          <TouchableOpacity key={pick.id} style={styles.pickCard}>
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>#{pick.rank}</Text>
            </View>
            <View style={styles.pickContent}>
              <Text style={styles.pickTitle}>{pick.title}</Text>
              <Text style={styles.pickDescription}>{pick.description}</Text>
              <Text style={styles.pickCategory}>{pick.category}</Text>
            </View>
            <TouchableOpacity style={styles.heartButton}>
              <Ionicons name="heart-outline" size={24} color="#999" />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  pickCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  rankBadge: {
    backgroundColor: '#007AFF',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  pickContent: {
    flex: 1,
  },
  pickTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  pickDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  pickCategory: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  heartButton: {
    padding: 8,
  },
}) 