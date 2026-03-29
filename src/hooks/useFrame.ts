import {
  addGeneratedUI,
  FrameShape,
  Shape,
  updateShape,
} from "@/redux/slice/shapes";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { useState } from "react";
import { nanoid } from "@reduxjs/toolkit";
import { toast } from "sonner";

const isShapeInsideFrame = (shape: Shape, frame: FrameShape): boolean => {
  const frameLeft = frame.x;
  const frameTop = frame.y;
  const frameRight = frame.x + frame.w;
  const frameBottom = frame.y + frame.h;

  switch (shape.type) {
    case "rect":
    case "ellipse":
    case "frame":
      //check if shape center point is with in frame
      const centerX = shape.x + shape.w / 2;
      const centerY = shape.y + shape.h / 2;

      return (
        centerX >= frameLeft &&
        centerX <= frameRight &&
        centerY >= frameTop &&
        centerY <= frameBottom
      );
    case "text":
      //check if text bounds are within frame
      return (
        shape.x >= frameLeft &&
        shape.x <= frameRight &&
        shape.y >= frameTop &&
        shape.y <= frameBottom
      );

    case "freedraw":
      // check if any drawing points are within frame
      return shape.points.some(
        (point) =>
          point.x >= frameLeft &&
          point.x <= frameRight &&
          point.y >= frameTop &&
          point.y <= frameBottom,
      );

    case "line":
    case "arrow":
      //check if either start or end point is within frame
      const startInside =
        shape.startX >= frameLeft &&
        shape.startX <= frameRight &&
        shape.startY >= frameTop &&
        shape.startY <= frameBottom;
      const endInside =
        shape.endX >= frameLeft &&
        shape.endX <= frameRight &&
        shape.endY >= frameTop &&
        shape.endY <= frameBottom;
      return startInside || endInside;
    default:
      return false;
  }
};

const getShapesInsideFrame = (
  allShapes: Shape[],
  frame: FrameShape,
): Shape[] => {
  const shapesInFrame = allShapes.filter((shape) => {
    return shape.id !== frame.id && isShapeInsideFrame(shape, frame);
  });

  //   //dev purpose
  //   console.log(`Frame ${frame.frameNumber} capture:`, {
  //     totalShapes: allShapes.length,
  //     captured: shapesInFrame.length,
  //     captureTypes: shapesInFrame.map((s) => s.type),
  //   });

  return shapesInFrame;
};

const renderShapeOnCanvas = (
  ctx: CanvasRenderingContext2D,
  shape: Shape,
  frameX: number,
  frameY: number,
) => {
  ctx.save();

  switch (shape.type) {
    case "rect":
    case "ellipse":
    case "frame":
      const relativeX = shape.x - frameX;
      const relativeY = shape.y - frameY;

      if (shape.type === "rect" || shape.type === "frame") {
        ctx.strokeStyle =
          shape.stroke && shape.stroke !== "transparent"
            ? shape.stroke
            : "#ffffff";
        ctx.lineWidth = shape.strokeWidth || 2;

        const borderRadius = shape.type === "rect" ? 8 : 0;
        ctx.beginPath(); //ctx have list of line segments and curves so this clears drawing state
        // below is one of the path creation method
        ctx.roundRect(relativeX, relativeY, shape.w, shape.h, borderRadius); //adds a path for rectangle to current drawing state, it only defines the geometry
        ctx.stroke(); //the above is just defining the shape, this actually draws it
      } else if (shape.type === "ellipse") {
        ctx.strokeStyle =
          shape.stroke && shape.stroke !== "transparent"
            ? shape.stroke
            : "#ffffff";
        ctx.lineWidth = shape.strokeWidth || 2;
        ctx.beginPath();
        ctx.ellipse(
          relativeX + shape.w / 2,
          relativeY + shape.h / 2,
          shape.w / 2,
          shape.h / 2,
          0, // rotation (in radians)
          0, // start angle (in radians)
          2 * Math.PI, // end angle (in radians)
        );
        ctx.stroke();
      }
      break;
    case "text":
      const textRelativeX = shape.x - frameX;
      const textRelativeY = shape.y - frameY;
      ctx.fillStyle = shape.fill || "#ffffff";
      ctx.font = `${shape.fontSize || 16}px ${shape.fontFamily || "Inter, sans-serif"}`;
      ctx.fillText(shape.text || "", textRelativeX, textRelativeY); // this immediatly draws the text no need for ctx.stroke()
      break;
    case "freedraw":
      if (shape.points.length > 1) {
        ctx.strokeStyle = shape.stroke || "#ffffff";
        ctx.lineWidth = shape.strokeWidth || 2;
        //controls how ends of lines look
        ctx.lineCap = "round"; //gives smooth rounded tips
        // controls how corners are joined
        ctx.lineJoin = "round"; //prevent sharp spiky joins
        ctx.beginPath();
        const firstPoint = shape.points[0];
        ctx.moveTo(firstPoint.x - frameX, firstPoint.y - frameY); //lifts the pen and places it to a position without drawing
        for (let i = 1; i < shape.points.length; i++) {
          const point = shape.points[i];
          ctx.lineTo(point.x - frameX, point.y - frameY); // adds a straight line segment
        }
        ctx.stroke();
      }
      break;
    case "line":
      ctx.strokeStyle = shape.stroke || "#ffffff";
      ctx.lineWidth = shape.strokeWidth || 2;
      ctx.beginPath();
      ctx.moveTo(shape.startX - frameX, shape.startY - frameY);
      ctx.lineTo(shape.endX - frameX, shape.endY - frameY);
      ctx.stroke();
      break;
    case "arrow":
      ctx.strokeStyle = shape.stroke || "#ffffff";
      ctx.lineWidth = shape.strokeWidth || 2;
      ctx.beginPath();
      ctx.moveTo(shape.startX - frameX, shape.startY - frameY);
      ctx.lineTo(shape.endX - frameX, shape.endY - frameY);
      ctx.stroke();

      const headLength = 10;
      const angle = Math.atan2(
        //creates angle of arrowhead (in radian) , y coord comes first
        shape.endY - shape.startY,
        shape.endX - shape.startX,
      );

      const fillStyle = shape.stroke || "#ffffff";
      ctx.beginPath();
      ctx.moveTo(shape.endX - frameX, shape.endY - frameY);
      ctx.lineTo(
        shape.endX - frameX - headLength * Math.cos(angle - Math.PI / 6),
        shape.endY - frameY - headLength * Math.sin(angle - Math.PI / 6),
      );
      ctx.lineTo(
        shape.endX - frameX - headLength * Math.cos(angle + Math.PI / 6),
        shape.endY - frameY - headLength * Math.sin(angle + Math.PI / 6),
      );
      ctx.closePath();
      ctx.fillStyle = fillStyle;
      ctx.fill();
      break;
  }
  ctx.restore();
};

