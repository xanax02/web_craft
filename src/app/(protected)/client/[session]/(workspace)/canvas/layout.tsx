import Toolbar from "@/components/canvas/toolbar/Toolbar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full h-screen">
      {children}
      <Toolbar />
    </div>
  );
}
