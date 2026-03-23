type Props = {
  shape: any;
  toggleInspiration: () => void;
  toggleChat: (generatedUUId: string) => void;
  generateWorkflow: (generatedUUId: string) => void;
  exportDesign: (generatedUUId: string, element: HTMLElement | null) => void;
};

export default function ShapeRenderer({
  shape,
  toggleInspiration,
  toggleChat,
  generateWorkflow,
  exportDesign,
}: Props) {
  switch (shape) {
    case "frame":
      return <Frame shape={shape} toggleInspiration={toggleInspiration} />;
    case "rect":
      return <Rectangle shape={shape} />;
    case "ellipse":
      return <Ellipse shape={shape} />;
    case "freedraw":
      return <Stroke shape={shape} />;
    case "arrow":
      return <Arrow shape={shape} />;
    case "line":
      return <Line shpe={shape} />;
    case "text":
      return <Text shape={shape} />;
  }
}
