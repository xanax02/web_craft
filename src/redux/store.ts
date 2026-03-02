import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { slices } from "./slice";

export type RootState = ReturnType<typeof rootReducer>;

const rootReducer = combineReducers({
  ...slices,
});

export const store = configureStore({
  reducer: rootReducer,
});
