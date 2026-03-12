"use client";
import { fetchProjectsSuccess } from "@/redux/slice/projects";
import { useAppDispatch } from "@/redux/store";
import { useEffect } from "react";

type Props = {
  children: React.ReactNode;
  initialProjects: any;
};

const ProjectsProvider = (props: Props) => {
  const { children, initialProjects } = props;

  const dispatch = useAppDispatch();

  useEffect(() => {
    //initailze store with ssr data
    if (initialProjects?._valueJSON) {
      const projectsData = initialProjects?._valueJSON;
      dispatch(
        fetchProjectsSuccess({
          projects: projectsData,
          total: projectsData.length,
        }),
      );
    }
  }, [dispatch, initialProjects]);

  return <div>{children}</div>;
};

export default ProjectsProvider;
