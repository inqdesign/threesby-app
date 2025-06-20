import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Image,
  TouchableOpacity,
  StyleSheet
} from '../platform/native';
// import { useNavigation } from '../platform/native';
import { useAuth } from '../context/AuthContext.native';
// import { supabase } from '../lib/supabase';
import type { Pick } from '../types';
// import tw from '../lib/tailwind'; // Temporarily commented out

// Define Collection type until we update the types file
type Collection = {
  id: string;
  profile_id: string;
  title: string;
  description: string;
  categories: string[];
  picks: string[];
  cover_image?: string;
  font_color?: 'dark' | 'light';
  created_at: string;
  updated_at: string;
};

// Collection card component for native
const CollectionCard = ({ 
  collection, 
  onPress 
}: { 
  collection: Collection, 
  onPress: () => void 
}) => {
  const fontColor = collection.font_color === 'light' ? 'text-white' : 'text-[#252525]';
  
  return (
    <TouchableOpacity
      style={StyleSheet.flatten([
        { width: 125, height: 175, marginRight: 4, borderRadius: 12, overflow: 'hidden' },
        { backgroundColor: 'gray' }
      ])}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={StyleSheet.flatten([
        { position: 'relative', width: '100%', height: '100%' },
        { backgroundColor: 'gray' }
      ])}>
        {collection.cover_image ? (
          <Image
            source={{ uri: collection.cover_image }}
            style={StyleSheet.flatten([
              { width: '100%', height: '100%', position: 'absolute' },
              { backgroundColor: 'gray' }
            ])}
            resizeMode="cover"
          />
        ) : (
          <View style={StyleSheet.flatten([
            { width: '100%', height: '100%', backgroundColor: 'gray' },
            { backgroundColor: 'gray' }
          ])} />
        )}
        
        <View style={StyleSheet.flatten([
          { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 2 },
          { backgroundColor: 'gray' }
        ])}>
          <Text style={StyleSheet.flatten([
            { fontSize: 12, color: fontColor, fontFamily: 'mono' },
            { backgroundColor: 'gray' }
          ])}>
            Issue #{collection.id.substring(0, 4)}
          </Text>
          <Text style={StyleSheet.flatten([
            { fontSize: 16, fontWeight: 'bold', color: fontColor },
            { backgroundColor: 'gray' }
          ])} numberOfLines={2}>
            {collection.title}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Add new collection card
const AddCollectionCard = ({ onPress }: { onPress: () => void }) => {
  return (
    <TouchableOpacity
      style={StyleSheet.flatten([
        { width: 125, height: 175, marginRight: 4, borderRadius: 12, backgroundColor: 'gray', items: 'center', justifyContent: 'center' },
        { backgroundColor: 'gray' }
      ])}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={StyleSheet.flatten([
        { fontSize: 36, color: 'gray', fontWeight: 'bold' },
        { backgroundColor: 'gray' }
      ])}>+</Text>
      <Text style={StyleSheet.flatten([
        { marginTop: 2, fontSize: 14, color: 'gray', fontWeight: 'bold' },
        { backgroundColor: 'gray' }
      ])}>Add Collection</Text>
    </TouchableOpacity>
  );
};

// Pick card component for native
const PickCard = ({ 
  pick, 
  rank,
  onPress 
}: { 
  pick: Pick, 
  rank: number,
  onPress: () => void 
}) => {
  return (
    <TouchableOpacity
      style={StyleSheet.flatten([
        { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: 'white', borderRadius: 12, shadowColor: 'black', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
        { backgroundColor: 'white' }
      ])}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={StyleSheet.flatten([
        { position: 'relative', width: 64, height: 64, marginRight: 16, borderRadius: 16, overflow: 'hidden' },
        { backgroundColor: 'gray' }
      ])}>
        <Image
          source={{ uri: pick.image_url || 'https://via.placeholder.com/64' }}
          style={StyleSheet.flatten([
            { width: '100%', height: '100%' },
            { backgroundColor: 'gray' }
          ])}
          resizeMode="cover"
        />
        <View style={StyleSheet.flatten([
          { position: 'absolute', top: 0, right: 0, backgroundColor: '#ADFF8B', width: 20, height: 20, borderBottomLeftRadius: 10, items: 'center', justifyContent: 'center' },
          { backgroundColor: 'gray' }
        ])}>
          <Text style={StyleSheet.flatten([
            { fontSize: 12, fontWeight: 'bold', color: 'black' },
            { backgroundColor: 'gray' }
          ])}>{rank}</Text>
        </View>
      </View>
      
      <View style={StyleSheet.flatten([
        { flex: 1 },
        { backgroundColor: 'gray' }
      ])}>
        <Text style={StyleSheet.flatten([
          { fontWeight: 'bold', color: '#252525', marginBottom: 4 },
          { backgroundColor: 'gray' }
        ])} numberOfLines={1}>
          {pick.title}
        </Text>
        <Text style={StyleSheet.flatten([
          { color: '#585757', fontSize: 12 },
          { backgroundColor: 'gray' }
        ])} numberOfLines={2}>
          {pick.description}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// Add new pick card
const AddPickCard = ({ onPress }: { onPress: () => void }) => {
  return (
    <TouchableOpacity
      style={StyleSheet.flatten([
        { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: 'gray', borderRadius: 12 },
        { backgroundColor: 'gray' }
      ])}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={StyleSheet.flatten([
        { width: 64, height: 64, marginRight: 16, borderRadius: 16, backgroundColor: 'gray', items: 'center', justifyContent: 'center' },
        { backgroundColor: 'gray' }
      ])}>
        <Text style={StyleSheet.flatten([
          { fontSize: 24, color: 'gray', fontWeight: 'bold' },
          { backgroundColor: 'gray' }
        ])}>+</Text>
      </View>
      
      <View style={StyleSheet.flatten([
        { flex: 1 },
        { backgroundColor: 'gray' }
      ])}>
        <Text style={StyleSheet.flatten([
          { fontWeight: 'bold', color: '#252525', marginBottom: 4 },
          { backgroundColor: 'gray' }
        ])}>
          Add New Pick
        </Text>
        <Text style={StyleSheet.flatten([
          { color: '#585757', fontSize: 12 },
          { backgroundColor: 'gray' }
        ])}>
          Create a new pick to share with your followers
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export function MyThreesScreen() {
  const { user, profile } = useAuth();
  const [picks, setPicks] = useState<Pick[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  // Will be used when implementing navigation features
  // const navigation = useNavigation();
  
  useEffect(() => {
    async function fetchUserContent() {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        
        // Mock data for testing
        setTimeout(() => {
          const mockPicks: Pick[] = [
            {
              id: '1',
              profile_id: user?.id || 'mock-user-id',
              category: 'products',
              title: 'My Favorite Book',
              description: 'A great read',
              image_url: 'https://via.placeholder.com/300x400',
              reference: 'test-ref',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              status: 'published',
              visible: true,
              rank: 1,
            },
            {
              id: '2',
              profile_id: user?.id || 'mock-user-id',
              category: 'products',
              title: 'Best Laptop Ever',
              description: 'Perfect for work',
              image_url: 'https://via.placeholder.com/300x400',
              reference: 'test-ref-2',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              status: 'published',
              visible: true,
              rank: 2,
            },
          ];
          
          setPicks(mockPicks);
          setLoading(false);
        }, 1000);
        
        // Original Supabase code (commented out for now)
        /*
        // Fetch user's picks
        const { data: picksData, error: picksError } = await supabase
          .from('picks')
          .select('*')
          .eq('profile_id', user.id)
          .order('rank', { ascending: true });
          
        if (picksError) {
          throw picksError;
        }
        
        if (picksData) {
          setPicks(picksData);
        }
        
        // Fetch user's collections if they are a creator
        const { data: profileData } = await supabase
          .from('profiles')
          .select('is_creator, status')
          .eq('id', user.id)
          .single();
          
        if (profileData?.is_creator && profileData?.status === 'approved') {
          const { data: collectionsData, error: collectionsError } = await supabase
            .from('collections')
            .select('*')
            .eq('profile_id', user.id)
            .order('created_at', { ascending: false });
            
          if (collectionsError) {
            throw collectionsError;
          }
          
          if (collectionsData) {
            setCollections(collectionsData);
          }
        }
        */
      } catch (error) {
        console.error('Error fetching user content:', error);
        setLoading(false);
      }
    }
    
    fetchUserContent();
  }, [user?.id]);

  const fetchMyPicks = async () => {
    try {
      setLoading(true);
      
      // Mock data for testing
      setTimeout(() => {
        const mockPicks: Pick[] = [
          {
            id: '1',
            profile_id: user?.id || 'mock-user-id',
            category: 'products',
            title: 'My Favorite Book',
            description: 'A great read',
            image_url: 'https://via.placeholder.com/300x400',
            reference: 'test-ref',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            status: 'published',
            visible: true,
            rank: 1,
          },
          {
            id: '2',
            profile_id: user?.id || 'mock-user-id',
            category: 'products',
            title: 'Best Laptop Ever',
            description: 'Perfect for work',
            image_url: 'https://via.placeholder.com/300x400',
            reference: 'test-ref-2',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            status: 'published',
            visible: true,
            rank: 2,
          },
        ];
        
        setPicks(mockPicks);
        setLoading(false);
      }, 500);
      
      // Original Supabase code (commented out for now)
      /*
      if (!user?.id) return;
      
      const { data, error } = await supabase
        .from('picks')
        .select('*')
        .eq('profile_id', user.id)
        .order('rank', { ascending: true });
        
      if (error) {
        throw error;
      }
      
      if (data) {
        setMyPicks(data);
      }
      */
    } catch (error) {
      console.error('Error fetching picks:', error);
      setLoading(false);
    }
  };

  const handleAddPick = async () => {
    // Mock function for now
    console.log('Add pick functionality coming soon!');
    
    // Original code (commented out for now)
    /*
    try {
      if (!user?.id) return;
      
      const { error } = await supabase
        .from('picks')
        .insert([
          {
            profile_id: user.id,
            title: 'New Pick',
            category: 'other',
            rank: myPicks.length + 1,
          }
        ]);
        
      if (error) {
        throw error;
      }
      
      fetchMyPicks();
    } catch (error) {
      console.error('Error adding pick:', error);
    }
    */
  };
  
  const handleEditPick = (pick: Pick) => {
    // Navigate to edit pick screen
    // This will be implemented when we set up the navigation properly
    console.log('Navigate to edit pick screen', pick.id);
  };
  
  const handleAddCollection = () => {
    // Navigate to add collection screen
    // This will be implemented when we set up the navigation properly
    console.log('Navigate to add collection screen');
  };
  
  const handleEditCollection = (collection: Collection) => {
    // Navigate to edit collection screen
    // This will be implemented when we set up the navigation properly
    console.log('Navigate to edit collection screen', collection.id);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading your content...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.title}>Sign in to view your picks</Text>
          <Text style={styles.subtitle}>
            Create an account or sign in to manage your picks and collections
          </Text>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Threes</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>My Picks</Text>
        
        {picks.map((pick, index) => (
          <View key={pick.id} style={styles.pickItem}>
            <Text style={styles.pickTitle}>{pick.title}</Text>
            <Text style={styles.pickDescription}>{pick.description}</Text>
            <Text style={styles.pickCategory}>{pick.category}</Text>
            <Text style={styles.pickRank}>Rank: {pick.rank}</Text>
          </View>
        ))}
        
        {picks.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              You haven't created any picks yet
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    marginTop: 16,
    color: '#6b7280',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#252525',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#252525',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  pickItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  pickTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 8,
  },
  pickDescription: {
    color: '#6b7280',
    marginBottom: 8,
  },
  pickCategory: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 4,
  },
  pickRank: {
    fontSize: 12,
    color: '#3b82f6',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6b7280',
    textAlign: 'center',
  },
});
