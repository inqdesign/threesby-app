import React from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'

const mockCollections = [
  {
    id: '1',
    title: 'Design Tools 2024',
    description: 'Essential tools for modern designers',
    category: 'Design',
    picks_count: 12,
    curator: 'Design Team'
  },
  {
    id: '2',
    title: 'Productivity Stack',
    description: 'Apps that make you productive',
    category: 'Productivity', 
    picks_count: 8,
    curator: 'Sarah Chen'
  },
  {
    id: '3',
    title: 'Developer Tools',
    description: 'Essential tools for developers',
    category: 'Development',
    picks_count: 15,
    curator: 'Dev Team'
  }
]

export default function CollectionsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Collections</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse Collections</Text>
          <Text style={styles.sectionSubtitle}>Curated picks organized by topic</Text>
        </View>

        {mockCollections.map((collection) => (
          <TouchableOpacity key={collection.id} style={styles.collectionCard}>
            <View style={styles.collectionHeader}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{collection.category}</Text>
              </View>
            </View>
            
            <View style={styles.collectionContent}>
              <Text style={styles.collectionTitle}>{collection.title}</Text>
              <Text style={styles.collectionDescription}>{collection.description}</Text>
              
              <View style={styles.collectionFooter}>
                <Text style={styles.collectionMeta}>
                  {collection.picks_count} picks • by {collection.curator}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#999" />
              </View>
            </View>
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
  searchButton: {
    padding: 8,
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
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  collectionCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  collectionHeader: {
    padding: 16,
    paddingBottom: 8,
  },
  categoryBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  collectionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  collectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  collectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  collectionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  collectionMeta: {
    fontSize: 12,
    color: '#999',
  },
}) 