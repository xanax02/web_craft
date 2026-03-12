import ProjectsList from "@/components/projects/list";
import ProjectsProvider from "@/components/projects/list/Provider";
import { ProjectsQuery } from "@/convex/query.config";

export default async function Page() {
  const { projects, profile } = await ProjectsQuery();

  if (!profile) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Authentication Required
          </h1>
          <p>Please sign in to view your rojects.</p>
        </div>
      </div>
    );
  }

  return (
    <ProjectsProvider initialProjects={projects}>
      <div className="container mx-auto py-36 px-4">
        <ProjectsList />
      </div>
    </ProjectsProvider>
  );
}
