import { create } from 'zustand';

interface Settings {
  [key: string]: {
    valor: string;
    descripcion: string;
    tipoDato: string;
  };
}

interface SettingsState {
  settings: Settings;
  loading: boolean;
  fetchSettings: () => Promise<void>;
  updateSettings: (newSettings: Settings) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: {},
  loading: false,

  fetchSettings: async () => {
    set({ loading: true });
    try {
      const response = await fetch('/api/settings', {
        credentials: 'include'
      });
      if (response.ok) {
        const settings = await response.json();
        set({ settings });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      set({ loading: false });
    }
  },

  updateSettings: async (newSettings: Settings) => {
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(newSettings)
      });

      if (response.ok) {
        set({ settings: newSettings });
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }
}));