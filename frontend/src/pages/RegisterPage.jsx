import { useState } from "react";
import { useAuth } from "./AuthProvider.jsx"

const RegisterPage = () => {
  const [input, setInput] = useState({
    username: "",
    password: "",
  });

  const [error, setError] = useState("");

  const { loginAction } = useAuth();

  const handleSubmitEvent = async (e) => {
    e.preventDefault();
    if (input.username === "" || input.password === "") {
        setError("Username and password cannot be blank.");
        return;
    }
    
    try {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // include cookies if needed
          body: JSON.stringify(input),
        });
  
        const data = await response.json();
  
        if (response.ok) {
          setError("");
          loginAction(input);
        } else {
          setError(data.message || "Registration failed.");
        }
    } catch (err) {
        console.error("Registration error:", err);
        setError("An error occurred. Please try again later.");
    }

  
  };

  const handleInput = (e) => {
    const { name, value } = e.target;
    setInput((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <form onSubmit={handleSubmitEvent}>
      <label>Username:<br/>
        <input type="text" name="username" onChange={handleInput}/><br/>
      </label>
      <label>Password:<br/>
        <input type="text" name="password" onChange={handleInput}/><br/>
      </label>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <button>Register</button>
    </form>
  );
};

export default RegisterPage;