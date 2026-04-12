import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  productImgUrl: [],
};

const productImgSlice = createSlice({
  name: "P_ImgUrl",
  initialState,
  reducers: {
    setProductImgUrl: (state, action) => {
      state.productImgUrl = action.payload;
    },
  },
});

export const { setProductImgUrl } = productImgSlice.actions;
export default productImgSlice.reducer;