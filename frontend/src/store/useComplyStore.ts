import { create } from "zustand";

interface ComplyState {
  location: string | null;
  images: {
    cargo?: string;
    speedometer?: string;
    fuelGauge?: string;
  };
  deliveryStatus: "pending" | "delivered" | "not-delivered" | "returning";
  isAtDeliveryLocation: boolean;

  // Actions
  setLocation: (loc: string) => void;
  setImage: (type: keyof ComplyState["images"], url: string) => void;
  setDeliveryStatus: (status: ComplyState["deliveryStatus"]) => void;
  setIsAtDeliveryLocation: (value: boolean) => void;
  resetDelivery: () => void;
}

export const useComplyStore = create<ComplyState>((set) => ({
  location: null,
  images: {},
  deliveryStatus: "pending",
  isAtDeliveryLocation: false,

  setLocation: (loc) => set({ location: loc }),
  setImage: (type, url) =>
    set((state) => ({
      images: { ...state.images, [type]: url },
    })),
  setDeliveryStatus: (status) => set({ deliveryStatus: status }),
  setIsAtDeliveryLocation: (value) => set({ isAtDeliveryLocation: value }),
  resetDelivery: () =>
    set({
      location: null,
      images: {},
      deliveryStatus: "pending",
      isAtDeliveryLocation: false,
    }),
}));

// Component
// import React from 'react';
// import { useDeliveryStore } from '../store/useDeliveryStore';

// const DeliveryStatus = () => {
//   const { deliveryStatus, setDeliveryStatus } = useDeliveryStore();

//   return (
//     <div>
//       <p>Current Status: {deliveryStatus}</p>
//       <button onClick={() => setDeliveryStatus('delivered')}>
//         Mark as Delivered
//       </button>
//     </div>
//   );
// };
