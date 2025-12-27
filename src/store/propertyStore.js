import { create } from 'zustand';
import { api } from './api';

export const usePropertyStore = create((set, get) => ({
  properties: [],
  loading: false,
  error: null,
  initialized: false,
  selectedHotel: localStorage.getItem('selectedHotel') || '',

  setSelectedHotel: (hotelName) => {
    localStorage.setItem('selectedHotel', hotelName || '');
    set({ selectedHotel: hotelName || '' });
  },

  reset: () => {
    localStorage.removeItem('selectedHotel');
    set({
      properties: [],
      loading: false,
      error: null,
      initialized: false,
      selectedHotel: '',
    });
  },

  fetchProperties: async () => {
    const state = get();
    if (state.loading) return;

    set({ loading: true, error: null });
    try {
      // Uses API_BASE_URL http://localhost:8000/api/ and Authorization from localStorage (authStore)
      const res = await api.get('properties'); // -> http://localhost:8000/api/properties
      const data = Array.isArray(res) ? res : res?.data || [];

      set({ properties: data, loading: false, initialized: true });

      // Initialize selectedHotel if not set OR if current selection is not in available properties
      const currentSelected = get().selectedHotel;
      const isCurrentSelectionValid = data.some(p => p?.name === currentSelected);

      if ((!currentSelected || currentSelected.trim() === '' || !isCurrentSelectionValid) && data.length > 0) {
        const defaultHotel = data[0]?.name || '';
        localStorage.setItem('selectedHotel', defaultHotel);
        set({ selectedHotel: defaultHotel });
      }
    } catch (err) {
      set({
        loading: false,
        error: err?.message || 'Failed to load properties',
        initialized: true,
      });
    }
  },
}));