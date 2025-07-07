import { create, StateCreator } from "zustand";
import {
  NotificationSeverity,
  useNotificationStore,
} from "./useNotificationStore";
import { createJSONStorage, persist } from "zustand/middleware";
import { formatTime } from "../utils/formatConverter";

type BreakState = {
  BREAK_LIMIT: number;
  tripStartedAt: string | null;
  isBreakEligible: boolean;
  isBreakActive: boolean;
  breakStartedAt: number | null;
  breakElapsed: number;
  isBreakCancelled: boolean;

  initializeBreakEvaluator: (tripStartedAt: string) => void;
  handleToggleBreak: () => void;
  cancelBreak: () => void;
  recoverBreakTimer: () => void;
  resetBreakState: () => void;

  _breakTimer: NodeJS.Timeout | null;
  _eligibilityInterval: NodeJS.Timeout | null;
};

const createStore: StateCreator<BreakState> = (set, get) => {
  // const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
  const SIX_HOURS_MS = 6000;
  const BREAK_LIMIT = 30 * 60 * 1000;

  const initializeBreakEvaluator = (tripStartedAt: string) => {
    let { _eligibilityInterval, isBreakCancelled } = get();

    if (isBreakCancelled) return;

    set({ tripStartedAt });
    if (_eligibilityInterval) clearInterval(_eligibilityInterval);

    const tripStart_MS = new Date(tripStartedAt).getTime();

    const interval = setInterval(() => {
      const now = Date.now();
      const { isBreakEligible } = get();

      if (!isBreakEligible && now - tripStart_MS >= SIX_HOURS_MS) {
        set({ isBreakEligible: true });

        useNotificationStore.getState().showNotification({
          title: "Break Time!",
          message: "You can now take a break.",
          severity: NotificationSeverity.Info,
          duration: 8000,
        });
      }
    }, 1000);
    // }, 60_000);}

    set({ _eligibilityInterval: interval });
  };

  const handleBreakInterval = () => {
    if (get().isBreakCancelled) return;

    let { _breakTimer } = get();

    const timer = setInterval(() => {
      const { isBreakCancelled, breakStartedAt } = get();

      if (isBreakCancelled || !breakStartedAt) {
        clearInterval(_breakTimer!);
        console.log("Break timer cancelled, exiting interval.");
        return;
      }

      const now = Date.now();
      const elapsed = now - breakStartedAt;

      if (elapsed >= BREAK_LIMIT) {
        clearInterval(_breakTimer!);
        set({
          breakElapsed: BREAK_LIMIT,
          isBreakActive: false,
          breakStartedAt: null,
        });
      } else {
        set({ breakElapsed: elapsed });
      }
    }, 1000);

    set({ _breakTimer: timer });
  };

  const handleToggleBreak = () => {
    const { isBreakActive, isBreakCancelled } = get();

    if (isBreakActive) {
      return;
      // if (breakTimer) clearInterval(breakTimer);
      // set({
      //   isBreakActive: true,
      //   // breakStartedAt: null,
      // });
    } else {
      if (isBreakCancelled) return;

      const startedAt = Date.now();
      set({ isBreakActive: true, breakStartedAt: startedAt });
      handleBreakInterval();
    }
  };

  const recoverBreakTimer = () => {
    const { isBreakEligible, isBreakActive, breakStartedAt, isBreakCancelled } =
      get();

    if (
      !isBreakEligible ||
      !isBreakActive ||
      !breakStartedAt ||
      isBreakCancelled
    )
      return;

    if (isBreakActive) {
      const now = Date.now();
      const timeSinceStart = now - breakStartedAt;

      if (timeSinceStart >= BREAK_LIMIT) {
        set({
          breakElapsed: BREAK_LIMIT,
          isBreakActive: false,
          breakStartedAt: null,
        });
        return;
      }

      // Set accurate current breakElapsed
      set({ breakElapsed: timeSinceStart });

      // Restart the break timer
      handleBreakInterval();
    }
    return;
  };

  const resetBreakState = () =>
    set({
      tripStartedAt: null,
      isBreakEligible: false,
      isBreakActive: false,
      breakStartedAt: null,
      breakElapsed: 0,
      isBreakCancelled: false,
    });

  const cancelBreak = () => {
    const _eligibilityInterval = get()._eligibilityInterval;
    const _breakTimer = get()._breakTimer;

    _eligibilityInterval && clearInterval(_eligibilityInterval);
    _breakTimer && clearInterval(_breakTimer);

    const elapsed = get().breakElapsed;

    // set({
    //   tripStartedAt: null,
    //   isBreakEligible: false,
    //   isBreakActive: false,
    //   breakStartedAt: null,
    //   breakElapsed: 0,
    //   isBreakCancelled: true,
    //   _breakTimer: null,
    //   _eligibilityInterval: null,
    // });
    // set({ breakElapsed: elapsed });

    const newState = {
      tripStartedAt: null,
      isBreakEligible: false,
      isBreakActive: false,
      isBreakCancelled: true,
      breakStartedAt: null,
      breakElapsed: elapsed,
      _breakTimer: null,
      _eligibilityInterval: null,
    };
    set(newState);

    useNotificationStore.getState().showNotification({
      title: "Break Cancelled",
      message: "Your break has been cancelled.",
      severity: NotificationSeverity.Warning,
      duration: 8000,
    });

    console.log("Cancel break state called | New state: ", get());
    console.log("Break timer cleared:", _breakTimer === null);
    console.log("eligibilityInterval cleared:", _eligibilityInterval === null);

    // breakTimer = null;
    // localStorage.setItem(
    //   "break-store",
    //   JSON.stringify({ state: get(), version: 1 })
    // );
  };

  return {
    isBreakCancelled: false,
    BREAK_LIMIT,
    tripStartedAt: null,
    isBreakEligible: false,
    isBreakActive: false,
    breakStartedAt: null,
    breakElapsed: 0,
    initializeBreakEvaluator,
    handleToggleBreak,
    recoverBreakTimer,
    resetBreakState,
    cancelBreak,
    _breakTimer: null,
    _eligibilityInterval: null,
  };
};

export const useDriverBreakStore = create<BreakState>()(
  persist(createStore, {
    name: "break-store",
    storage: createJSONStorage(() => localStorage),
    version: 1,
    partialize: (state) => ({
      tripStartedAt: state.tripStartedAt,
      isBreakEligible: state.isBreakEligible,
      isBreakActive: state.isBreakActive,
      breakStartedAt: state.breakStartedAt,
      breakElapsed: state.breakElapsed,
      isBreakCancelled: state.isBreakCancelled,
    }),
    onRehydrateStorage: () => (state, error) => {
      if (error) {
        console.warn("Rehydrate error:", error);
      } else {
        console.log("✅ BreakStore rehydrated with:", state);
      }
    },
  })
);
