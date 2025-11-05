const API = "http://127.0.0.1:8000"; 
let isLogin = true;

function toggleForm() {
  isLogin = !isLogin;
  document.getElementById("formTitle").textContent = isLogin ? "Login" : "Register";
  document.querySelector("button").textContent = isLogin ? "Login" : "Register";
  document.getElementById("toggleText").textContent = isLogin
    ? "Don't have an account? Register"
    : "Already have an account? Login";
  document.getElementById("message").textContent = "";
}

async function submitForm() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const msg = document.getElementById("message");
  msg.textContent = "";

  if (!email || !password) {
    msg.textContent = "Please fill in both fields.";
    msg.className = "error";
    return;
  }

  const endpoint = isLogin ? "/api/signin" : "/api/signup";
  try {
    const res = await fetch(API + endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (!data.ok) {
      msg.textContent = data.error || "Something went wrong.";
      msg.className = "error";
      return;
    }

    if (isLogin) {
      // Save session info
      localStorage.setItem("userEmail", data.data.email);
      localStorage.setItem("token", data.data.token);
      msg.textContent = "Login successful! Redirecting...";
      msg.className = "success";
      setTimeout(() => window.location.href = "structure.html", 1000);
    } else {
      msg.textContent = "Registration successful! You can now log in.";
      msg.className = "success";
      toggleForm();
    }

  } catch (err) {
    console.error(err);
    msg.textContent = "Server error.";
    msg.className = "error";
  }
}