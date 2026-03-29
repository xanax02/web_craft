import { useUpdateContainer } from "@/hooks/useStyles";
import { GeneratedUIShape } from "@/redux/slice/shapes";

type Props = {
  shape: GeneratedUIShape;
  toggleChat: (generatedUIId: string) => void;
  generateWorkflow: (generatedUIId: string) => void;
  exportDesign: (generatedUIId: string, element: HTMLElement | null) => void;
};

export default function GeneratedUI({
  shape,
  toggleChat,
  generateWorkflow,
  exportDesign,
}: Props) {
  const { containerRef, sanitizedHtml } = useUpdateContainer(shape);

  return (
    <div
      ref={containerRef}
      className="absolute pointer-events-none"
      style={{
        left: shape.x,
        top: shape.y,
        width: shape.w,
        height: "auto",
      }}
    ></div>
  );
}
