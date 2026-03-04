"use client";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { useProjectCreation } from "@/hooks/useProjectCreations";

export default function CreateProjectButton() {
  const { createProject, canCreate, isCreating } = useProjectCreation();

  return (
    <Button
      variant="default"
      onClick={createProject}
      disabled={!canCreate || isCreating}
      className="flex items-center gap-2 cursor-pointer rounded-full"
    >
      {isCreating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Plus className="h-4 w-4" />
      )}
      {isCreating ? "Creating..." : "Create Project"}
    </Button>
  );
}
