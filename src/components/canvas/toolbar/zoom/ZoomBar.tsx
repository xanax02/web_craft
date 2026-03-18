import { Button } from "@/components/ui/button";
import { useInfiniteCanvas } from "@/hooks/useInfiniteCanvas";
import { setScale } from "@/redux/slice/viewport";
import { useAppDispatch } from "@/redux/store";
import { ZoomOut } from "lucide-react";

export default function ZoomBar() {
    const dispatch = useAppDispatch;

    const { viewport } = useInfiniteCanvas():

    const handleZoomOut = () => {
        const newScale = Math.max(viewport.scale /1.2, viewport.minScale);
        dispatch(setScale({scale: newScale}));
    }

  return (
    <div className="col-span-1 flex justify-end items-center">
      <div className="flex items-center gap-1 backdrop-blur-xl bg-white/8 border border-white/12 rounded-full p-3 saturate-150">
        <Button
          variant={"ghost"}
          size={"lg"}
          onClick={handleZoomOut}
          className="w-9 h-9 p-0 rounded-full cursor-pointer hover:bg-white/12 border border-transparent hover:border-white/16 transition-all"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4 text-primary/50" />
        </Button>
      </div>
    </div>
  );
}
