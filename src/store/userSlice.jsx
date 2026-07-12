import { createSlice } from "@reduxjs/toolkit";

/*👉 এখানে Redux store এর initial value set করা হয়েছে। 
অর্থাৎ, যখন অ্যাপ প্রথম লোড হয়, তখন user এর মান হবে null। */
const initialState = {
  user: null,
};

export const userSlice = createSlice({
  name: "user", // এই slice-এর নাম (Redux store এ এই নামেই রেজিস্টার হবে)।
  initialState,
  reducers: {
    /** setUserDetails() হচ্ছে এক ধরনের action handler।
        এটা তখনই চলে যখন তুমি dispatch(setUserDetails(payload)) কল করো।
        state.user = action.payload মানে হলো নতুন user data দিয়ে পুরাতনটা আপডেট করো। */
    setUserDetails: (state, action) => {
      state.user = action.payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const { setUserDetails } = userSlice.actions;

// এখানে userSlice.reducer হল তোমার reducer function — যা Redux এর store এ state manage করে।
export default userSlice.reducer;
