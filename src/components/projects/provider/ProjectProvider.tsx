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
    console.log("what is this project data", initialProject);
    // schema had a type of sketchData instead on sketch data
    // so there will be places where for server data it will be sketchData
    // and for client it will be sketchesData
    if (initialProject?._valueJSON?.sketchData) {
      const projectData = initialProject._valueJSON;

      if (Object.keys(projectData?.sketchData)?.length === 0) {
        dispatch(
          loadProject({
            shapes: { ids: [], entities: {} },
            tool: "select",
            selected: {},
            frameCounter: 0,
          }),
        );
      } else {
        dispatch(loadProject(projectData.sketchData));
      }

      if (projectData.viewportData) {
        dispatch(restoreViewport(projectData.viewportData));
      }
    } else {
      // Initialize with empty state if no sketchData
    }
  }, [dispatch, initialProject]);

  return <div>{children}</div>;
}
