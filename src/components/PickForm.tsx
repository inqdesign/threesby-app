import React, { useState, useEffect } from 'react';
import { Globe2, Package, BookOpen, X, Save } from 'lucide-react';
import type { Pick } from '../types';
import { ImageUpload } from './ImageUpload';
import { uploadImage, supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

type PickFormProps = {
  onSubmit: (picks: Omit<Pick, 'id' | 'profile_id' | 'created_at' | 'updated_at' | 'status'>[]) => Promise<void>;
};

export function PickForm({ onSubmit }: PickFormProps) {
  const { user } = useAuth();
  const [picks, setPicks] = useState<Record<'books' | 'products' | 'places', Omit<Pick, 'id' | 'profile_id' | 'created_at' | 'updated_at' | 'status'>[]>>({
    books: [],
    products: [],
    places: [],
  });
  const [uploadQueue, setUploadQueue] = useState<Record<string, File>>({});
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    { id: 'books', label: 'Books', icon: <BookOpen className="w-6 h-6" />, fieldLabel: 'Author' },
    { id: 'products', label: 'Products', icon: <Package className="w-6 h-6" />, fieldLabel: 'Brand' },
    { id: 'places', label: 'Places', icon: <Globe2 className="w-6 h-6" />, fieldLabel: 'Location' },
  ];

  // Load draft picks on mount
  useEffect(() => {
    if (user) {
      loadDraftPicks();
    }
  }, [user]);

  const loadDraftPicks = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('picks')
      .select('*')
      .eq('profile_id', user.id)
      .eq('status', 'draft');

    if (error) {
      console.error('Error loading draft picks:', error);
      return;
    }

    // Group picks by category
    const groupedPicks: Record<'books' | 'products' | 'places', Omit<Pick, 'id' | 'profile_id' | 'created_at' | 'updated_at' | 'status'>[]> = {
      books: [],
      products: [],
      places: [],
    };
    data.forEach((pick) => {
      const { category, title, description, image_url, reference } = pick;
      if (category === 'books' || category === 'products' || category === 'places') {
        // Use type assertion to tell TypeScript that category is a valid key
        const validCategory = category as 'books' | 'products' | 'places';
        // Include all required fields from the Pick type
        groupedPicks[validCategory].push({ 
          category, 
          title, 
          description, 
          image_url, 
          reference,
          visible: pick.visible ?? true, // Use existing value or default to true
          rank: pick.rank ?? 0 // Use existing value or default to 0
        });
      }
    });
    setPicks(groupedPicks);
  };

  const addPick = (category: 'books' | 'products' | 'places') => {
    if (picks[category].length >= 3) return;
    setPicks({
      ...picks,
      [category]: [
        ...picks[category],
        {
          category,
          title: '',
          description: '',
          image_url: '',
          reference: '',
          visible: true,
          rank: picks[category].length, // Assign rank based on position
        },
      ],
    });
  };

  const removePick = (category: 'books' | 'products' | 'places', index: number) => {
    const newPicks = { ...picks };
    newPicks[category] = newPicks[category].filter((_: Omit<Pick, 'id' | 'profile_id' | 'created_at' | 'updated_at' | 'status'>, i: number) => i !== index);
    setPicks(newPicks);
    // Remove from upload queue
    const pickId = `${category}-${index}`;
    const newUploadQueue = { ...uploadQueue };
    delete newUploadQueue[pickId];
    setUploadQueue(newUploadQueue);
  };

  const updatePick = (category: 'books' | 'products' | 'places', index: number, field: string, value: string) => {
    const newPicks = { ...picks };
    newPicks[category][index] = {
      ...newPicks[category][index],
      [field]: value,
    };
    setPicks(newPicks);
  };

  const handleImageSelected = (category: 'books' | 'products' | 'places', index: number, file: File) => {
    const pickId = `${category}-${index}`;
    setUploadQueue({ ...uploadQueue, [pickId]: file });
  };

  const saveDraft = async () => {
    if (!user) {
      alert('Please sign in to save picks');
      return;
    }

    setSaving(true);
    try {
      // Upload any pending images first
      const uploadPromises = Object.entries(uploadQueue).map(async ([pickId, file]) => {
        const [category, indexStr] = pickId.split('-');
        const index = parseInt(indexStr);
        const url = await uploadImage(file, user.id);
        updatePick(category as 'books' | 'products' | 'places', index, 'image_url', url);
        return url;
      });

      await Promise.all(uploadPromises);

      // Delete existing draft picks
      await supabase
        .from('picks')
        .delete()
        .eq('profile_id', user.id)
        .eq('status', 'draft');

      // Save all picks as drafts
      const allPicks = [...picks.places, ...picks.products, ...picks.books];
      if (allPicks.length > 0) {
        await supabase
          .from('picks')
          .insert(
            allPicks.map(pick => ({
              ...pick,
              profile_id: user.id,
              status: 'draft'
            }))
          );
      }

      alert('Picks saved successfully!');
    } catch (error) {
      console.error('Error saving picks:', error);
      alert('Error saving picks. Please try again.');
    } finally {
      setSaving(false);
      setUploadQueue({});
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const allPicks = [...picks.places, ...picks.products, ...picks.books];
    if (allPicks.length !== 9) {
      alert('Please add exactly 3 picks for each category before submitting for review.');
      return;
    }

    if (!user) {
      alert('Please sign in to submit picks');
      return;
    }

    setSubmitting(true);
    try {
      // Upload any remaining images
      const uploadPromises = Object.entries(uploadQueue).map(async ([pickId, file]) => {
        const [category, indexStr] = pickId.split('-');
        const index = parseInt(indexStr);
        const url = await uploadImage(file, user.id);
        updatePick(category as 'books' | 'products' | 'places', index, 'image_url', url);
        return url;
      });

      await Promise.all(uploadPromises);
      await onSubmit(allPicks);
    } catch (error) {
      console.error('Error submitting picks:', error);
      alert('Error submitting picks. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalPicks = picks.places.length + picks.products.length + picks.books.length;

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Share Your Picks</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={saveDraft}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            type="submit"
            disabled={submitting || totalPicks !== 9}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit for Review'}
          </button>
        </div>
      </div>

      <p className="text-gray-600 mb-8">
        Choose exactly three items from each category. You've added {totalPicks}/9 picks total.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {categories.map(({ id, label, icon }) => (
          <div key={id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              {icon}
              <h3 className="text-lg font-semibold">{label}</h3>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              {picks[id as 'books' | 'products' | 'places'].length}/3 picks added
            </p>
            {picks[id as 'books' | 'products' | 'places'].length < 3 && (
              <button
                type="button"
                onClick={() => addPick(id as 'books' | 'products' | 'places')}
                className="w-full py-2 px-3 text-sm border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors"
              >
                Add {label.toLowerCase()} pick
              </button>
            )}
          </div>
        ))}
      </div>

      {categories.map(({ id, label, icon, fieldLabel }) => (
        <div key={id} className={`mb-12 ${picks[id as 'books' | 'products' | 'places'].length === 0 ? 'hidden' : ''}`}>
          <div className="flex items-center gap-2 mb-4">
            {icon}
            <h3 className="text-xl font-semibold">Your {label}</h3>
          </div>

          {picks[id as 'books' | 'products' | 'places'].map((pick, index) => (
            <div key={index} className="relative mb-6 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
              <button
                type="button"
                onClick={() => removePick(id as 'books' | 'products' | 'places', index)}
                className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                title="Remove pick"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                  <ImageUpload
                    onImageSelected={(file) => handleImageSelected(id as 'books' | 'products' | 'places', index, file)}
                    currentUrl={pick.image_url}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={pick.title}
                    onChange={(e) => updatePick(id as 'books' | 'products' | 'places', index, 'title', e.target.value)}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    required
                    placeholder={`Enter ${label.toLowerCase()} title`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{fieldLabel}</label>
                  <input
                    type="text"
                    value={pick.reference}
                    onChange={(e) => updatePick(id as 'books' | 'products' | 'places', index, 'reference', e.target.value)}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    required
                    placeholder={`Enter ${fieldLabel.toLowerCase()}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={pick.description}
                    onChange={(e) => updatePick(id as 'books' | 'products' | 'places', index, 'description', e.target.value)}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    rows={3}
                    required
                    placeholder={`Describe why you recommend this ${label.toLowerCase()}`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </form>
  );
}