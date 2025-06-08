import React, { useState, useEffect } from 'react';
import { Globe2, Package, BookOpen, Plus, Save, Trash2, History, Clock, X, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ImageUpload } from '../components/ImageUpload';
import type { Pick } from '../types';
import { useAppStore } from '../store';

type Category = 'places' | 'products' | 'books';

export default function FeaturedPicksPage() {
  const { featuredPicks, fetchFeaturedPicks, updateFeaturedPicks } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    category: 'places' as Category,
    title: '',
    description: '',
    reference: '',
    imageFile: null as File | null,
    imageUrl: '',
  });

  useEffect(() => {
    const fetchWithRetry = async (attempts = 3, delay = 2000) => {
      for (let i = 0; i < attempts; i++) {
        try {
          await fetchFeaturedPicks();
          setError(null);
          setLoading(false);
          break;
        } catch (err) {
          console.error(`Fetch attempt ${i + 1} failed:`, err);
          if (i === attempts - 1) {
            setError('Failed to load featured picks');
            setLoading(false);
          } else {
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }
    };

    fetchWithRetry();
  }, [fetchFeaturedPicks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.reference || (!formData.imageFile && !formData.imageUrl)) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let finalImageUrl = formData.imageUrl;

      if (formData.imageFile) {
        const timestamp = new Date().getTime();
        const fileExt = formData.imageFile.name.split('.').pop()?.toLowerCase() || 'jpg';
        const filePath = `${user.id}/${timestamp}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('picks')
          .upload(filePath, formData.imageFile);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('picks')
          .getPublicUrl(filePath);

        finalImageUrl = data.publicUrl;
      }

      const { data: newPick, error } = await supabase
        .from('picks')
        .insert({
          profile_id: user.id,
          category: formData.category,
          title: formData.title,
          description: formData.description,
          image_url: finalImageUrl,
          reference: formData.reference,
          status: 'published',
          visible: true,
          is_featured: true,
        })
        .select()
        .single();

      if (error) throw error;

      updateFeaturedPicks([...featuredPicks, newPick]);
      setShowForm(false);
      setFormData({
        category: 'places',
        title: '',
        description: '',
        reference: '',
        imageFile: null,
        imageUrl: '',
      });
    } catch (error) {
      console.error('Error saving featured pick:', error);
      alert('Error saving featured pick. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleVisibility = async (pick: Pick) => {
    const visiblePicks = featuredPicks.filter((p) => p.visible && p.id !== pick.id).length;
    if (!pick.visible && visiblePicks >= 3) {
      alert('Maximum of 3 visible featured picks allowed');
      return;
    }

    try {
      const { data: updatedPick, error } = await supabase
        .from('picks')
        .update({
          visible: !pick.visible,
          updated_at: new Date().toISOString(),
        })
        .eq('id', pick.id)
        .select()
        .single();

      if (error) throw error;

      updateFeaturedPicks(
        featuredPicks.map((p) => (p.id === pick.id ? { ...p, ...updatedPick } : p))
      );
    } catch (error) {
      console.error('Error updating pick visibility:', error);
      alert('Error updating pick');
    }
  };

  const deletePick = async (pick: Pick) => {
    if (!confirm('Are you sure you want to delete this featured pick?')) return;

    try {
      const { error } = await supabase
        .from('picks')
        .delete()
        .eq('id', pick.id);

      if (error) throw error;

      updateFeaturedPicks(featuredPicks.filter((p) => p.id !== pick.id));
    } catch (error) {
      console.error('Error deleting pick:', error);
      alert('Error deleting pick');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => fetchFeaturedPicks()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const visiblePicks = featuredPicks.filter((p) => p.visible);
  const hiddenPicks = featuredPicks.filter((p) => !p.visible);

  if (showForm) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Add Featured Pick</h1>
          <button
            onClick={() => setShowForm(false)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <div className="grid grid-cols-3 gap-4">
              {[
                { id: 'places', label: 'Places', icon: Globe2 },
                { id: 'products', label: 'Products', icon: Package },
                { id: 'books', label: 'Books', icon: BookOpen },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: id as Category })}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-colors ${
                    formData.category === id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image
            </label>
            <ImageUpload
              onImageSelected={(file) => setFormData({ ...formData, imageFile: file })}
              currentUrl={formData.imageUrl}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reference
            </label>
            <input
              type="text"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Featured Picks</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <History className="w-4 h-4" />
            {showHistory ? 'Hide History' : 'Show History'}
          </button>
          <button
            onClick={() => setShowForm(true)}
            disabled={visiblePicks.length >= 3}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Add Pick
          </button>
        </div>
      </div>

      <div className="mb-12">
        <h2 className="text-xl font-semibold mb-6">Current Featured Picks ({visiblePicks.length}/3)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {visiblePicks.map((pick) => (
            <div key={pick.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="aspect-square relative">
                <img
                  src={pick.image_url}
                  alt={pick.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const img = e.currentTarget;
                    img.src = 'https://placehold.co/400x400/FF0000/FFFFFF/png?text=Image+Not+Found';
                    img.onerror = () => {
                      img.style.display = 'none';
                      const parent = img.parentElement;
                      if (parent) {
                        parent.style.backgroundColor = '#f0f0f0';
                        parent.style.display = 'flex';
                        parent.style.alignItems = 'center';
                        parent.style.justifyContent = 'center';
                        parent.innerHTML = `
                          <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"></path>
                          </svg>
                        `;
                      }
                    };
                  }}
                />
              </div>
              <div className="p-4 space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  {pick.category === 'places' && <Globe2 className="w-4 h-4" />}
                  {pick.category === 'products' && <Package className="w-4 h-4" />}
                  {pick.category === 'books' && <BookOpen className="w-4 h-4" />}
                  <span>{pick.reference}</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900">{pick.title}</h3>
                <p className="text-gray-600 text-sm line-clamp-3">{pick.description}</p>
                <div className="flex justify-between items-center pt-4">
                  <button
                    onClick={() => toggleVisibility(pick)}
                    className="flex items-center gap-2 px-3 py-1 text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <History className="w-4 h-4" />
                    Hide
                  </button>
                  <button
                    onClick={() => deletePick(pick)}
                    className="flex items-center gap-2 px-3 py-1 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}

          {visiblePicks.length < 3 && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="h-full min-h-[300px] flex flex-col items-center justify-center gap-4 border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <Plus className="w-8 h-8 text-gray-400" />
              <span className="text-sm text-gray-600">Add featured pick ({visiblePicks.length}/3)</span>
            </button>
          )}
        </div>
      </div>

      {showHistory && hiddenPicks.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-6">Hidden Picks</h2>
          <div className="space-y-6">
            {hiddenPicks.map((pick) => (
              <div key={pick.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-500">
                        Hidden on {new Date(pick.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleVisibility(pick)}
                        disabled={visiblePicks.length >= 3}
                        className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50"
                      >
                        Show
                      </button>
                      <button
                        onClick={() => deletePick(pick)}
                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="aspect-square md:aspect-auto relative">
                      <img
                        src={pick.image_url}
                        alt={pick.title}
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          const img = e.currentTarget;
                          img.src = 'https://placehold.co/400x400/FF0000/FFFFFF/png?text=Image+Not+Found';
                          img.onerror = () => {
                            img.style.display = 'none';
                            const parent = img.parentElement;
                            if (parent) {
                              parent.style.backgroundColor = '#f0f0f0';
                              parent.style.display = 'flex';
                              parent.style.alignItems = 'center';
                              parent.style.justifyContent = 'center';
                              parent.innerHTML = `
                                <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"></path>
                                </svg>
                              `;
                            }
                          };
                        }}
                      />
                    </div>
                    <div className="md:col-span-3">
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        {pick.category === 'places' && <Globe2 className="w-4 h-4 text-blue-500" />}
                        {pick.category === 'products' && <Package className="w-4 h-4 text-green-500" />}
                        {pick.category === 'books' && <BookOpen className="w-4 h-4 text-purple-500" />}
                        <span>{pick.reference}</span>
                      </div>
                      <h3 className="text-xl font-semibold mb-2">{pick.title}</h3>
                      <p className="text-gray-600">{pick.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export { FeaturedPicksPage }