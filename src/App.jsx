import { Outlet, useLocation } from "react-router";
import Header from "./components/Header";
import Footer from "./components/Footer";
import CategoryList from "./components/CategoryList";
import { ToastContainer } from "react-toastify";
import "../src/styles/App.css";
import { useEffect, useState } from "react";
import SummaryApi from "./common";
import Context from "../src/context/index";
import { useDispatch } from "react-redux";
import { setUserDetails } from "./store/userSlice";
import { setCommonGetInfoList } from "./store/commonInfoSlice";

function App() {
  // const t = localStorage.getItem("authToken");
  const dispatch = useDispatch();
  const location = useLocation();
  const [cartCountProduct, setCartCountProduct] = useState(0);
  // its for one product count list
  const [cartListData, setCartListData] = useState([]);

    const getAuthHeaders = () => {
    const token = localStorage.getItem("authToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchUserDetails = async () => {
    console.log("fetchUserDetails11111111");

    try {
      const response = await fetch(SummaryApi.current_user.url, {
        method: SummaryApi.current_user.method,
        headers: getAuthHeaders(),
        credentials: "include",
      });

      // const response = await axios({
      //   url: SummaryApi.current_user.url,
      //   method: SummaryApi.current_user.method,
      //   withCredentials:true
      // });
      const result = await response.json();

      if (result.success) {
        // যখন অ্যাপ লোড হয় (useEffect এ), তখন ইউজার যদি লগইন থাকে,
        // fetchUserDetails() ইউজারের তথ্য আনছে এবং সেটাকে Redux Store-এ রাখছে।
        dispatch(setUserDetails(result.data));
        setCartListData(result.data);
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      console.log("◆error", error.message);
    }
  };

  const fetchUserAddToCart = async () => {
   try {
      const response = await fetch(SummaryApi.count_AddToCart_Product.url, {
        method: SummaryApi.count_AddToCart_Product.method,
        headers: getAuthHeaders(),
        credentials: "include",
      });

      const result = await response.json();
      setCartCountProduct(result?.data?.count ?? 0);
    } catch (error) {
      console.error("Error fetching cart count:", error);
    }
  };

  useEffect(() => {
    // user details
    fetchUserDetails();
    //current user add to cart product count
    fetchUserAddToCart();
  }, []);

  useEffect(() => {
    const getCommonInfo = async () => {
      try {
        const response = await fetch(SummaryApi.get_common_info.url, {
          method: SummaryApi.get_common_info.method,
          headers: getAuthHeaders(),
          credentials: "include",
        });
        const result = response.data;
        if (result.success) {
          dispatch(setCommonGetInfoList(result.data));
        }
      } catch (error) {
        console.log(error);
      }
    };

    getCommonInfo();
  }, []);

  const path = location.pathname;
  const hideHeader = path.startsWith("/product") || path.startsWith("/profile");

  return (
    <div className="app-wrapper">
      <Context.Provider
        value={{
          fetchUserDetails,
          cartCountProduct,
          fetchUserAddToCart,
          cartListData,
        }}
      >
        <ToastContainer />
        {!hideHeader && <Header />}
        <main
          className={
            hideHeader ? "main-content-without-product-page" : "main-content"
          }
        >
          <Outlet />
        </main>
        <Footer />
      </Context.Provider>
    </div>
  );
}

export default App;
