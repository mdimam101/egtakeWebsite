import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  productList: [],
  hasLoaded: false,
};

const trendingProductSlice = createSlice({
  name: "trendingProducts",
  initialState,
  reducers: {
    setTrendingProductList: (state, action) => {
      state.productList = action.payload;
      state.hasLoaded = true;
    },
  },
});

export const { setTrendingProductList } = trendingProductSlice.actions;
export default trendingProductSlice.reducer;