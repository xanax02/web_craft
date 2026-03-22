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
  return <div>asdl;kfjsdf</div>;
}
