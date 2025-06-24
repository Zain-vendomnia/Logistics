import { create } from "zustand";
import { persist } from "zustand/middleware";
import Delivery from "../components/delivery/Delivery";

export type Message = {
  messageText: string;
  sentAt: string; // ISO stirng
};

interface DeliveryMessageState {
  messagesByDeliveryId: Record<string, Message[]>;
  addMessage: (deliveryId: string, message: Message) => void;
  getMessages: (deliveryId: string) => Message[];
  clearMessages: (deliveryId: string) => void;
}

export const useDeliveryMessages = create<DeliveryMessageState>()(
  persist(
    (set, get) => ({
      messagesByDeliveryId: {},
      addMessage: (deliveryId, message) => {
        const prevChat = get().messagesByDeliveryId[deliveryId] || [];
        set({
          messagesByDeliveryId: {
            ...get().messagesByDeliveryId,
            [deliveryId]: [message, ...prevChat],
          },
        });
      },
      getMessages: (deliveryId) => {
        return get().messagesByDeliveryId[deliveryId] || [];
      },
      clearMessages: (deliveryId) => {
        const { [deliveryId]: _, ...rest } = get().messagesByDeliveryId;
        set({ messagesByDeliveryId: rest });
      },
      // Alternate
      // clearMessages: (deliveryId) => {
      //   const clone = { ...get().messagesByDeliveryId };
      //   delete clone[deliveryId];
      //   set({ messagesByDeliveryId: clone });
      // },
    }),
    {
      name: "delivery-message-store",
      version: 1,
      partialize: (state) => ({
        messagesByDeliveryId: state.messagesByDeliveryId,
      }),
    }
  )
);
