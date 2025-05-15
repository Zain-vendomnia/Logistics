import {
  defaultDeliveryStoreState,
  useDeliveryStore,
} from "../store/useDeliveryStore";

export const resetDeliveryStore = () => {
  useDeliveryStore.persist?.clearStorage();
  useDeliveryStore.setState(defaultDeliveryStoreState);
  useDeliveryStore.persist?.rehydrate();
};
