"use client";
import { useRef } from "react";
import { Provider } from "react-redux";
import { makeStore, RootState } from "./store";

export default function ReduxProvider({
  children,
  preloadedState,
}: {
  children: React.ReactNode;
  preloadedState?: Partial<RootState>;
}) {
  const storeRef = useRef(makeStore(preloadedState));

  return <Provider store={storeRef.current}>{children}</Provider>;
}
