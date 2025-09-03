import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Function to determine the storage to use
const getStorage = () => {
  try {
    // Attempt to use sessionStorage
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return sessionStorage;
    }
  } catch (e) {
    // Fallback to localStorage if sessionStorage is not available
    console.warn('sessionStorage not available, falling back to localStorage:', e);
  }
  // Default to localStorage if sessionStorage fails or is not available
  return localStorage;
};

export const useMyStore = create(
  persist(
    (set) => ({
      // Your store's state and actions
      count: 0,
    }),
    {
      name: 'my-persistent-store', // Unique name for your store in storage
      storage: createJSONStorage(getStorage), // Use the custom storage getter
    }
  )
);