"use client";

import { useAppDispatch, useAppSelector } from "@/redux/store";

export const useProjectCreation = () => {
  const dispatch = useAppDispatch();

  const user = useAppSelector((state) => state.profile);
  const projectsState = useAppSelector((state) => state.projects);

  const createProject = () => {};

  return {
    projects: projectsState?.projects,
    canCreate: !!user?.id,
    isCreating: projectsState?.isCreating,
    projectsTotal: projectsState?.total,
    createProject,
  };
};
