import { create } from "zustand";

export const useTransitionStore = create((set) => ({
  isTransitioning: false,
  targetRoute: null,
  startTransition: (route) =>
    set({ isTransitioning: true, targetRoute: route }),
  endTransition: () => set({ isTransitioning: false, targetRoute: null }),
}));
