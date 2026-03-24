import { FrameShape, Shape } from "@/redux/slice/shapes";
import { useAppSelector } from "@/redux/store";
import { useState } from "react";

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
        ctx.beginPath();
        ctx.roundRect(relativeX, relativeY, shape.w, shape.h, borderRadius);
        ctx.stroke();
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
          0,
          0,
          2 * Math.PI,
        );
        ctx.stroke();
      }
      break;
    case "text":
      const textRelativeX = shape.x - frameX;
      const textRelativeY = shape.y - frameY;
      ctx.fillStyle = shape.fill || "#ffffff";
      ctx.font = `${shape.fontSize || 16}px ${shape.fontFamily || "Inter, sans-serif"}`;
      ctx.fillText(shape.text || "", textRelativeX, textRelativeY);
      break;
    case "freedraw":
      if (shape.points.length > 1) {
        ctx.strokeStyle = shape.stroke || "ffffff";
        ctx.lineWidth = shape.strokeWidth || 2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        const firstPoint = shape.points[0];
        ctx.moveTo(firstPoint.x - frameX, firstPoint.y - frameY);
        for (let i = 1; i < shape.points.length; i++) {
          const point = shape.points[i];
          ctx.lineTo(point.x - frameX, point.y - frameY);
        }
        ctx.stroke();
      }
      break;
    case "line":
      ctx.strokeStyle = shape.stroke || "ffffff";
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
  ctx.clip();

  shapesInFrame.forEach((shape) => {
    renderShapeOnCanvas(ctx, shape, frame.x, frame.y);
  });
};

//frame -> snapshot(image) -> ai api -> generateUI

export const useFrame = (shape: FrameShape) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const allShapes = useAppSelector((state) => {
    return Object.values(state.shapes.shapes?.entities || {}).filter(
      (shape): shape is Shape => shape !== undefined,
    );
  });

  const handleGenerateDesign = async () => {
    try {
      setIsGenerating(true);
      const snapshot = await generateFrameSnapshot(shape, allShapes);
    } catch (error) {
    } finally {
      setIsGenerating(false);
    }
  };

  return { isGenerating, handleGenerateDesign };
};
