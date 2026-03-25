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
    // schema had a type of sketchData instead on sketch data
    // so there will be places where for server data it will be sketchData
    // and for client it will be sketchesData
    if (initialProject?._valueJSON?.sketchData) {
      const projectData = initialProject._valueJSON;
      dispatch(loadProject(projectData.sketchData));

      if (projectData.viewportData) {
        dispatch(restoreViewport(projectData.viewportData));
      }
    }
  }, [dispatch, initialProject]);

  return <div>{children}</div>;
}
