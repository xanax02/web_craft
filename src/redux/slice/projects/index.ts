import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ProjectSummary {
  _id: string;
  name: string;
  projectNumber: number;
  thumbnail?: string;
  lastModified: number;
  createdAt: number;
  isPublic?: boolean;
}

interface ProjectsState {
  projects: ProjectSummary[];
  total: number;
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
  isCreating: boolean;
  createError: string | null;
}

const initialState: ProjectsState = {
  projects: [],
  total: 0,
  isLoading: false,
  error: null,
  lastFetched: null,
  isCreating: false,
  createError: null,
};

const projectsSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    //fetch projects actions
    fetchProjectsStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchProjectsSuccess: (
      state,
      action: PayloadAction<{ projects: ProjectSummary[]; total: number }>,
    ) => {
      state.isLoading = false;
      state.error = null;
      state.projects = action.payload.projects;
      state.total = action.payload.total;
      state.lastFetched = Date.now();
    },
    fetchProjectsFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },

    //create project actions
    createPorjectStart: (state) => {
      state.isCreating = true;
      state.createError = null;
    },
    createProjectSuccess: (state) => {
      state.isCreating = false;
      state.createError = null;
    },
    createProjectFailure: (state, action: PayloadAction<string>) => {
      state.isCreating = false;
      state.createError = action.payload;
    },
    updateProject: (state, action: PayloadAction<ProjectSummary>) => {
      const projectIndex = state.projects.findIndex(
        (project) => project._id === action.payload._id,
      );
      if (projectIndex !== -1) {
        state.projects[projectIndex] = action.payload;
      }
    },
    removeProject: (state, action: PayloadAction<string>) => {
      state.projects = state.projects.filter(
        (project) => project._id !== action.payload,
      );
      state.total -= 1;
    },
    clearProjects: (state) => {
      state.projects = [];
      state.total = 0;
      state.lastFetched = null;
      state.error = null;
      state.createError = null;
    },
    clearErrors: (state) => {
      state.error = null;
      state.createError = null;
    },
    addProject: (state, action: PayloadAction<ProjectSummary>) => {
      state.projects.push(action.payload);
      state.total += 1;
    },
  },
});

export default projectsSlice.reducer;
export const {
  clearErrors,
  createProjectFailure,
  createProjectSuccess,
  createPorjectStart,
  fetchProjectsFailure,
  fetchProjectsStart,
  fetchProjectsSuccess,
  removeProject,
  updateProject,
  clearProjects,
  addProject,
} = projectsSlice.actions;
