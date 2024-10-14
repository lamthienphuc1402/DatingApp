/* eslint-disable no-unused-vars */
import { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import Home from "./components/Home/Home";
import UserProfile from "./components/User/UserProfile";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState("");

  // Create a client
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Navbar
          isLoggedIn={isLoggedIn}
          setIsLoggedIn={setIsLoggedIn}
          setUserId={setUserId}
        />
        <main>
          <Routes>
            <Route
              path="/"
              element={
                <Home
                  isLoggedIn={isLoggedIn}
                  setIsLoggedIn={setIsLoggedIn}
                  setUserId={setUserId}
                />
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
            <Route path="/users/:userId" element={<UserProfile />} />
          </Routes>
        </main>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
