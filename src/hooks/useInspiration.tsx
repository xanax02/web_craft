"use client";

import { useState } from "react";

export function useInspiration() {
  const [isInspirationOpen, setIsInspirationOpen] = useState(false);

  const openInspiration = () => {
    setIsInspirationOpen(true);
  };

  const closeInspiration = () => {
    setIsInspirationOpen(false);
  };

  const toggleInspiration = () => {
    setIsInspirationOpen(!isInspirationOpen);
  };

  return {
    isInspirationOpen,
    openInspiration,
    closeInspiration,
    toggleInspiration,
  };
}
