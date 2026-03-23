"use client";
import {
  addArrow,
  addEllipse,
  addFrame,
  addFreeDrawShape,
  addLine,
  addRect,
  addText,
  clearSelection,
  removeShape,
  selectShape,
  setTool,
  Shape,
  Tool,
  updateShape,
} from "@/redux/slice/shapes";
import {
  handToolDisable,
  handToolEnable,
  panEnd,
  panMove,
  panStart,
  Point,
  screenToWorld,
  wheelPan,
  wheelZoom,
} from "@/redux/slice/viewport";
import { AppDispatch, useAppDispatch, useAppSelector } from "@/redux/store";
import { useEffect, useRef, useState } from "react";

const RAF_INTERVAL_MS = 8;

interface TouchPointer {
  id: number;
  p: Point;
}

interface DraftShap {
  type: "frame" | "rect" | "ellipse" | "arrow" | "line";
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
  const hasSelectedText = Object.keys(selectedShapes).some((id: string) => {
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
        points?: Point[];
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
    initialBounds: { x: number; y: number; w: number; h: number };
    startPoint: { x: number; y: number };
  } | null>(null);

  //for animation
  const lastFreehandFrameRef = useRef(0);
  //store requestAnimationFrameId for freeHand
  const freehandRafRef = useRef<number | null>(null);
  //store requestAnimationFrameId for pan
  const panRafRef = useRef<number | null>(null);
  //holds latest pan position that needs to be applied.
  const pendingPanPointRef = useRef<Point | null>(null);

  // updating refs
  const [, force] = useState(0);
  const requestRender = (): void => {
    force((n: number) => (n + 1) | 0);
  };

  //coordinate conversion = viwport coords -> canvas div coords
  //   calculated relative to top left corner of viewport
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

  //getting the top shape at a point
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
    const A = point.x - lineStart.x; // x component of vector from lineStart to point
    const B = point.y - lineStart.y; // y component of vector from lineStart to point
    const C = lineEnd.x - lineStart.x; // x component of vector from lineStart to lineEnd
    const D = lineEnd.y - lineStart.y; // y component of vector from lineStart to lineEnd

    //dot product will give the projection of  point on line
    // there are two vectors here AA -> (A,B) and BB -> (C,D)
    // dot product is given by sum of product of x components and y components of vectors
    const dot = A * C + B * D;
    const lenSquare = C * C + D * D;
    // the param will give us the ratio from linestart to projection of point on line segment
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

    //relative distance bewteen line segment and point
    const dx = point.x - xx;
    const dy = point.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  //performace optimisation and animation

  //the below function will reduce the number of dispatch to
  //1 dispatch per frame for fast
  const schedulePanMove = (p: Point) => {
    pendingPanPointRef.current = p;
    // if raf id already present early return
    if (panRafRef.current !== null) return;

    // else get the rafId to throttle and only make this reff null
    // when the next frame is schedule
    // which will be done by callback
    panRafRef.current = window.requestAnimationFrame(() => {
      panRafRef.current = null;
      const next = pendingPanPointRef.current;
      //dispatch throttled action
      if (next) dispatch(panMove(next));
    });
  };

  // RAF throttle loop for freehand drawing
  const freehandTick = (): void => {
    //more accurate than Date.now()
    const now = performance.now();

    //lastFreehandFrameRef stores the last timestamp of the render
    // if it was earlier than RAF_INTERVAL we trigger rerender
    //if on a 60hz monitor this check is not necessay as the Tick function will run 60 times per second
    //but for 144hz monitors this check is necessary to prevent too many renders
    // basically this check will only work for monitor with more than 125hz refresh rate
    if (now - lastFreehandFrameRef.current >= RAF_INTERVAL_MS) {
      //if there are any points in freeDrawPointsRef - render
      if (freeDrawPointsRef.current.length > 0) requestRender();
      //latest timestamp of rendered frame
      lastFreehandFrameRef.current = now;
    }

    //if user is still drawing start loop
    if (isDrawingRef.current) {
      //freehandRafRef will have id of the last scheduled frame so we can cancel it if needed
      // and also requestAnimationFrame will call the freehandTick callback to start rendering loop.
      freehandRafRef.current = window.requestAnimationFrame(freehandTick);
    }
  };

  //scroll event handler
  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const originScreen = localPointFromClient(e.clientX, e.clientY);

    console.log("dispatching wheel event");

    //for zooming
    if (e.ctrlKey || e.metaKey) {
      dispatch(wheelZoom({ deltaY: e.deltaY, originScreen }));
    } else {
      const dx = e.shiftKey ? e.deltaY : e.deltaX;
      const dy = e.shiftKey ? 0 : e.deltaY;
      dispatch(wheelPan({ dx: -dx, dy: -dy }));
    }
  };

