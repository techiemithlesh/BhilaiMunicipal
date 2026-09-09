import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { citizenLogoutApi } from "../../api/endpoints";
import axios from "axios";
import Cookies from "js-cookie";

const tokenFromStorage = localStorage.getItem("token");
const userFromStorage = localStorage.getItem("userDetails");
const expiryFromStorage = localStorage.getItem("expiry");

const initialState = {
  token: tokenFromStorage ? JSON.parse(tokenFromStorage) : null,
  userDetails: userFromStorage ? JSON.parse(userFromStorage) : null,
  expiry: expiryFromStorage ? JSON.parse(expiryFromStorage) : null,
};

const citizenAuthSlice = createSlice({
  name: "citizenAuth",
  initialState,
  reducers: {
    setCitizenToken: (state, action) => {
      state.token = action.payload;
      const expiry = Date.now() + 60 * 60 * 1000; // 1 hour in ms

      state.expiry = expiry;
      localStorage.setItem("token", JSON.stringify(action.payload));
      localStorage.setItem("expiry", JSON.stringify(expiry));
    },

    removeCitizenToken: (state) => {
      state.token = null;
      state.expiry = null;
      // localStorage.removeItem("token");
      Cookies.remove("token");
      localStorage.removeItem("token");
      localStorage.removeItem("expiry");
    },

    setCitizenUser: (state, action) => {
      state.userDetails = action.payload;
      localStorage.setItem("userDetails", JSON.stringify(action.payload));
    },

    removeCitizenUser: (state) => {
      state.userDetails = null;
      localStorage.removeItem("userDetails");
    },

    loginSuccess: (state, action) => {
      const { token, userDetails } = action.payload;
      const expiry = Date.now() + 8 * 60 * 60 * 1000; // 8 hours

      state.token = token;
      state.userDetails = userDetails;
      state.expiry = expiry;

      // localStorage.setItem("token", JSON.stringify(token));
       Cookies.set("token", token, { expires: 1 });
      localStorage.setItem("userDetails", JSON.stringify(userDetails));
      localStorage.setItem("expiry", JSON.stringify(expiry));
    },
  },

  // ✅ Move extraReducers out here
  extraReducers: (builder) => {
    builder.addCase(logoutThunk.fulfilled, (state, action) => {
      state.token = null;
      state.userDetails = null;
      state.expiry = null;

      // localStorage.removeItem("token");
      Cookies.remove("token");
      localStorage.removeItem("userDetails");
      localStorage.removeItem("expiry");
    });
    builder.addCase(logoutThunk.rejected, (state, action) => {
      console.error("Logout failed:", action.payload);
    });
  },
});

export const {
  setCitizenToken,
  removeCitizenToken,
  setCitizenUser,
  removeCitizenUser,
  loginSuccess,
} = citizenAuthSlice.actions;
export default citizenAuthSlice.reducer;

export const logoutThunk = createAsyncThunk(
  "logoutThunk",
  async ({ token, navigateUrl }, thunkAPI) => {
    try {
      const response = await axios.post(
        citizenLogoutApi,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Return any useful response data (optional)
      return { ...response.data, navigateUrl };
    } catch (error) {
      console.error("Logout error:", error.message);
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);
