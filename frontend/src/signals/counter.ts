import { computed, signal } from "@preact/signals-react";

export const count = signal(0);

export const double = computed(() => count.value * 2);
