import InfiniteCanvas from "@/components/canvas/infiniteCanvas/InfiniteCanvas";
import ProjectProvider from "@/components/projects/provider/ProjectProvider";
import { ProjectQuery, ProjectsQuery } from "@/convex/query.config";

interface CanvasPageProps {
  searchParams: Promise<{ project?: string }>;
}

export default async function Page({ searchParams }: CanvasPageProps) {
  const params = await searchParams;
  const projectId = params.project;

  if (!projectId) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <p className="text-muted-foreground">No Project selected</p>
      </div>
    );
  }

  const { project, profile } = await ProjectQuery(projectId);

  if (!profile) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Authentication required</p>
      </div>
    );
  }

  if (!project) {
    <div className="w-full h-screen flex items-center justify-center">
      <p className="text-red-500">Project not found or access denied</p>
    </div>;
  }

  return (
    <ProjectProvider initialProject={project}>
      <InfiniteCanvas />
    </ProjectProvider>
  );

  return <h1>hi</h1>;
}
