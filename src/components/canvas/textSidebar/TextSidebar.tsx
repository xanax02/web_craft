"use client";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";
import { TextShape, updateShape } from "@/redux/slice/shapes";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { Bold, Italic, Strikethrough, Underline } from "lucide-react";

interface TextSidebarProps {
  isOpen: boolean;
}

export default function TextSidebar({ isOpen }: TextSidebarProps) {
  const dispatch = useAppDispatch();

  const selectedShapes = useAppSelector((s) => s.shapes.selected);
  const shapesEntities = useAppSelector((s) => s.shapes.shapes.entities);

  const selectedTextShape = Object.keys(selectedShapes)
    .map((id: any) => shapesEntities[id])
    .find((shape: any) => shape?.type === "text") as TextShape | undefined;

  const updateTextProperty = (property: keyof TextShape, value: any) => {
    if (!selectedTextShape) return;

    dispatch(
      updateShape({
        id: selectedTextShape.id,
        patch: {
          [property]: value,
        },
      }),
    );
  };

  //   if (!open || !selectedTextShape) return null;

  const fontFamilies = [
    "Inter, sans-serif",
    "Arial, sans-serif",
    "Helvetica, sans-serif",
    "Georgia, serif",
    "Times New Roman, serif",
    "Courier New, monospace",
    "Monaco, monospace",
    "system-ui, sans-serif",
  ];

  return (
    <div
      className={cn(
        "fixed right-5 top-1/2 transform -translate-y-1/2 w-80 backdrop-blur-xl bg-white/8 border-white/12 gap-2 p-3 saturate-150 border rounded-lg z-50 transition-transform duration-300",
        true ? "translate-x-0" : "translate-x-full",
      )}
    >
      <div className="p-4 flex flex-col gap-10 overflow-y-auto max-h-[calc(100vh-8rem)]">
        <div className="space-y-2">
          <Label className="text-white/80">Font Family</Label>
          <Select
            value={selectedTextShape?.fontFamily}
            onValueChange={(value) => updateTextProperty("fontFamily", value)}
          >
            <SelectTrigger className="bg-white/5 border-white/10 w-full text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-black/90 border-white/10">
              {fontFamilies.map((font) => (
                <SelectItem key={font} value={font}>
                  <span style={{ fontFamily: font }}>{font.split(",")[0]}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-white/80">
            Font Size: {selectedTextShape?.fontSize}px
          </Label>
          <Slider
            value={[selectedTextShape?.fontSize ?? 16]}
            onValueChange={([value]) => updateTextProperty("fontSize", value)}
            min={8}
            max={128}
            step={1}
            className="w-full"
          />
        </div>
        <div>
          <Label className="text-white/80">
            Font Weight : {selectedTextShape?.fontWeight}
          </Label>
          <Slider
            value={[selectedTextShape?.fontWeight ?? 400]}
            onValueChange={([value]) => updateTextProperty("fontWeight", value)}
            min={100}
            max={900}
            step={100}
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-white/80">Style</Label>
          <div className="flex gap-2">
            <Toggle
              pressed={(selectedTextShape?.fontWeight ?? 400) >= 600}
              onPressedChange={(pressed) =>
                updateTextProperty("fontWeight", pressed ? 700 : 400)
              }
              className="data-[state=on]:bg-blue-500 data-[state=on]:text-white"
            >
              <Bold className="w-4 h-4" />
            </Toggle>
            <Toggle
              pressed={selectedTextShape?.fontStyle === "italic"}
              onPressedChange={(pressed) =>
                updateTextProperty("fontStyle", pressed ? "italic" : "normal")
              }
              className="data-[state=on]:bg-blue-500 data-[state=on]:text-white"
            >
              <Italic className="w-4 h-4" />
            </Toggle>
            <Toggle
              pressed={selectedTextShape?.textDecoration === "underline"}
              onPressedChange={(pressed) =>
                updateTextProperty(
                  "textDecoration",
                  pressed ? "underline" : "none",
                )
              }
              className="data-[state=on]:bg-blue-500 data-[state=on]:text-white"
            >
              <Underline className="w-4 h-4" />
            </Toggle>
            <Toggle
              pressed={selectedTextShape?.textDecoration === "line-through"}
              onPressedChange={(pressed) =>
                updateTextProperty(
                  "textDecoration",
                  pressed ? "line-through" : "none",
                )
              }
              className="data-[state=on]:bg-blue-500 data-[state=on]:text-white"
            >
              <Strikethrough className="w-4 h-4" />
            </Toggle>
          </div>
        </div>
      </div>
    </div>
  );
}
