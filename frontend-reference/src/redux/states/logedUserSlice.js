import { shapeUser } from "../../models/User";
import { createSlice } from "@reduxjs/toolkit";
import {
  registerUser,
  loginUser,
  loginWithGoogle,
  getCurrentUser,
  logoutUser,
} from "../thunks/authThunks";

const EmptyUserState = shapeUser("", "", "", "", "", new Date(0), false);

const logedUserSlice = createSlice({
  name: "user",
  initialState: {
    value: EmptyUserState,
    loading: false,
    error: null,
    isAuthenticated: false,
  },
  reducers: {
    setLoggedUser: (state, action) => {
      state.value = action.payload;
      state.isAuthenticated = true;
      state.error = null;
    },
    clearLogedUser: (state) => {
      state.value = EmptyUserState;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Register User
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.value = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Login User
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.value = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Login with Google
    builder
      .addCase(loginWithGoogle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginWithGoogle.fulfilled, (state, action) => {
        state.loading = false;
        state.value = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(loginWithGoogle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Get Current User
    builder
      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.value = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      });

    // Logout User
    builder
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.value = EmptyUserState;
        state.isAuthenticated = false;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

const { setLoggedUser, clearLogedUser, clearError } = logedUserSlice.actions;
const logedUserReducer = logedUserSlice.reducer;

export default logedUserReducer;
export { setLoggedUser, clearLogedUser, clearError, EmptyUserState, logedUserSlice };
