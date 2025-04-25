import { useState } from "react";
import { useAuth } from "./AuthProvider.jsx"

const LoginPage = () => {
  const [input, setInput] = useState({
    username: "",
    password: "",
  });

  const [error, setError] = useState("");
  const { loginAction } = useAuth();

  const handleSubmitEvent = (e) => {
    e.preventDefault();
    if (input.username !== "" && input.password !== "") {
      setError("Username and password cannot be blank.");
      return;
    }

    setError("");
    loginAction(input);
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

      <button>Login</button>
    </form>
  );
};
export default LoginPage;



// ?????The backend will check if the username exists. If it doesn't exist it'll return that it doesn't exist.
// ?????How can I handle that in the frontend?


// Remember to add a logout button in the game page and have it call AuthProvider logout.