import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom"
import App from './App.tsx'
import Layout from './components/Layout.tsx'
import MyBids from './components/MyBids.tsx'
import Login from './components/Login.tsx'
import Signup from './components/Signup.tsx'
import CreateBid from './components/CreateBid.tsx'
import PlaceBid from './components/PlaceBid.tsx'
import AuthCallback from './components/AuthCallback.tsx'

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
  },
  {
    path: "/auth/callback",
    element: <AuthCallback />
  }
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)