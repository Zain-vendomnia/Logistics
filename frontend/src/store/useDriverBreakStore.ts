import { create, StateCreator } from "zustand";
import {
  NotificationSeverity,
  useNotificationStore,
} from "./useNotificationStore";
import { createJSONStorage, persist } from "zustand/middleware";

type BreakState = {
  tripStartedAt: string | null;
  isBreakEligible: boolean;
  isBreakActive: boolean;
  breakStartedAt: number | null;
  breakElapsed: number;
  isBreakCancelled: boolean;

  initializeBreakEvaluator: (tripStartedAt: string) => void;
  handleToggleBreak: () => void;
  handleCancelBreak: () => void;
  recoverBreakTimer: () => void;
  resetBreakState: () => void;

  BREAK_LIMIT: number;
  MAX_BREAK_SPLITS: number;
  break_split_consumed: number;

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
    let { _breakTimer } = get();

    const { isBreakCancelled, breakStartedAt, breakElapsed } = get();
    let previous_elapsed = isBreakCancelled ? breakElapsed : 0;

    const timer = setInterval(() => {
      const now = Date.now();
      const elapsed = now - breakStartedAt!;

      if (elapsed >= BREAK_LIMIT) {
        clearInterval(_breakTimer!);
        set({
          breakElapsed: BREAK_LIMIT,
          isBreakActive: false,
          breakStartedAt: null,
        });
      } else {
        set({ breakElapsed: previous_elapsed + elapsed });
      }
    }, 1000);

    set({ _breakTimer: timer });
  };

  const handleToggleBreak = () => {
    const { isBreakActive, isBreakCancelled, _breakTimer } = get();

    if (isBreakActive) {
      // return;
      handleCancelBreak();
      // if (_breakTimer) clearInterval(_breakTimer);
      // set({
      //   isBreakActive: false,
      //   // breakStartedAt: null,
      // });
    } else {
      // if (isBreakCancelled) return;

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

  const clearAllTimers = () => {
    const eligibilityInterval = get()._eligibilityInterval;
    const breakTimer = get()._breakTimer;

    eligibilityInterval && clearInterval(eligibilityInterval);
    breakTimer && clearInterval(breakTimer);

    set({ _eligibilityInterval: null, _breakTimer: null });
  };

  const resetBreakState = () => {
    clearAllTimers();
    set({
      tripStartedAt: null,
      isBreakEligible: false,
      isBreakActive: false,
      breakStartedAt: null,
      breakElapsed: 0,
      isBreakCancelled: false,
    });
  };

  const cancelBreak = () => {
    let breakSplit = 1;
    const { break_split_consumed, MAX_BREAK_SPLITS } = get();

    if (break_split_consumed < MAX_BREAK_SPLITS) {
      breakSplit = break_split_consumed + 1;
    }

    const _eligibilityInterval = get()._eligibilityInterval;
    const _breakTimer = get()._breakTimer;

    _eligibilityInterval && clearInterval(_eligibilityInterval);
    _breakTimer && clearInterval(_breakTimer);

    const elapsed = get().breakElapsed;

    clearAllTimers();
    const newState = {
      isBreakEligible: break_split_consumed < MAX_BREAK_SPLITS ? true : false,
      isBreakActive: false,
      isBreakCancelled: true,
      breakStartedAt: null,
      breakElapsed: elapsed,

      break_split_consumed: breakSplit,
    };
    set(newState);
  };

  const handleCancelBreak = () => {
    cancelBreak();

    const { break_split_consumed: _break_split_consumed, MAX_BREAK_SPLITS } =
      get();

    if (_break_split_consumed < MAX_BREAK_SPLITS) {
      useNotificationStore.getState().showNotification({
        title: "Break Terminated",
        message: `You can take ${MAX_BREAK_SPLITS - _break_split_consumed} more Break split(s).`,
        severity: NotificationSeverity.Warning,
        duration: 8000,
      });
    } else {
      useNotificationStore.getState().showNotification({
        message: "Break Completed!",
        severity: NotificationSeverity.Warning,
        duration: 8000,
      });
    }
  };

  return {
    BREAK_LIMIT,
    MAX_BREAK_SPLITS: 2, // Maximum number of break splits allowed
    break_split_consumed: 0, // Initialize break_split_consumed

    isBreakCancelled: false,
    tripStartedAt: null,
    isBreakEligible: false,
    isBreakActive: false,
    breakStartedAt: null,
    breakElapsed: 0,

    initializeBreakEvaluator,
    handleToggleBreak,
    recoverBreakTimer,
    resetBreakState,
    handleCancelBreak,

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
      break_split_consumed: state.break_split_consumed,
    }),
    // onRehydrateStorage: () => (state, error) => {
    //   if (error) {
    //     console.warn("Rehydrate error:", error);
    //   } else {
    //     console.log("✅ BreakStore rehydrated with:", state);
    //   }
    // },
  })
);