  //onClick
  const onPointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    const target = e.target as HTMLElement;

    //for clicking toolbar and other buttons that lives on canvas
    // to prevent drawing while clicking on toolbar
    const isButton =
      target.tagName === "BUTTON" ||
      target.closest("button") ||
      target.classList.contains("pointer-events-auto") ||
      target.closest(".pointer-events-auto");

    if (!isButton) {
      e.preventDefault();
    } else {
      return;
    }

    //local mouse position inside of a div
    //nativeEvent is the raw Event of browser as react uses synthetic event
    const local = getLocalPointFromPtr(e.nativeEvent);
    //coordinates inside infinite world of canvas
    const world = screenToWorld(local, viewport.translate, viewport.scale);

    // if its the first finger on touchpad or first keydown on mouse
    if (touchMapRef.current.size === 0) {
      //this locks the pointerevent to canvas evnen if pointer goes outside canvas
      // and mouseUp event gets triggered outside the canvas that will still be captured inside canvas
      canvasRef.current?.setPointerCapture?.(e.pointerId);
      const isPanButton = e.button === 1 || e.button === 2;
      const panByShift = isSpacePressed.current && e.button === 0;

      if (isPanButton || panByShift) {
        const mode = isSpacePressed.current ? "shiftPanning" : "panning";
        dispatch(panStart({ screen: local, mode }));
        return;
      }

      if (e.button === 0) {
        // if the tool is 'select' then run selection logic
        // that includes adding the hit shape (shape that is under or near pointer)
        // in redux shape slice selected array
        // and snapshotting the current positions of these selected shapes in case user wants to move them.
        // this will also store coords of world at which pointer down event happened in moveStartRef
        if (currentTool === "select") {
          const hitShape = getShapeAtPoint(world);
          if (hitShape) {
            const isAlreadySelected = selectedShapes[hitShape.id];
            // if the shape is not selected yet select it
            if (!isAlreadySelected) {
              //clear already selected shapes if clicking new shape
              // and only if shift is not pressed
              if (!e.shiftKey) dispatch(clearSelection());
              dispatch(selectShape(hitShape.id));
            }
            // so this is so that it get handled in onPointer move
            isMovingRef.current = true;
            // capture world coordinates when move starts
            moveStartRef.current = world;

            //why this is created as the delta -> which is the distace shapes has moved
            // should be calulated with the initial position of the shapes
            // not the current posistion as on  drag the current position keeps changing
            // so this initial position is only created when pointer down event happens on a shape
            initialShapePositionsRef.current = {};
            // snapshotting all the selected shapes positions
            Object.keys(selectedShapes).forEach((id) => {
              const shape = entityState.entities[id];
              if (shape) {
                if (
                  shape.type === "rect" ||
                  shape.type === "frame" ||
                  shape.type === "ellipse" ||
                  shape.type === "generatedui"
                ) {
                  initialShapePositionsRef.current[id] = {
                    x: shape.x,
                    y: shape.y,
                  };
                } else if (shape.type === "freedraw") {
                  initialShapePositionsRef.current[id] = {
                    points: [...shape.points],
                  };
                } else if (shape.type === "arrow" || shape.type === "line") {
                  initialShapePositionsRef.current[id] = {
                    startX: shape.startX,
                    startY: shape.startY,
                    endX: shape.endX,
                    endY: shape.endY,
                  };
                } else if (shape.type === "text") {
                  initialShapePositionsRef.current[id] = {
                    x: shape.x,
                    y: shape.y,
                  };
                }
              }
            });

            //now snapshotting the hitshape
            //this look redundant but there is a subtle reason for it
            // on dispatching the new selected shape in will update the redux and its selected shape slice
            // but this current closure will not have the updated data of this new shape
            // so to include this new shape in the snapshot, we need to do it here
            if (
              hitShape.type === "frame" ||
              hitShape.type === "rect" ||
              hitShape.type === "ellipse" ||
              hitShape.type === "generatedui"
            ) {
              initialShapePositionsRef.current[hitShape.id] = {
                x: hitShape.x,
                y: hitShape.y,
              };
            } else if (hitShape.type === "freedraw") {
              initialShapePositionsRef.current[hitShape.id] = {
                points: [...hitShape.points],
              };
            } else if (hitShape.type === "arrow" || hitShape.type === "line") {
              initialShapePositionsRef.current[hitShape.id] = {
                startX: hitShape.startX,
                endX: hitShape.endX,
                startY: hitShape.startY,
                endY: hitShape.endY,
              };
            } else if (hitShape.type === "text") {
              initialShapePositionsRef.current[hitShape.id] = {
                x: hitShape.x,
                y: hitShape.y,
              };
            }
          } else {
            // clicked on emtpy space
            //clear the selected array
            // and blur any active text input
            if (!e.shiftKey) {
              dispatch(clearSelection());
              blurActiveTextInput();
            }
          }
        } else if (currentTool === "eraser") {
          // bool for erasing this indicates erasing has started
          isErasingRef.current = true;
          //erasedShapesRef is a set of strings to store ids of shapes
          // that have been deleted in current erase gesture.
          // clear it to have the current gesture erased shapes.
          erasedShapesRef.current.clear();

          const hitShape = getShapeAtPoint(world);
          if (hitShape) {
            // this dispatch logic was added by me if in future bug came try removing this
            //
            //what its doing is -> it is removing the shape that is under pointer
            dispatch(removeShape(hitShape.id));
            erasedShapesRef.current.add(hitShape.id);
          } else {
            blurActiveTextInput();
          }
        } else if (currentTool === "text") {
          dispatch(addText({ x: world.x, y: world.y }));
          dispatch(setTool("select"));
        } else {
          // if current tool is for drawing the below figures
          // on pointer watches isDrawingRef so for drawing with drag it is set true
          isDrawingRef.current = true;
          if (
            currentTool === "rect" ||
            currentTool === "ellipse" ||
            currentTool === "frame" ||
            currentTool === "arrow" ||
            currentTool === "line"
          ) {
            console.log("starting to draw:", currentTool, "at", world);
            draftShapeRef.current = {
              type: currentTool, // current shape
              startWorld: world, //when user clicked -> anchor point
              currentWorld: world, // where pointer is currently -> keeps on updating on every move
            };
            // so that this comp gets render and in the draft shape preview, gets the updated data
            // that can only happen if react re- renders other wise the draftshape data will only remain
            // here.
            requestRender();
            // the above have also be optimzed like freedraw
          } else if (currentTool === "freedraw") {
            //for freehand every point is required when pointer moves
            // so storing that data in array
            freeDrawPointsRef.current = [world];
            //this stores the last freehand frame time to for throllting in freehandTick
            lastFreehandFrameRef.current = performance.now();
            // this will start the freehandTick loop till isDrawing is true
            freehandRafRef.current = window.requestAnimationFrame(freehandTick);
            requestRender();
          }
        }
      }
    }
  };

  const onPointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    const local = getLocalPointFromPtr(e.nativeEvent);
    const world = screenToWorld(local, viewport.translate, viewport.scale);

    if (viewport.mode === "panning" || viewport.mode === "shiftPanning") {
      schedulePanMove(local);
      return;
    }

    if (isErasingRef.current && currentTool === "eraser") {
      const hitShape = getShapeAtPoint(world);
      if (hitShape && !erasedShapesRef.current.has(hitShape.id)) {
        // delete the shape if not deleted, in this drag
        dispatch(removeShape(hitShape.id));
        erasedShapesRef.current.add(hitShape.id);
      }
    }

    if (
      isMovingRef.current &&
      moveStartRef.current &&
      currentTool === "select"
    ) {
      const deltaX = world.x - moveStartRef.current.x;
      const deltaY = world.y - moveStartRef.current.y;

      Object.keys(initialShapePositionsRef.current).forEach((id) => {
        const initialPos = initialShapePositionsRef.current[id];
        const shape = entityState.entities[id];

        if (shape && initialPos) {
          if (
            shape.type === "frame" ||
            shape.type === "rect" ||
            shape.type === "ellipse" ||
            shape.type === "text" ||
            shape.type === "generatedui"
          ) {
            if (
              typeof initialPos.x === "number" &&
              typeof initialPos.y === "number"
            ) {
              dispatch(
                updateShape({
                  id,
                  patch: {
                    x: initialPos.x + deltaX,
                    y: initialPos.y + deltaY,
                  },
                }),
              );
            }
          } else if (shape.type === "freedraw") {
            const initialPoints = initialPos.points;
            if (initialPoints) {
              const newPoints = initialPoints.map((point) => ({
                x: point.x + deltaX,
                y: point.y + deltaY,
              }));
              dispatch(
                updateShape({
                  id,
                  patch: {
                    points: newPoints,
                  },
                }),
              );
            }
          } else if (shape.type === "line" || shape.type === "arrow") {
            if (
              typeof initialPos.startX === "number" &&
              typeof initialPos.startY === "number" &&
              typeof initialPos.endX === "number" &&
              typeof initialPos.endY === "number"
            ) {
              dispatch(
                updateShape({
                  id,
                  patch: {
                    startX: initialPos.startX + deltaX,
                    startY: initialPos.startY + deltaY,
                    endX: initialPos.endX + deltaX,
                    endY: initialPos.endY + deltaY,
                  },
                }),
              );
            }
          }
        }
      });
    }

    if (isDrawingRef.current) {
      if (draftShapeRef.current) {
        draftShapeRef.current.currentWorld = world;
        requestRender();
      } else if (currentTool === "freedraw") {
        freeDrawPointsRef.current.push(world);
      }
    }
  };

  const finalizeDrawingIfAny = (): void => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    if (freehandRafRef.current) {
      window.cancelAnimationFrame(freehandRafRef.current);
      freehandRafRef.current = null;
    }

    const draft = draftShapeRef.current;

    if (draft) {
      const x = Math.min(draft.startWorld.x, draft.currentWorld.x);
      const y = Math.min(draft.startWorld.y, draft.currentWorld.y);
      const w = Math.abs(draft.currentWorld.x - draft.startWorld.x);
      const h = Math.abs(draft.currentWorld.y - draft.startWorld.y);

      if (w > 1 && h > 1) {
        if (draft.type === "frame") {
          console.log("Adding frame shape:", { x, y, w, h });
          dispatch(addFrame({ x, y, w, h }));
        } else if (draft.type === "rect") {
          dispatch(addRect({ x, y, w, h }));
        } else if (draft.type === "ellipse") {
          dispatch(addEllipse({ x, y, w, h }));
        } else if (draft.type === "arrow") {
          dispatch(
            addArrow({
              startX: draft.startWorld.x,
              startY: draft.startWorld.y,
              endX: draft.currentWorld.x,
              endY: draft.currentWorld.y,
            }),
          );
        } else if (draft.type === "line") {
          dispatch(
            addLine({
              startX: draft.startWorld.x,
              startY: draft.startWorld.y,
              endX: draft.currentWorld.x,
              endY: draft.currentWorld.y,
            }),
          );
        }
      }
      draftShapeRef.current = null;
    } else if (currentTool === "freedraw") {
      const pts = freeDrawPointsRef.current;
      if (pts.length > 1) {
        dispatch(addFreeDrawShape({ points: pts }));
      }
      freeDrawPointsRef.current = [];
    }
    requestRender();
  };

  const onPointerUp: React.PointerEventHandler<HTMLDivElement> = (e) => {
    canvasRef.current?.releasePointerCapture(e.pointerId);

    if (viewport.mode === "panning" || viewport.mode === "shiftPanning") {
      dispatch(panEnd());
    }

    if (isMovingRef.current) {
      isMovingRef.current = false;
      moveStartRef.current = null;
      initialShapePositionsRef.current = {};
    }

    if (isErasingRef.current) {
      isErasingRef.current = false;
      erasedShapesRef.current.clear();
    }

    finalizeDrawingIfAny();
  };

  const onPointerCancel: React.PointerEventHandler<HTMLDivElement> = (e) => {
    // canvasRef.current?.releasePointerCapture(e.pointerId);
    onPointerUp(e);
  };

  const onKeyDown = (e: KeyboardEvent): void => {
    if ((e.code === "ShiftLeft" || e.code === "ShiftRight") && !e.repeat) {
      e.preventDefault();
      isSpacePressed.current = true;
      dispatch(handToolEnable());
    }
  };

  const onKeyUp = (e: KeyboardEvent): void => {
    if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
      e.preventDefault();
      isSpacePressed.current = false;
      dispatch(handToolDisable());
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
      if (freehandRafRef.current) {
        window.cancelAnimationFrame(freehandRafRef.current);
      }
      if (panRafRef.current) window.cancelAnimationFrame(panRafRef.current);
    };
  }, []);

  //   handling resizing
  useEffect(() => {
    const handleResizeStart = (e: CustomEvent) => {
      const { shapeId, corner, bounds } = e.detail;
      isResizingRef.current = true;

      resizeDataRef.current = {
        shapeId,
        corner,
        initialBounds: bounds,
        startPoint: { x: e.detail.clientX || 0, y: e.detail.clientY || 0 },
      };
    };

    const handleResizeMove = (e: CustomEvent) => {
      if (!isResizingRef.current || !resizeDataRef.current) return;

      const { shapeId, corner, initialBounds } = resizeDataRef.current;
      const { clientX, clientY } = e.detail;

      const canvasEl = canvasRef.current;

      if (!canvasEl) return;

      const rect = canvasEl.getBoundingClientRect();
      const localX = clientX - rect.left;
      const localY = clientY - rect.top;

      const world = screenToWorld(
        { x: localX, y: localY },
        viewport.translate,
        viewport.scale,
      );

      const shape = entityState.entities[shapeId];

      if (!shape) return;

      const newBounds = { ...initialBounds };

      switch (corner) {
        case "nw":
          newBounds.w = Math.max(
            10,
            initialBounds.w + (initialBounds.x - world.x),
          );
          newBounds.h = Math.max(
            10,
            initialBounds.h + (initialBounds.y - world.y),
          );
          newBounds.x = world.x;
          newBounds.y = world.y;
          break;
        case "ne":
          newBounds.w = Math.max(10, world.x - initialBounds.x);
          newBounds.h = Math.max(
            10,
            initialBounds.h + (initialBounds.y - world.y),
          );
          newBounds.y = world.y;
          break;
        case "sw":
          newBounds.w = Math.max(
            10,
            initialBounds.w + (initialBounds.x - world.x),
          );
          newBounds.h = Math.max(10, world.y - initialBounds.y);
          newBounds.x = world.x;
          break;
        case "se":
          newBounds.w = Math.max(10, world.x - initialBounds.x);
          newBounds.h = Math.max(10, world.y - initialBounds.y);
          break;
      }

      if (
        shape.type === "frame" ||
        shape.type === "rect" ||
        shape.type === "ellipse"
      ) {
        dispatch(
          updateShape({
            id: shapeId,
            patch: {
              x: newBounds.x,
              y: newBounds.y,
              w: newBounds.w,
              h: newBounds.h,
            },
          }),
        );
      } else if (shape.type === "freedraw") {
        const xs = shape.points.map((p: { x: number; y: number }) => p.x);
        const ys = shape.points.map((p: { x: number; y: number }) => p.y);

        const actualMinX = Math.min(...xs);
        const actualMinY = Math.min(...ys);
        const actualMaxX = Math.max(...xs);
        const actualMaxY = Math.max(...ys);
        const actualWidth = actualMaxX - actualMinX;
        const actualHeight = actualMaxY - actualMinY;

        const newActualX = newBounds.x + 5;
        const newActualY = newBounds.y + 5;
        const newActualWidth = Math.max(10, newBounds.w - 10);
        const newActualHeight = Math.max(10, newBounds.h - 10);

        const scaleX = actualWidth > 0 ? newActualWidth / actualWidth : 1;
        const scaleY = actualHeight > 0 ? newActualHeight / actualHeight : 1;

        const scaledPoints = shape.points.map(
          (p: { x: number; y: number }) => ({
            x: newActualX + (p.x - actualMinX) * scaleX,
            y: newActualY + (p.y - actualMinY) * scaleY,
          }),
        );

        dispatch(
          updateShape({
            id: shapeId,
            patch: {
              points: scaledPoints,
            },
          }),
        );
      } else if (shape.type === "line" || shape.type === "arrow") {
        const actualMinX = Math.min(shape.startX, shape.endX);
        const actualMaxX = Math.max(shape.startX, shape.endX);
        const actualMinY = Math.min(shape.startY, shape.endY);
        const actualMaxY = Math.max(shape.startY, shape.endY);
        const actualWidth = actualMaxX - actualMinX;
        const actualHeight = actualMaxY - actualMinY;

        const newActualX = newBounds.x + 5;
        const newActualY = newBounds.y + 5;
        const newActualWidth = Math.max(10, newBounds.w - 10);
        const newActualHeight = Math.max(10, newBounds.h - 10);

        let newStartX, newStartY, newEndX, newEndY;
        if (actualWidth === 0) {
          newStartX = newActualX + newActualWidth / 2;
          newEndX = newActualX + newActualWidth / 2;
          newStartY =
            shape.startY < shape.endY
              ? newActualY
              : newActualY + newActualHeight;
          newEndY =
            shape.startY < shape.endY
              ? newActualY + newActualHeight
              : newActualY;
        } else if (actualHeight === 0) {
          newStartY = newActualY + newActualHeight / 2;
          newEndY = newActualY + newActualHeight / 2;
          newStartX =
            shape.startX < shape.endX
              ? newActualX
              : newActualX + newActualWidth;
          newEndX =
            shape.startX < shape.endX
              ? newActualX + newActualWidth
              : newActualX;
        } else {
          const scaleX = newActualWidth / actualWidth;
          const scaleY = newActualHeight / actualHeight;

          newStartX = newActualX + (shape.startX - actualMinX) * scaleX;
          newStartY = newActualY + (shape.startY - actualMinY) * scaleY;
          newEndX = newActualX + (shape.endX - actualMinX) * scaleX;
          newEndY = newActualY + (shape.endY - actualMinY) * scaleY;

          dispatch(
            updateShape({
              id: shapeId,
              patch: {
                startX: newStartX,
                startY: newStartY,
                endX: newEndX,
                endY: newEndY,
              },
            }),
          );
        }
      }
    };

    const handleResizeEnd = () => {
      isResizingRef.current = false;
      resizeDataRef.current = null;
    };

    window.addEventListener(
      "shape-resize-start",
      handleResizeStart as EventListener,
    );
    window.addEventListener(
      "shape-resize-move",
      handleResizeMove as EventListener,
    );
    window.addEventListener(
      "shape-resize-end",
      handleResizeEnd as EventListener,
    );

    return () => {
      window.removeEventListener(
        "shape-resize-start",
        handleResizeStart as EventListener,
      );
      window.removeEventListener(
        "shape-resize-move",
        handleResizeMove as EventListener,
      );
      window.removeEventListener(
        "shape-resize-end",
        handleResizeEnd as EventListener,
      );
    };
  }, [dispatch, entityState.entities, viewport.translate, viewport.scale]);

  // connecting hook to actual dom
  const attachCanvasRef = (ref: HTMLDivElement | null): void => {
    console.log("ref attached", ref);
    // clean up any existing event listeners on the old canvas
    if (canvasRef.current) {
      canvasRef.current.removeEventListener("wheel", onWheel);
    }
    // store new canvas reference
    canvasRef.current = ref;

    // add wheel event listeners to new canvas
    if (ref) {
      console.log("attaching wheel event");
      ref.addEventListener("wheel", onWheel, { passive: false, capture: true });
    }
  };

  const selectTool = (tool: Tool): void => {
    dispatch(setTool(tool));
  };

  const getDraftShape = (): DraftShap | null => draftShapeRef.current;
  const getFreeDrawPoints = (): ReadonlyArray<Point> =>
    freeDrawPointsRef.current;

  return {
    viewport,
    shapes: shapeList,
    currentTool,
    selectedShapes,

    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,

    attachCanvasRef,
    selectTool,
    getDraftShape,
    getFreeDrawPoints,
    isSidebarOpen,
    hasSelectedText,
    setIsSidebarOpen,
  };
};
