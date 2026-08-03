import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  productList: [],
};

const allProductSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {
    setAllProductList: (state, action) => {
      state.productList = action.payload;
    },
    appendAllProductList: (state, action) => {
      const existingKeys = new Set(
        state.productList.map((product) => product.cardKey),
      );

      action.payload.forEach((product) => {
        if (!existingKeys.has(product.cardKey)) {
          state.productList.push(product);
          existingKeys.add(product.cardKey);
        }
      });
    },
  },
});

export const { appendAllProductList, setAllProductList } =
  allProductSlice.actions;
export default allProductSlice.reducer;