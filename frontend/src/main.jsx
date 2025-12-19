import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom"
import App from './App.tsx'
import Layout from './components/Layout.tsx'
import MyBids from './components/MyBids.tsx'
import Login from './components/Login.tsx'
import Signup from './components/Signup.tsx'
import { GoogleOAuthProvider } from '@react-oauth/google'
import CreateBid from './components/CreateBid.tsx'
import PlaceBid from './components/PlaceBid.tsx'
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

// Protected route component
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" />
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "/",
        element: <App />
      },
      {
        path:'/bid/:id',
        element:<ProtectedRoute><PlaceBid /></ProtectedRoute>
      },
      {
        path: "/bids",
        element: <ProtectedRoute><MyBids /></ProtectedRoute>
      },
      {
        path: "/login",
        element: <Login />
      },
      {
        path: "/sign-up",
        element: <Signup />
      },{
        path:"/new-bids",
        element:<CreateBid />
      }
    ]
  }
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <RouterProvider router={router} />
    </GoogleOAuthProvider>
  </StrictMode>,
)