import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  categoryList: [],
  categoryPageProductList: [], // CategoryPage er jonno product cache
};

const categorySlice = createSlice({
  name: "category",
  initialState,
  reducers: {
    setCategoryList: (state, action) => {
      state.categoryList = action.payload;
    },

    setCategoryPageProductList: (state, action) => {
      state.categoryPageProductList = action.payload;
    },

    clearCategoryCache: (state) => {
      state.categoryList = [];
      state.categoryPageProductList = [];
    },
  },
});

export const {
  setCategoryList,
  setCategoryPageProductList,
  clearCategoryCache,
} = categorySlice.actions;

export default categorySlice.reducer;