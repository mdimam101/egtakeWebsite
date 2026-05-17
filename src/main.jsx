import React from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import router from "./routes/index.jsx";
import { Provider } from "react-redux";
import { store } from "./store/store.jsx";
import { HelmetProvider } from "react-helmet-async";

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    {/* <RouterProvider router={router} /> */}
     <HelmetProvider>
      <RouterProvider router={router} />
    </HelmetProvider>
  </Provider>
);
