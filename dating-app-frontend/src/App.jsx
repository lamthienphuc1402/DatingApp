/* eslint-disable no-unused-vars */
import { useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useNavigate,
  useParams,
  useLocation,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import Home from "./components/Home/Home";
import UserProfile from "./components/User/UserProfile";
import AdminLogin from './components/Admin/AdminLogin';
import AdminLayout from './components/Admin/Layout/AdminLayout';
import AdminDashboard from './components/Admin/AdminDashboard';
import AdminManagement from "./components/Admin/AdminManagement";
import AdminUsers from './components/Admin/AdminUsers';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LandingPage from "./components/Landing/LandingPage";
import FeedbackButton from "./components/FeedbackButton";
import FeedbackManagement from "./components/Admin/FeedbackManagement";
import AIPage from './pages/AIPage';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState("");
  const [showUserLists, setShowUserLists] = useState(false);
  
  // Hàm kiểm tra xem có phải đang ở trang admin không
  const isAdminRoute = window.location.href.includes("admin")

  const checkLogin =
    Object.keys(JSON.parse(localStorage.getItem("user")) || {}).length === 0;
 
  return (
    <Router>
      {!isAdminRoute && (
      <Navbar
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={setIsLoggedIn}
        setUserId={setUserId}
        showUserLists={showUserLists}
        setShowUserLists={setShowUserLists}
      />
      )}
      <main>
        <Routes>
          <Route
            path="/"
            element={
              checkLogin ? (
                <LandingPage />
              ) : (
                <Home
                  isLoggedIn={isLoggedIn}
                  setIsLoggedIn={setIsLoggedIn}
                  setUserId={setUserId}
                  showUserLists={showUserLists}
                  setShowUserLists={setShowUserLists}
                />
              )
            }
          />
          <Route
            path="/register"
            element={
              <Register setIsLoggedIn={setIsLoggedIn} setUserId={setUserId} />
            }
          />
          <Route
            path="/login"
            element={
              <Login setIsLoggedIn={setIsLoggedIn} setUserId={setUserId} />
            }
          />
          <Route
            path="/users/:userId"
            element={<UserProfile setIsLoggedIn={setIsLoggedIn} />}
          />
          <Route
            path="/ai"
            element={
              checkLogin ? (
                <Login setIsLoggedIn={setIsLoggedIn} setUserId={setUserId} />
              ) : (
                <AIPage />
              )
            }
          />
        </Routes>
        <Routes>
          {/* Các routes hiện tại */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="management" element={<AdminManagement />} />
            <Route path="feedback" element={<FeedbackManagement />} />
          </Route>
        </Routes>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
        {isLoggedIn && !isAdminRoute && <FeedbackButton />}
      </main>
    </Router>
  );
}

export default App;
