import React from "react";
import { createBrowserRouter } from "react-router";
import App from "../App";

// React Router resolves matched lazy routes in parallel. This keeps page-specific
// JavaScript out of the initial bundle and only downloads it when it is needed.
const lazyPage = (loadPage) => async () => {
  const module = await loadPage();

  return { Component: module.default };
};

const initialPageLoader = (
  <div className="initial-page-loader" role="status" aria-live="polite">
    <span className="initial-page-loader__spinner" aria-hidden="true" />
    <span className="initial-page-loader__label">Loading…</span>
  </div>
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    hydrateFallbackElement: initialPageLoader,
    children: [
      {
        index: true,
        lazy: lazyPage(() => import("../pages/HomePage")),
      },
      {
        path: "home",
        lazy: lazyPage(() => import("../pages/HomePage")),
      },
      {
        path: "search/:query",
        lazy: lazyPage(() => import("../pages/SearchPage")),
      },
      {
        path: "category",
        lazy: lazyPage(() => import("../pages/CategoryPage")),
      },
      {
        path: "category-wish/:categoryName",
        lazy: lazyPage(() => import("../pages/CategoryWiseProductListPage")),
      },
      {
        path: "sub-category-wish/:categoryName",
        lazy: lazyPage(() => import("../pages/SubCategoryWiseProduct")),
      },
      {
        path: "product/:id",
        lazy: lazyPage(() => import("../pages/ProductDetailsPage")),
      },
      {
        path: "cart",
        lazy: lazyPage(() => import("../pages/Cart")),
      },
      {
        path: "checkout",
        lazy: lazyPage(() => import("../pages/CheckoutPage")),
      },
      {
        path: "login",
        lazy: lazyPage(() => import("../pages/Login")),
      },
      {
        path: "forgot-password",
        lazy: lazyPage(() => import("../pages/ForgotPassword")),
      },
      {
        path: "sign-up",
        lazy: lazyPage(() => import("../pages/SignupPage")),
      },
      {
        path: "profile",
        lazy: lazyPage(() => import("../pages/UserProfile")),
      },
      {
        path: "admin-panel",
        lazy: lazyPage(() => import("../pages/AdminPanel")),
        children: [
          {
            path: "all-users",
            lazy: lazyPage(() => import("../pages/AllUsers")),
          },
          {
            path: "all-products",
            lazy: lazyPage(() => import("../pages/AllProducts")),
          },
          {
            path: "all-banners",
            lazy: lazyPage(() => import("../pages/AllBanners")),
          },
          {
            path: "orders",
            lazy: lazyPage(() => import("../pages/AllOrderList")),
          },
          {
            path: "coupons",
            lazy: lazyPage(() => import("../pages/AdminCoupons")),
          },
          {
            path: "tracking",
            lazy: lazyPage(() => import("../pages/AdminTracking")),
          },
        ],
      },
    ],
  },
]);

export default router;
