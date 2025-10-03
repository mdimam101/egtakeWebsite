import { configureStore } from '@reduxjs/toolkit'
import  userReducer  from './userSlice'

export const store = configureStore({
  reducer: {
    userState: userReducer // এখানে userReducer মানে হলো userSlice.reducer
  },
})

export default store