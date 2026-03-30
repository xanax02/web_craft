import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const generationApi = createApi({
  reducerPath: "generationApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/generate" }),
  tagTypes: ["Generation"],
  endpoints: (builder) => ({
    // generate generation
    generateGeneration: builder.mutation({
      query: (data) => ({
        url: "/generate",
        method: "POST",
        body: data,
      }),
    }),

    //redesign ui
    redesignUI: builder.mutation({
      query: (data) => ({
        url: "/redesign",
        method: "POST",
        body: data,
      }),
    }),

    //workflow generation
    generateWorkflow: builder.mutation({
      query: (data) => ({
        url: "/workflow",
        method: "POST",
        body: data,
      }),
    }),

    //redesign workflow page
    redesignWorkflow: builder.mutation({
      query: (data) => ({
        url: "/workflow-redesign",
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const {
  useGenerateGenerationMutation,
  useRedesignUIMutation,
  useRedesignWorkflowMutation,
  useGenerateWorkflowMutation,
} = generationApi;
