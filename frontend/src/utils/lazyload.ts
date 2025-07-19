import React from "react";

export function lazyWithDevFallback<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  devFallback: T
) {
  return process.env.NODE_ENV === "development"
    ? devFallback
    : React.lazy(factory);
}
