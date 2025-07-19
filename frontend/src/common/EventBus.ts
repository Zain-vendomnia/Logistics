const eventBus = {
  on(event: string, callback: (data?: any) => void) {
    const handler = (e: Event) => callback((e as CustomEvent).detail);
    document.addEventListener(event, handler);
    return () => document.removeEventListener(event, handler); // Return cleanup function
  },
  dispatch(event: string, data?: any) {
    document.dispatchEvent(new CustomEvent(event, { detail: data }));
  },
  remove(event: string, callback: (data?: any) => void) {
    document.removeEventListener(event, callback as EventListener);
  },
};

export default eventBus;