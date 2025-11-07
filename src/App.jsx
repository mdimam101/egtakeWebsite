import { Outlet } from "react-router";
import Header from "./components/Header";
import Footer from "./components/Footer";
import CategoryList from "./components/CategoryList";
import { ToastContainer } from 'react-toastify';
import '../src/styles/App.css';
import { useEffect, useState } from "react";
import SummaryApi from "./common";
import Context from "../src/context/index";
import { useDispatch } from "react-redux";
import { setUserDetails } from "./store/userSlice";


function App() {
  const t = localStorage.getItem('authToken');
  const dispatch = useDispatch();
  const [cartCountProduct, setCartCountProduct] = useState(0)
  // its for one product count list
  const [cartListData, setCartListData] = useState([]);

  const fetchUserDetails = async () => {

    console.log("fetchUserDetails11111111");
    
    try {
      
       
      const response = await fetch(SummaryApi.current_user.url, {
        method: SummaryApi.current_user.method,
         headers: t ? { Authorization: `Bearer ${t}` } : {},
        credentials: 'include',
      });
       
      // const response = await axios({
      //   url: SummaryApi.current_user.url,
      //   method: SummaryApi.current_user.method,
      //   withCredentials:true
      // });
      console.log("fetchUserDetails1122222221",response.data);

      const result = await response.json();
      console.log("fetchUserDetails1122222221",result);


      if (result.success) {
         console.log("◆success", result.data);
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

  const fetchUserAddToCart = async() => {
    const response = await fetch(SummaryApi.count_AddToCart_Product.url, {
      method: SummaryApi.count_AddToCart_Product.method,
     headers: t ? { Authorization: `Bearer ${t}` } : {},
      credentials: 'include',
    });

    const result = await response.json();
    setCartCountProduct(result?.data?.count)
}

  useEffect(() => {
    // user details
    fetchUserDetails();
    //current user add to cart product count
    fetchUserAddToCart()
    
  }, []);

  console.log("fetchUserAddToCart", cartCountProduct);



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
        <Header />
        <main className="main-content">
          <Outlet />
        </main>
        <Footer />
      </Context.Provider>
    </div>
  );
}

export default App;