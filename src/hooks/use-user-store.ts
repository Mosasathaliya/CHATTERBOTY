import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface UserState {
  name: string;
  info: string;
  setName: (name: string) => void;
  setInfo: (info: string) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      name: 'User',
      info: 'A curious person exploring conversations with AI, who enjoys creative coding, sci-fi movies, and jazz music.',
      setName: (name) => set({ name }),
      setInfo: (info) => set({ info }),
    }),
    {
      name: 'chatterbots-user-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
