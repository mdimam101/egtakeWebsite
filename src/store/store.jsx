import { configureStore } from '@reduxjs/toolkit'
import  userReducer  from './userSlice'
import allProductReducer from './allProductSlice'
import banarReducer from "../store/banarSlice";
import commonReducer from "./commonInfoSlice";
import productImgReducer from "./productImgSlice";
import categoryReducer from "./categorySlice";


export const store = configureStore({
  reducer: {
    userState: userReducer, // এখানে userReducer মানে হলো userSlice.reducer
    allProductState: allProductReducer,
    banarState: banarReducer,
    commonState: commonReducer,
    productImgUrlState: productImgReducer,
    categoryState: categoryReducer,
  },
});

export default store