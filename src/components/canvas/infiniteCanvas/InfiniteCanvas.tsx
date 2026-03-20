"use client";

import { useInfiniteCanvas } from "@/hooks/useInfiniteCanvas";
import TextSidebar from "../textSidebar/TextSidebar";

export default function InfiniteCanvas() {
  const {
    viewport,
    shapes,
    currentTool,
    selectedShapes,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    attachCanvasRef,
    getDraftShape,
    getFreeDrawPoints,
    isSidebarOpen,
    hasSelectedText,
  } = useInfiniteCanvas();

  return (
    <>
      <TextSidebar isOpen={isSidebarOpen && hasSelectedText} />
    </>
  );
}
