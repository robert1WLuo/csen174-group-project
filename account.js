// base API endpoint (local server running on port 8000)
const API = "http://127.0.0.1:8000";

// helper function to send POST requests to the API
async function post(path, body) {
  // send a POST request to API + path with JSON body
  const r = await fetch(API + path, {
    method: "POST",
    headers: {"Content-Type":"application/json"}, // specify JSON format
    body: JSON.stringify(body) // convert JS object to JSON string
  });
  // return parsed JSON response
  return r.json();
}

// function to handle user signup
async function signup(){
  // get email and password values from signup form inputs
  const email = document.getElementById("su-email").value.trim();
  const password = document.getElementById("su-pass").value;
  // get the element where signup response will be displayed
  const out = document.getElementById("su-msg");
  // call the API and display the JSON response in formatted text
  out.textContent = JSON.stringify(await post("/api/signup",{email,password}), null, 2);
}

// function to handle user signin (login)
async function signin(){
  // get email and password values from signin form inputs
  const email = document.getElementById("si-email").value.trim();
  const password = document.getElementById("si-pass").value;
  // get the element where signin response will be displayed
  const out = document.getElementById("si-msg");
  // call the API and display the JSON response in formatted text
  out.textContent = JSON.stringify(await post("/api/signin",{email,password}), null, 2);
}

// function to handle password change
async function changePwd(){
  // get email, old password, and new password values from form inputs
  const email = document.getElementById("cp-email").value.trim();
  const oldPassword = document.getElementById("cp-old").value;
  const newPassword = document.getElementById("cp-new").value;
  
  const out = document.getElementById("cp-msg");
  // call the API with email, oldPassword, and newPassword, then display response
  out.textContent = JSON.stringify(await post("/api/change-password",{email:email, oldPassword, newPassword}), null, 2);
}

// Function to handle account deletion
async function delAcc(){
  // get email and password values from delete account form inputs
  const email = document.getElementById("del-email").value.trim();
  const password = document.getElementById("del-pass").value;
  // get the element where delete account response will be displayed
  const out = document.getElementById("del-msg");
  out.textContent = JSON.stringify(await post("/api/delete-account",{email,password}), null, 2);
}
