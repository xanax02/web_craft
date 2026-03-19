"use client";
import { Button } from "@/components/ui/button";
import { useInfiniteCanvas } from "@/hooks/useInfiniteCanvas";
import { cn } from "@/lib/utils";
import { Tool } from "@/redux/slice/shapes";
import {
  ArrowRight,
  Circle,
  Eraser,
  Hash,
  Minus,
  MousePointer2,
  Pencil,
  Square,
  Type,
} from "lucide-react";

const tools: Array<{
  id: Tool;
  icon: React.ReactNode;
  label: string;
  description: string;
}> = [
  {
    id: "select",
    icon: <MousePointer2 className="w-4 h-4" />,
    label: "Select",
    description: "Select shapes",
  },
  {
    id: "frame",
    icon: <Hash className="w-4 h-4" />,
    label: "Frame",
    description: "Create a frame",
  },
  {
    id: "rect",
    icon: <Square className="w-4 h-4" />,
    label: "Rectangle",
    description: "Draw rectangles",
  },
  {
    id: "ellipse",
    icon: <Circle className="w-4 h-4" />,
    label: "Circle",
    description: "Draw ellipses and circles",
  },
  {
    id: "freedraw",
    icon: <Pencil className="w-4 h-4" />,
    label: "Free Draw",
    description: "Draw freehand lines",
  },
  {
    id: "arrow",
    icon: <ArrowRight className="w-4 h-4" />,
    label: "Arrow",
    description: "Draw arrows with directions",
  },
  {
    id: "line",
    icon: <Minus className="w-4 h-4" />,
    label: "Line",
    description: "Draw lines",
  },
  {
    id: "text",
    icon: <Type className="w-4 h-4" />,
    label: "Text",
    description: "Add text",
  },
  {
    id: "eraser",
    icon: <Eraser className="w-4 h-4" />,
    label: "Eraser",
    description: "Erase shapes",
  },
];

export default function ToolbarShapes() {
  const { currentTool, selectTool } = useInfiniteCanvas();

  return (
    <div className="col-span-1 flex justify-center items-center">
      <div className="flex items-center backdrop-blur-xl backdrop-[url('#displacementFilter')] bg-white/8 border border-white/12 gap-2 rounded-full p-3 saturate-150">
        {tools.map((tool) => (
          <Button
            key={tool.id}
            variant={"ghost"}
            className={cn(
              "cursor-pointer rounded-full p-3",
              currentTool === tool.id
                ? "text-neutral-300 bg-white/12 border border-white/16"
                : "text-neutral-100 hover:bg-white/6 border border-transparent",
            )}
            onClick={() => selectTool(tool.id)}
            title={`${tool.label} - ${tool.description}`}
          >
            {tool.icon}
          </Button>
        ))}
      </div>
    </div>
  );
}
