import React from 'react'
import { createBrowserRouter } from 'react-router'
import App from '../App'
import HomePage from '../pages/HomePage'
import Login from '../pages/Login'
import ForgotPassword from '../pages/ForgotPassword'
import SignupPage from '../pages/SignupPage'
import AdminPanel from '../pages/AdminPanel'
import AllUsers from '../pages/AllUsers'
import AllProducts from '../pages/AllProducts'
import CategoryWiseProductListPage from '../pages/CategoryWiseProductListPage'
import ProductDetailsPage from '../pages/ProductDetailsPage'
import Cart from '../pages/Cart'
import CategoryPage from '../pages/CategoryPage'
import SearchPage from '../pages/SearchPage'
import SearchResultsPage from '../pages/SearchResultsPage'
import AllBanners from '../pages/AllBanners'
import CheckoutPage from '../pages/CheckoutPage'
import OrderList from '../pages/AllOrderList'
import UserProfile from '../pages/UserProfile'
import SubCategoryWiseProduct from '../pages/SubCategoryWiseProduct'
import AdminCoupons from '../pages/AdminCoupons'

const router = createBrowserRouter([
    {
        path : '/',
        element : <App/>,
        children : [
            {
                path : '/',
                element: <HomePage/>
            },
            {
                path : '/home',
                element: <HomePage/>
            },
            {
                path: '/search/:query',
                element: <SearchPage/>
              },
              {
                path: '/search/:query',
                element: <SearchResultsPage />
              },
            {
                path : '/category',
                element: <CategoryPage/>
            },
            {
                path : '/category-wish/:categoryName',
                element: <CategoryWiseProductListPage/>
            },
            {
                path : '/sub-category-wish/:categoryName',
                element: <SubCategoryWiseProduct/>
            },
            {
                path : '/product/:id',
                element: <ProductDetailsPage/>

            },{
                path : '/cart',
                element : <Cart/>

            },
            {
                path : '/checkout',
                element : <CheckoutPage/>

            },
            {
                path : '/login',
                element : <Login/>
            },
            {
                path : '/forgot-password',
                element : <ForgotPassword/>
            },
            {
                path : '/sign-up',
                element : <SignupPage/>
            },
            {
                path : '/profile',
                element : <UserProfile/>
            },
            {
                path : 'admin-panel',
                element : <AdminPanel/>,
                children:[
                    {
                        path : 'all-users',
                        element : <AllUsers/>
                    },
                    {
                        path : 'all-products',
                        element : <AllProducts/>
                    },
                    {
                        path : 'all-banners',
                        element : <AllBanners/>
                    },
                    {
                        path : 'orders',
                        element : <OrderList/>
        
                    },
                    {
                     path:"coupons" ,
                     element:<AdminCoupons/>

                     }
                ]
            }

        ]
    },
])

export default router
