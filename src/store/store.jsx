import { configureStore } from '@reduxjs/toolkit'
import  userReducer  from './userSlice'
import allProductReducer from './allProductSlice'
import banarReducer from "../store/banarSlice";


export const store = configureStore({
  reducer: {
    userState: userReducer, // এখানে userReducer মানে হলো userSlice.reducer
    allProductState: allProductReducer,
    banarState: banarReducer,
  },
})

export default store