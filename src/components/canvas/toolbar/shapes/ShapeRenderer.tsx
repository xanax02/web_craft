import { Arrow } from "./arrow";
import { Elipse } from "./elipse";
import { Frame } from "./frame";
import GeneratedUI from "./generatedUI/GeneratedUI";
import { Line } from "./line";
import { Rectangle } from "./rectangle";
import { Stroke } from "./stroke";
import { Text } from "./text";

type Props = {
  shape: any;
  toggleInspiration?: () => void;
  toggleChat?: (generatedUUId: string) => void;
  generateWorkflow?: (generatedUUId: string) => void;
  exportDesign?: (generatedUUId: string, element: HTMLElement | null) => void;
};

export default function ShapeRenderer({
  shape,
  toggleInspiration = () => {},
  toggleChat,
  generateWorkflow,
  exportDesign,
}: Props) {
  switch (shape.type) {
    case "frame":
      return <Frame shape={shape} toggleInspiration={toggleInspiration} />;
    case "rect":
      return <Rectangle shape={shape} />;
    case "ellipse":
      return <Elipse shape={shape} />;
    case "freedraw":
      return <Stroke shape={shape} />;
    case "arrow":
      return <Arrow shape={shape} />;
    case "line":
      return <Line shape={shape} />;
    case "text":
      return <Text shape={shape} />;
    case "generatedui":
      return (
        <GeneratedUI
          shape={shape}
          toggleChat={toggleChat!}
          generateWorkflow={generateWorkflow!}
          exportDesign={exportDesign!}
        />
      );
    default:
      return null;
  }
}
