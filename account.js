const API = "http://127.0.0.1:8000";

async function post(path, body) {
  const r = await fetch(API + path, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify(body)
  });
  return r.json();
}

async function signup(){
  const email = document.getElementById("su-email").value.trim();
  const password = document.getElementById("su-pass").value;
  const out = document.getElementById("su-msg");
  out.textContent = JSON.stringify(await post("/api/signup",{email,password}), null, 2);
}
async function signin(){
  const email = document.getElementById("si-email").value.trim();
  const password = document.getElementById("si-pass").value;
  const out = document.getElementById("si-msg");
  out.textContent = JSON.stringify(await post("/api/signin",{email,password}), null, 2);
}
async function changePwd(){
  const email = document.getElementById("cp-email").value.trim();
  const oldPassword = document.getElementById("cp-old").value;
  const newPassword = document.getElementById("cp-new").value;
  const out = document.getElementById("cp-msg");
  out.textContent = JSON.stringify(await post("/api/change-password",{email:email, oldPassword, newPassword}), null, 2);
}
async function delAcc(){
  const email = document.getElementById("del-email").value.trim();
  const password = document.getElementById("del-pass").value;
  const out = document.getElementById("del-msg");
  out.textContent = JSON.stringify(await post("/api/delete-account",{email,password}), null, 2);
}