"use client";

import { loadProject } from "@/redux/slice/shapes";
import { restoreViewport } from "@/redux/slice/viewport";
import { useAppDispatch } from "@/redux/store";
import { useEffect } from "react";

export default function ProjectProvider({
  children,
  initialProject,
}: {
  children: React.ReactNode;
  initialProject: any;
}) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (initialProject?._valueJSON?.sketchesData) {
      const projectData = initialProject._valueJSON;
      dispatch(loadProject(projectData.sketchesData));

      if (projectData.viewportData) {
        dispatch(restoreViewport(projectData.viewportData));
      }
    }
  }, [dispatch, initialProject]);

  return <div>{children}</div>;
}