const generateFrameSnapshot = async (
  frame: FrameShape,
  allShapes: Shape[],
): Promise<Blob> => {
  const shapesInFrame = getShapesInsideFrame(allShapes, frame);
  const canvas = document.createElement("canvas");
  canvas.width = frame.w;
  canvas.height = frame.h;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // ctx.clip();

  shapesInFrame.forEach((shape) => {
    renderShapeOnCanvas(ctx, shape, frame.x, frame.y);
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to generate snapshot"));
        }
      },
      "image/png",
      1.0,
    );
  });
};

//downlod util
const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

//frame -> snapshot(image) -> ai api -> generateUI

export const useFrame = (shape: FrameShape) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const dispatch = useAppDispatch();

  const allShapes = useAppSelector((state) => {
    return Object.values(state.shapes.shapes?.entities || {}).filter(
      (shape): shape is Shape => shape !== undefined,
    );
  });

  const handleGenerateDesign = async () => {
    try {
      setIsGenerating(true);
      const snapshot = await generateFrameSnapshot(shape, allShapes);
      downloadBlob(snapshot, `frame-${shape.frameNumber}-snapshot.png`);

      const formData = new FormData();
      formData.append("image", snapshot, `frame-${shape.frameNumber}.png`);
      formData.append("frameNumber", shape.frameNumber.toString());

      const urlParams = new URLSearchParams(window.location.search);
      const projectId = urlParams.get("project");

      if (projectId) {
        formData.append("projectId", projectId);
      }

      const response = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `API request failed: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      const generatedUIPosition = {
        x: shape.x + shape.w + 50,
        y: shape.y,
        w: Math.max(400, shape.w),
        h: Math.max(300, shape.h),
      };

      const generatedUIId = nanoid();
      dispatch(
        addGeneratedUI({
          ...generatedUIPosition,
          id: generatedUIId,
          uiSpecData: null,
          sourceFrameId: shape.id,
        }),
      );

      //stream the response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      let accumulatedMarkup = "";

      let lastUpdateTime = 0;
      const UPDATE_THROTTLE_MS = 200;

      if (reader) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              dispatch(
                updateShape({
                  id: generatedUIId,
                  patch: { uiSpecData: accumulatedMarkup },
                }),
              );
              break;
            }

            const chunk = decoder.decode(value);
            accumulatedMarkup += chunk;

            const now = Date.now();
            if (now - lastUpdateTime >= UPDATE_THROTTLE_MS) {
              dispatch(
                updateShape({
                  id: generatedUIId,
                  patch: { uiSpecData: accumulatedMarkup },
                }),
              );
              lastUpdateTime = now;
            }
          }
        } catch (error) {
          console.error("Error reading stream:", error);
        } finally {
          reader?.releaseLock();
        }
      }
    } catch (error) {
      toast.error(
        `Failed to generate design: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return { isGenerating, handleGenerateDesign };
};
