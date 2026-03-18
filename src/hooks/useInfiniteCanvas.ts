"use client";
import { Shape } from "@/redux/slice/shapes";
import { Point } from "@/redux/slice/viewport";
import { AppDispatch, useAppDispatch, useAppSelector } from "@/redux/store";
import { useEffect, useRef, useState } from "react";

interface TouchPointer {
  id: number;
  p: Point;
}

interface DraftShap {
  type: "frame" | "react" | "ellipse" | "arrow" | "line";
  startWorld: Point;
  currentWorld: Point;
}

export const useInfiniteCanvas = () => {
  const dispatch = useAppDispatch<AppDispatch>();

  const viewport = useAppSelector((s) => s.viewport);

  const entityState = useAppSelector((s) => s.shapes.shapes);
  const shapeList: Shape[] = entityState.ids
    .map((id: string) => entityState.entities[id])
    .filter((s: Shape | undefined): s is Shape => Boolean(s));

  const currentTool = useAppSelector((s) => s.shapes.tool);
  const selectedShapes = useAppSelector((s) => s.shapes.selected);
  const shapesEntities = useAppSelector((s) => s.shapes.shapes.entities);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  //if text is selected
  const hasSelectedText = selectedShapes.some((id: any) => {
    const shape = shapesEntities[id];
    return shape?.type === "text";
  });

  useEffect(() => {
    if (hasSelectedText && !isSidebarOpen) {
      setIsSidebarOpen(true);
    } else if (!hasSelectedText) {
      setIsSidebarOpen(false);
    }
  }, [hasSelectedText, isSidebarOpen]);

  //refs

  //canvas reference
  const canvasRef = useRef<HTMLDivElement | null>(null);
  //dom element reference
  const touchMapRef = useRef<Map<number, TouchPointer>>(new Map());
  //draft shape reference
  const draftShapeRef = useRef<DraftShap | null>(null);
  // ref for freeHand or pencil tool
  const freeDrawPointsRef = useRef<Point[]>([]);
  // for
  const isSpacePressed = useRef(false);

  const isDrawingRef = useRef(false);
  const isMovingRef = useRef(false);
  const moveStartRef = useRef<Point | null>(null);

  //where the shapes were before moving
  const initialShapePositionsRef = useRef<
    Record<
      string,
      {
        x?: number;
        y?: number;
        point?: Point[];
        startX?: number;
        startY?: number;
        endX?: number;
        endY?: number;
      }
    >
  >({});

  const isErasingRef = useRef(false);
  const erasedShapesRef = useRef<Set<string>>(new Set());
  const isResizingRef = useRef(false);
  const resizeDataRef = useRef<{
    shapeId: string;
    corner: string;
    intialBounds: { x: number; y: number; w: number; h: number };
    startPoint: { x: number; y: number };
  } | null>(null);

  //for animation
  const lastFreehandFrameRef = useRef(0);
  const freehandRafRef = useRef<number | null>(null);
  const panRafRef = useRef<number | null>(null);
  const pendingPanPointRef = useRef<Point | null>(null);

  // updating refs
  const [, force] = useState(0);
  const requestRender = (): void => {
    force((n) => (n + 1) | 0);
  };

  //coordinate conversion -> sreen coods to canvas coords
  const localPointFromClient = (clientX: number, clientY: number): Point => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: clientX, y: clientY };
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const blurActiveTextInput = () => {
    const activeElement = document.activeElement;
    if (activeElement && activeElement.tagName === "INPUT") {
      (activeElement as HTMLInputElement).blur();
    }
  };

  type WithClientXY = { clientX: number; clientY: number };
  const getLocalPointFromPtr = (e: WithClientXY): Point => {
    return localPointFromClient(e.clientX, e.clientY);
  };

  //collision detection related
  const getShapeAtPoint = (worldPoint: Point): Shape | null => {
    for (let i = shapeList.length - 1; i >= 0; i--) {
      const shape = shapeList[i];
      if (isPointInShape(worldPoint, shape)) {
        return shape;
      }
    }
    return null;
  };

  const isPointInShape = (point: Point, shape: Shape): boolean => {};

  return {
    viewport,
    dispatch,
  };
};
