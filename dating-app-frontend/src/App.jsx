/* eslint-disable no-unused-vars */
import { useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import Home from "./components/Home/Home";
import UserProfile from "./components/User/UserProfile";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState("");
  const [showUserLists, setShowUserLists] = useState(false);

  const checkLogin =
    Object.keys(JSON.parse(localStorage.getItem("user")) || {}).length === 0;

  return (
    <Router>
      <Navbar
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={setIsLoggedIn}
        setUserId={setUserId}
        showUserLists={showUserLists}
        setShowUserLists={setShowUserLists}
      />
      <main>
        <Routes>
          <Route
            path="/"
            element={
              checkLogin ? (
                <Login setIsLoggedIn={setIsLoggedIn} setUserId={setUserId} />
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
            element={
              checkLogin ? (
                <Login setIsLoggedIn={setIsLoggedIn} setUserId={setUserId} />
              ) : (
                <UserProfile setIsLoggedIn={setIsLoggedIn} />
              )
            }
          />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
