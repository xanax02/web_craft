import { Reducer } from "@reduxjs/toolkit";
import profile from "./profile";
import projects from "./projects";

export const slices: Record<string, Reducer> = {
  profile,
  projects,
};
