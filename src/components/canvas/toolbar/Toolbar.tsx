import HistoryPill from "./history/HistoryPill";
import ToolbarShapes from "./shapes/ToolbarShapes";
import ZoomBar from "./zoom/ZoomBar";

export default function Toolbar() {
  return (
    <div className="fixed bottom-0 w-full grid grid-cols-3 z-50 p-5">
      <HistoryPill />
      <ToolbarShapes />
      <ZoomBar />
    </div>
  );
}
