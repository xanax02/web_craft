import { useQuery } from "convex/react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";

export default function Navbar() {
  const params = useSearchParams();
  const projectId = params.get("project");

  const pathName = usePathname();
  const hasCanvas = pathName.includes("canvas");
  const hasStyleGuide = pathName.includes("style-guide");

  const project = useQuery(
    api.projects.getPorject,
    projectId ? { projectId: projectId as Id<"projects"> } : "skip",
  );

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 p-6 fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center gap-4">
        <Link
          href="/client/"
          className="w-8 h-8 rounded-full border-3 border-white bg-black flex items-center justify-center"
        >
          <div className="w-4 h-4 rounded-full bg-white"></div>
        </Link>
        {!hasCanvas ||
          (!hasStyleGuide && (
            <div className="lg:inline-block hidden rounded-full text-primary/60 border border-white/[0.12] backdrop-blur-xl bg-white/[0.08] px-4 text-sm">
              Project / {project?.name}
            </div>
          ))}
      </div>
    </div>
  );
}
