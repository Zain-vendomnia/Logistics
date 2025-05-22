export const fade = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.4 },
  },
};

export const slideUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export const shake = {
  initial: { x: 0 },
  animate: {
    x: [0, -10, 10, -10, 10, 0],
    transition: { duration: 0.5 },
  },
};

export const bounce = {
  initial: { scale: 0.5 },
  animate: {
    scale: [1.2, 0.9, 1.05, 1],
    transition: { duration: 0.6 },
  },
};

export const tapScale = {
  whileTap: { scale: 0.95 },
  transition: { type: "spring", stiffness: 500 },
};

export const pulse = {
  animate: { scale: [1, 1.1, 1] },
  transition: { repeat: Infinity, duration: 1.2 },
};

export const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};
