import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { getWardListApi } from "../../api/endpoints";
import { getToken } from "../../utils/auth";

const token = getToken();

export const fetchWardList = createAsyncThunk(
  "wards/fetchWardList",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(getWardListApi, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          all: "all",
        },
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to fetch wards");
    }
  }
);

const wardSlice = createSlice({
  name: "wards",
  initialState: {
    wardList: [],
    loading: false,
    error: null,
  },
  reducers: {},

  extraReducers: (builder) => {
    builder
      .addCase(fetchWardList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWardList.fulfilled, (state, action) => {
        state.loading = false;
        state.wardList = action.payload;
      })
      .addCase(fetchWardList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default wardSlice.reducer;
