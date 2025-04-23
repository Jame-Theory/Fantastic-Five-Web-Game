import { useContext, createContext, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useEffect } from "react";


const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Check if user is already authenticated via cookie
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/auth/status", {
          credentials: "include", //Include cookies
        });
        const data = await res.json();
        if (data.username) {
          setUser(data.username);
          navigate("/");               //???Not sure if should include this.
        }
      } catch (err) {
        console.error("Auth check failed", err);
      }
    };
    checkAuth();
  }, []);

  const loginAction = async (data) => {
    try {
      const response = await fetch("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", //Include cookies
        body: JSON.stringify(data),
      });
      const res = await response.json();
      if (res.user) {
        setUser(res.user);
        navigate("/");
        return;
      }
      throw new Error(res.message);
    } catch (err) {
      console.error(err);
    }
  };

  const logOut = async () => {
    try {
      await fetch("/auth/logout", {
        method: "POST",
        credentials: "include", //Important for clearing cookies
      });
    } catch (err) {
      console.error("Logout failed", err);
    }
    setUser(null);
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loginAction, logOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

export const useAuth = () => {
  return useContext(AuthContext);
};
