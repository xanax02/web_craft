import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query";

interface AutosaveProjectRequest {
  projectId: string;
  userId: string;
  shapesData: {
    shapes: Record<string, unknown>;
    tool: string;
    selected: Record<string, unknown>;
    frameCounter: number;
  };
  viewportData?: {
    scale: number;
    translate: { x: number; y: number };
  };
}

interface AutosaveProjectResponse {
  success: boolean;
  message: string;
  eventId: string;
}

export const ProjectApi = createApi({
  reducerPath: "projectApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/project" }),
  endpoints: (builder) => {
    autosaveProject: builder.mutation<
      AutosaveProjectRequest,
      AutosaveProjectResponse
    >({
      query: (data) => ({
        url: "",
        method: "PATCH",
        body: data,
      }),
    });
  },
});
