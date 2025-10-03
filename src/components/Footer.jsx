import React, { useContext } from 'react';
import '../styles/FooterStyles.css';
import { FaHome } from "react-icons/fa";
import { BiSolidCategory } from "react-icons/bi";
import { FaCartArrowDown } from "react-icons/fa";
import { FaRegUserCircle } from "react-icons/fa";
import { Link } from "react-router";
import Context from '../context'; // ✅ context import
import { useSelector } from 'react-redux';

const Footer = () => {
  const  count  = useContext(Context); // ✅ get cart count
  const user = useSelector((state) => state?.userState?.user);


  console.log("count", count);

  let redirectURL = ''
       console.log("✅ redirectURL9999", user?._id);
       
  
  if (user?._id){
    // Is user login redirect to profiltpage
     redirectURL ='/profile'
  } else {
    // display in login page
    redirectURL = '/login'
  }


  

  return (
    <div className='main-footer'>
      <div><Link to="/home"><FaHome /></Link></div>
      <div><Link to="/category"><BiSolidCategory /></Link></div>
  
      <div className="cart-icon-container">
        <Link to="/cart">
          <FaCartArrowDown />
          {count.cartCountProduct > 0 && (
            <span className="cart-count-badge">{count.cartCountProduct}</span>
          )}
        </Link>
      </div>
  
      <div><Link to={redirectURL}><FaRegUserCircle /></Link></div>
    </div>
  );
  
};

export default Footer;
