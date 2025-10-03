import React, { useContext, useState } from "react";
import "../styles/LoginStyles.css";
import { Link,useNavigate } from "react-router";
import { FaRegUser } from "react-icons/fa";
import SummaryApi from "../common";
import { toast } from "react-toastify";
import Context from "../context";

const Login = () => {

    const navigate = useNavigate()
    // const { fetchUser } = useContext(Context); // ❌ কাজ করবে না
    // এখানে fetchUser নামে খুঁজতেছো, কিন্তু Context.Provider তো fetchUserDetails নামে পাঠিয়েছে। তাই undefined পাবে।
    const {fetchUserDetails} = useContext(Context)


    const [data, setData] = useState({
        email: '',
        password: ''
    })

    const handleOnChange= (e) => {
        console.log("Login-e.target",e.target);
        
        const {name, value} = e.target //note : name holo tar input er email,password , value holo type text
        setData((preve)=>{
            return {
                ...preve,
                [name] : value
            }
    
        })
    }
    // console.log("Login-data",data);

    const handleSubmit = async (e) => {
        console.log("preventDefault",e);
        console.log("Login-data",data);
        e.preventDefault()

        const responseData = await fetch (SummaryApi.signIn.url,{
          method: SummaryApi.signIn.method,
          credentials:'include',
          headers: {
            'content-type' : 'application/json'
          },
          body : JSON.stringify(data)
        })

        const dataApi = await responseData.json()
        console.log("dataApi for local ", dataApi.data);
        

        if (dataApi.success) {
          toast.success('login successfully')
          console.log("'login successfully'",);
         localStorage.setItem('authToken', dataApi.data);
          
          // redirect to home page
          // navigate('/home')
          navigate('/')
          // Login সফল হলে, আবার fetchUserDetails() কল করো যেন নতুন token দিয়ে user info পাওয়া যায়।
          fetchUserDetails()
        }
        
        if (dataApi.error) {
          toast.error(dataApi.message)
          console.log("'login ERROR'",dataApi.message);
        }
    }


    
    
  return (
    <section id="login">
      <div className="main-login">
        <div>
          <FaRegUser />
        </div>
        <form onSubmit={handleSubmit}>
          <div className="email-sec">
            <label>Email : </label>
            <div className="email-input-sec">
              <input type="email" 
              placeholder="enter emil" 
              name="email"
              value={data.email}
             onChange={handleOnChange} 

              />
            </div>
          </div>
          <div className="pass-sec">
            <label>password : </label>
            <div>
              <input type="password"
               placeholder="enter password"
               name="password"
               value={data.password}
               onChange={handleOnChange}
               ></input>
            </div>
          </div>
          <div>
            <Link to={"/forgot-password"}>forgot-password</Link>
          </div>
          <button>login</button>
        </form>
        <p>
          Don't have a account ? <Link to={"/sign-up"}>Sign up</Link>
        </p>
      </div>
    </section>
  );
};

export default Login;
