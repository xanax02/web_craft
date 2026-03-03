import {
  combineReducers,
  configureStore,
  Middleware,
  ReducersMapObject,
} from "@reduxjs/toolkit";
import { slices } from "./slice";
import { apis } from "./api";

export type RootState = ReturnType<typeof rootReducer>;

const rootReducer = combineReducers({
  ...slices,
  ...apis.reduce((acc, api) => {
    acc[api.reducerPath] = api.reducer;
    return acc;
  }, {} as ReducersMapObject),
});

const rootInitialState: Partial<RootState> = {};

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddlwares) =>
    getDefaultMiddlwares().concat(
      ...apis.map((api) => api.middleware as Middleware),
    ),
  preloadedState: rootInitialState,
  devTools: process.env.NODE_ENV !== "production",
});
