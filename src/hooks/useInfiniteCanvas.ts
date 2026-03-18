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

  const isPointInShape = (point: Point, shape: Shape): boolean => {
    switch (shape.type) {
      case "frame":
      case "rect":
      case "ellipse":
      case "generatedui":
        return (
          point.x >= shape.x &&
          point.x <= shape.x + shape.w &&
          point.y >= shape.y &&
          point.y <= shape.y + shape.h
        );
      case "freedraw":
        const threshold = 5;
        for (let i = 0; i < shape.points.length - 1; i++) {
          const p1 = shape.points[i];
          const p2 = shape.points[i + 1];
          if (distanceToLineSegment(point, p1, p2) <= threshold) {
            return true;
          }
        }
        return false;
      case "arrow":
      case "line":
        const lineThreshold = 8;
        return (
          distanceToLineSegment(
            point,
            { x: shape.startX, y: shape.startY },
            { x: shape.endX, y: shape.endY },
          ) <= lineThreshold
        );
      case "text":
        const textWidth = Math.max(
          shape.text.length * (shape.fontSize * 0.6),
          100,
        );

        const textHeight = shape.fontSize * 1.2;
        const padding = 8;

        return (
          point.x >= shape.x - 2 &&
          point.x <= shape.x + textWidth + padding + 2 &&
          point.y >= shape.y - 2 &&
          point.y <= shape.y + textHeight + padding + 2
        );
      default:
        return false;
    }
  };

  const distanceToLineSegment = (
    point: Point,
    lineStart: Point,
    lineEnd: Point,
  ): number => {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSquare = C * C + D * D;
    let param = -1;
    if (lenSquare !== 0) param = dot / lenSquare;

    let xx, yy;

    if (param < 0) {
      xx = lineStart.x;
      yy = lineStart.y;
    } else if (param > 1) {
      xx = lineEnd.x;
      yy = lineEnd.y;
    } else {
      xx = lineStart.x + param * C;
      yy = lineStart.y + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  return {
    viewport,
    dispatch,
  };
};
