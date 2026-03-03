import { Profile } from "@/types/user";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type ProfileState = { user: Profile | null };
const initialState: ProfileState = { user: null };

const userSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    setProfile: (state, action: PayloadAction<Profile | null>) => {
      state.user = action.payload;
    },
    clearProfile: (state) => {
      state.user = null;
    },
  },
});

export const { clearProfile, setProfile } = userSlice.actions;
export default userSlice.reducer;
