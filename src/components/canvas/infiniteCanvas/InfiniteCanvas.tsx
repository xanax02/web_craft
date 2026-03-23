"use client";

import { useInfiniteCanvas } from "@/hooks/useInfiniteCanvas";
import TextSidebar from "../textSidebar/TextSidebar";
import { cn } from "@/lib/utils";
import ShapeRenderer from "../toolbar/shapes/ShapeRenderer";

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

      <div
        ref={attachCanvasRef}
        role="application"
        aria-label="Infinite drawing canvas"
        className={cn(
          "relative w-full h-screen overflow-hidden select-none z-0",
          {
            "cursor-grabbing": viewport.mode === "panning",
            "cursor-grab": viewport.mode === "shiftPanning",
            "cursor-crosshair":
              currentTool !== "select" && viewport.mode === "idle",
            "cursor-default":
              currentTool === "select" && viewport.mode === "idle",
          },
        )}
        style={{ touchAction: "none" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onContextMenu={(e) => e.preventDefault()}
        draggable={false}
      >
        <div
          className="absolute origin-top-left pointer-events-none z-10"
          style={{
            transform: `translate3d(${viewport.translate.x}px, ${viewport.translate.y}px, 0) scale(${viewport.scale})`,
            transformOrigin: "0 0",
            willChange: "transform",
          }}
        >
          {shapes.map((shape) => (
            <ShapeRenderer
              key={shape.id}
              shape={shape}
              //   toggleInspiration={toggleInspiration}
              //   toggleChat={toggleChat}
              //   generateWorkflow={generateWorkflow}
              //   exportDesign={exportDesign}
            />
          ))}
        </div>
      </div>
    </>
  );
}
