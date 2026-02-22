import { configureStore } from '@reduxjs/toolkit'
import  userReducer  from './userSlice'
import allProductReducer from './allProductSlice'
import banarReducer from "../store/banarSlice";
import commonReducer from "./commonInfoSlice";


export const store = configureStore({
  reducer: {
    userState: userReducer, // এখানে userReducer মানে হলো userSlice.reducer
    allProductState: allProductReducer,
    banarState: banarReducer,
     commonState: commonReducer,
  },
})

export default store