
import { LazyStore } from '@tauri-apps/plugin-store';
import { StateStorage } from 'zustand/middleware';

// Initialize the store lazily
// 'settings.json' will be created in the app's data directory
const store = new LazyStore('settings.json');

export const tauriStorage: StateStorage = {
    getItem: async (name: string): Promise<string | null> => {
        try {
            // Zustand's persist middleware expects a string but store returns parsed JSON if value was object
            // But we are storing the whole state as one key usually? No, partialize does that.
            // Wait, Store.get returns the value. 
            // Zustand stores everything under one key in localStorage (e.g. 'app-storage-v2') 
            // The value associated with that key is a JSON string.
            // So if we use .get(name), it might return the parsed object if we saved it as object?
            // But .set(name, value) where value is string (from Zustand's serialize)
            // So it should be fine.

            const value = await store.get<string>(name);
            return value || null;
        } catch (e) {
            console.error('Failed to get item from store:', e);
            return null;
        }
    },
    setItem: async (name: string, value: string): Promise<void> => {
        try {
            await store.set(name, value);
            await store.save(); // Persist to disk immediately
        } catch (e) {
            console.error('Failed to set item in store:', e);
        }
    },
    removeItem: async (name: string): Promise<void> => {
        try {
            await store.delete(name);
            await store.save();
        } catch (e) {
            console.error('Failed to remove item from store:', e);
        }
    },
};
