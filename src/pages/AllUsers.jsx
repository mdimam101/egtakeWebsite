import React, { useEffect, useState } from 'react'
import SummaryApi from '../common'
import { toast } from 'react-toastify'
import '../styles/AllUsersStyle.css'

const AllUsers = () => {
    const [allUsers, setAllUsers] = useState([])

    const fetchAllUsers = async() => {
        const fetchData = await fetch(SummaryApi.all_users.url,{
            method : SummaryApi.all_users.method,
            credentials : 'include'
        })
        const dataResponse = await fetchData.json()
        console.log("AllUsers-dataResponse", dataResponse);

        if (dataResponse.success) {
            setAllUsers(dataResponse.data)
        }
        if (dataResponse.error) {
            toast.error(dataResponse.message)
        }
    }

    useEffect(() => {
        fetchAllUsers()
    }, [])
    
  return (
    <div className="user-table-container">
    <h2>All Users</h2>
    <table className="user-table">
      <thead>
        <tr>
          <th>Sr No</th>
          <th>Name</th>
          <th>Email</th>
          <th>Created Date</th>
          {/* <th>Edit</th> //eta niye pore dekhbo  time 5hours*/}
        </tr>
      </thead>
      <tbody>
        {allUsers?.map((user, index) => (
          <tr key={index}>
            <td>{index + 1}</td>
            <td>{user?.name}</td>
            <td>{user?.email}</td>
            <td>{new Date(user?.createdAt).toLocaleDateString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
  )
}

export default AllUsers
