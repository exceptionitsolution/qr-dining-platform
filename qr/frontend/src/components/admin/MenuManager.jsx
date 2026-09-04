import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import { Modal } from '../common/Modal';
import { VegBadge, BestsellerBadge, SpiceLevelBadge } from '../common/Badge';
import { toast } from 'sonner';
import {
  Plus,
  Edit2,
  Trash2,
  Image as ImageIcon,
  Upload,
  Check,
  Flame,
  Search,
  Loader2,
  Sparkles,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';

export const MenuManager = () => {
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Curries & Mains',
    price: '',
    is_veg: true,
    is_bestseller: false,
    spice_level: 1,
    image_url: '',
    available: true,
  });
  const [isUploading, setIsUploading] = useState(false);

  // Fetch admin menu
  const { data: menuItems = [], isLoading } = useQuery({
    queryKey: ['adminMenu'],
    queryFn: async () => {
      const res = await api.get('/admin/menu');
      return res.data;
    },
  });

  // Extract categories
  const categories = Array.from(new Set(menuItems.map((i) => i.category))).filter(Boolean);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      category: categories[0] || 'Starters',
      price: '',
      is_veg: true,
      is_bestseller: false,
      spice_level: 1,
      image_url: '',
      available: true,
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      category: item.category,
      price: item.price,
      is_veg: item.is_veg,
      is_bestseller: item.is_bestseller,
      spice_level: item.spice_level,
      image_url: item.image_url || '',
      available: item.available,
    });
    setIsModalOpen(true);
  };

  // Image Upload handler
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = new FormData();
    data.append('file', file);

    setIsUploading(true);
    try {
      const res = await api.post('/admin/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFormData((prev) => ({ ...prev, image_url: res.data.url }));
      toast.success('Image uploaded successfully');
    } catch (err) {
      toast.error('Failed to upload image file');
    } finally {
      setIsUploading(false);
    }
  };

  // Save (Create or Update) Mutation
  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      if (editingItem) {
        return await api.put(`/admin/menu/${editingItem.id}`, payload);
      } else {
        return await api.post('/admin/menu', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminMenu'] });
      queryClient.invalidateQueries({ queryKey: ['publicMenu'] });
      toast.success(editingItem ? 'Dish updated successfully' : 'New dish added to menu');
      setIsModalOpen(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to save menu item');
    },
  });

  // Toggle Availability Mutation
  const toggleMutation = useMutation({
    mutationFn: async (itemId) => {
      const res = await api.patch(`/admin/menu/${itemId}/availability`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminMenu'] });
      queryClient.invalidateQueries({ queryKey: ['publicMenu'] });
      toast.success('Availability updated');
    },
    onError: () => toast.error('Failed to update availability'),
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (itemId) => {
      const res = await api.delete(`/admin/menu/${itemId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminMenu'] });
      queryClient.invalidateQueries({ queryKey: ['publicMenu'] });
      toast.success('Dish removed from menu');
    },
    onError: () => toast.error('Failed to delete item'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price) {
      toast.error('Name and price are required');
      return;
    }
    saveMutation.mutate({
      ...formData,
      price: parseFloat(formData.price),
    });
  };

  // Filtered menu items
  const filtered = menuItems.filter((i) => {
    if (selectedCategory !== 'all' && i.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!i.name.toLowerCase().includes(q) && !(i.description || '').toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 luxury-card p-6 rounded-3xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E5A93C] shadow-[0_0_10px_rgba(229,169,60,0.8)] animate-pulse" />
            <h3 className="font-display font-black text-xl sm:text-2xl text-stone-900 dark:text-white tracking-tight">
              Menu Catalog Studio
            </h3>
          </div>
          <p className="text-xs text-stone-600 dark:text-stone-400 font-medium">
            Create, price, and curate your restaurant dishes & dietary options.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 gold-btn text-xs font-black rounded-2xl shadow-gold-sm transition-all self-start sm:self-auto active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Dish</span>
        </button>
      </div>

      {/* Category Pills & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 shadow-xs ${
              selectedCategory === 'all'
                ? 'gold-btn'
                : 'bg-white text-stone-800 border border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700'
            }`}
          >
            All Categories ({menuItems.length})
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 shadow-xs ${
                selectedCategory === c
                  ? 'gold-btn'
                  : 'bg-white text-stone-800 border border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dish name..."
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-[#120F0D] border border-stone-300 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:border-[#E5A93C] font-medium"
          />
        </div>
      </div>

      {/* Dishes Cards Grid */}
      {isLoading ? (
        <div className="py-20 text-center text-stone-500">Loading catalog...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-[#181412] border border-stone-200 dark:border-stone-800 rounded-3xl p-12 text-center text-stone-600 dark:text-stone-400 shadow-sm">
          No dishes found. Click "Add New Dish" to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const img = item.image_url
              ? item.image_url.startsWith('http') || item.image_url.startsWith('/')
                ? item.image_url
                : `/uploads/${item.image_url}`
              : DEFAULT_IMAGE;

            return (
              <div
                key={item.id}
                className="luxury-card rounded-3xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 space-y-3"
              >
                <div>
                  <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-stone-100 dark:bg-stone-800 mb-3">
                    <img
                      src={img}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = DEFAULT_IMAGE;
                      }}
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <VegBadge isVeg={item.is_veg} />
                      {item.is_bestseller && <BestsellerBadge />}
                    </div>
                    {item.spice_level > 0 && (
                      <div className="absolute bottom-2 left-2 bg-black/75 px-2 py-0.5 rounded-full border border-white/20">
                        <SpiceLevelBadge level={item.spice_level} />
                      </div>
                    )}
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#9A3412] dark:text-[#E5A93C]">
                        {item.category}
                      </span>
                      <h4 className="font-display font-black text-base text-stone-900 dark:text-white line-clamp-1">
                        {item.name}
                      </h4>
                    </div>
                    <span className="text-base font-black text-[#9A3412] dark:text-[#FBBF24]">₹{Math.round(item.price)}</span>
                  </div>

                  {item.description && (
                    <p className="text-xs text-stone-600 dark:text-stone-300 line-clamp-2 mt-1 font-medium">{item.description}</p>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-stone-200 dark:border-stone-800/80 flex items-center justify-between">
                  {/* Availability Toggle */}
                  <button
                    onClick={() => toggleMutation.mutate(item.id)}
                    className="flex items-center gap-1.5 text-xs font-bold text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white"
                  >
                    {item.available ? (
                      <>
                        <ToggleRight className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-emerald-700 dark:text-emerald-400 font-black">In Stock</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-5 h-5 text-rose-600 dark:text-rose-500" />
                        <span className="text-rose-700 dark:text-rose-400 font-black">Sold Out</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl transition-colors border border-stone-200 dark:border-stone-700"
                      title="Edit dish"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete "${item.name}" from menu?`)) {
                          deleteMutation.mutate(item.id);
                        }
                      }}
                      className="p-2 bg-stone-100 hover:bg-rose-100 dark:bg-stone-800 dark:hover:bg-rose-950 text-stone-600 hover:text-rose-700 dark:text-stone-400 dark:hover:text-rose-400 rounded-xl transition-colors border border-stone-200 dark:border-stone-700"
                      title="Delete dish"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Dish Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Menu Dish' : 'Add New Menu Dish'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-stone-900 dark:text-white">
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
              Dish Name <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Murgh Makhani Butter Chicken"
              className="w-full px-3.5 py-2.5 text-sm text-stone-900 dark:text-white font-medium bg-white dark:bg-[#1A1613] border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:border-[#E5A93C] placeholder:text-stone-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                Category
              </label>
              <input
                type="text"
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g. Curries, Starters, Biryani"
                className="w-full px-3.5 py-2.5 text-sm text-stone-900 dark:text-white font-medium bg-white dark:bg-[#1A1613] border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:border-[#E5A93C] placeholder:text-stone-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                Price (₹) <span className="text-rose-600">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="350.00"
                className="w-full px-3.5 py-2.5 text-sm text-stone-900 dark:text-white font-bold bg-white dark:bg-[#1A1613] border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:border-[#E5A93C] placeholder:text-stone-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
              Culinary Description
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Rich tomato gravy with fresh cream, kasuri methi..."
              className="w-full px-3.5 py-2 text-xs text-stone-900 dark:text-white font-medium bg-white dark:bg-[#1A1613] border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:border-[#E5A93C] placeholder:text-stone-400 resize-none"
            />
          </div>

          {/* Photo URL or Upload */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
              Food Photography (URL or File)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://images.unsplash.com/... or upload"
                className="flex-1 px-3.5 py-2 text-xs text-stone-900 dark:text-white font-medium bg-white dark:bg-[#1A1613] border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:border-[#E5A93C] placeholder:text-stone-400"
              />
              <label className="cursor-pointer px-3.5 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 border border-stone-300 dark:border-stone-700 rounded-xl text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1 shrink-0 transition-colors">
                <Upload className="w-3.5 h-3.5 text-stone-700 dark:text-stone-300" />
                <span>Upload File</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
            {isUploading && <p className="text-[11px] text-[#D94625] font-bold">Uploading file...</p>}
          </div>

          {/* Dietary & Spice Settings */}
          <div className="grid grid-cols-3 gap-2.5 bg-stone-50 dark:bg-[#1C1713] p-3 rounded-2xl border border-stone-200 dark:border-stone-800">
            <div>
              <span className="text-[10px] font-bold text-stone-600 dark:text-stone-400 uppercase block mb-1">Diet Type</span>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, is_veg: !formData.is_veg })}
                className={`w-full py-1.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                  formData.is_veg
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                    : 'bg-rose-600 text-white border-rose-700 shadow-xs'
                }`}
              >
                {formData.is_veg ? 'Pure Veg' : 'Non-Veg'}
              </button>
            </div>

            <div>
              <span className="text-[10px] font-bold text-stone-600 dark:text-stone-400 uppercase block mb-1">Bestseller</span>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, is_bestseller: !formData.is_bestseller })}
                className={`w-full py-1.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                  formData.is_bestseller
                    ? 'bg-amber-500 text-stone-900 border-amber-600 font-extrabold shadow-xs'
                    : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-300 dark:border-stone-700'
                }`}
              >
                {formData.is_bestseller ? '★ Bestseller' : 'Standard'}
              </button>
            </div>

            <div>
              <span className="text-[10px] font-bold text-stone-600 dark:text-stone-400 uppercase block mb-1">Spice (0-3)</span>
              <select
                value={formData.spice_level}
                onChange={(e) => setFormData({ ...formData, spice_level: parseInt(e.target.value) })}
                className="w-full py-1.5 px-2 rounded-xl text-xs font-bold bg-white dark:bg-[#120F0D] border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white focus:outline-none"
              >
                <option value={0}>Mild (0)</option>
                <option value={1}>Medium (1)</option>
                <option value={2}>Spicy (2)</option>
                <option value={3}>Fiery (3)</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-bold text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="flex-1 py-2.5 rounded-xl gold-btn text-xs font-black shadow-gold-sm transition-all flex items-center justify-center gap-1.5"
            >
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : 'Save Dish'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
