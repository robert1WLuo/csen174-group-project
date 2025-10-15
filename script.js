
function showFeed() {
  document.getElementById('feed').classList.add('active');
  document.getElementById('profile').classList.remove('active');
}

function showProfile() {
  document.getElementById('profile').classList.add('active');
  document.getElementById('feed').classList.remove('active');
}

// Post creation
document.getElementById('postForm').addEventListener('submit', function(e) {
  e.preventDefault();
  alert('Post submitted!');
});

// Like functionality
function likePost(button) {
  const countSpan = button.nextElementSibling;
  let count = parseInt(countSpan.textContent);
  countSpan.textContent = count + 1;
}

// Comment functionality
function addComment(button) {
  const input = button.previousElementSibling;
  const comment = input.value.trim();
  if (comment) {
    const list = button.parentElement.nextElementSibling;
    const li = document.createElement('li');
    li.textContent = comment;
    list.appendChild(li);
    input.value = '';
  }
}

// Search functionality
function searchContent() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const posts = document.querySelectorAll('.post');
  posts.forEach(post => {
    const text = post.textContent.toLowerCase();
    post.style.display = text.includes(query) ? 'block' : 'none';
  });
}

// Follow system
function toggleFollow(button) {
  const countSpan = button.nextElementSibling;
  let count = parseInt(countSpan.textContent.split(': ')[1]);
  if (button.textContent === 'Follow') {
    button.textContent = 'Unfollow';
    countSpan.textContent = `Followers: ${count + 1}`;
  } else {
    button.textContent = 'Follow';
    countSpan.textContent = `Followers: ${count - 1}`;
  }
}

//this part of code handles plant modules in user profile
//initially they have 0 module, and maximum module allowed is 5
let petCount = 0;
const maxPets = 5;

//add new plant module
function addPetModule() {
  if (petCount >= maxPets) {
    alert("You can only add up to 5 plants.");
    return;
  }

  const container = document.getElementById('petContainer');
  const petId = `pet-${petCount}`;

  const module = document.createElement('div');
  module.className = 'pet-module';
  module.innerHTML = `
    <label>Pet Photo:</label>
    <input type="file" accept="image/*" onchange="previewPetImage(event, '${petId}')">
    <div id="${petId}-preview"></div>
    <label>Description:</label>
    <textarea placeholder="Describe your plant..."></textarea>
  `;

  container.appendChild(module);
  petCount++;
}

//plant image 
function previewPetImage(event, petId) {
  const previewDiv = document.getElementById(`${petId}-preview`);
  previewDiv.innerHTML = ''; // Clear previous image

  const file = event.target.files[0];
  if (file) {
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.onload = () => URL.revokeObjectURL(img.src); // Free memory
    previewDiv.appendChild(img);
  }
}

/* //authentication configure
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

//authentication implementation
function signUp() {
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;
  auth.createUserWithEmailAndPassword(email, password)
    .then(user => {
      document.getElementById('authStatus').textContent = `Signed up as ${user.user.email}`;
    })
    .catch(error => alert(error.message));
}

function logIn() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  auth.signInWithEmailAndPassword(email, password)
    .then(user => {
      document.getElementById('authStatus').textContent = `Logged in as ${user.user.email}`;
    })
    .catch(error => alert(error.message));
}

function logOut() {
  auth.signOut()
    .then(() => {
      document.getElementById('authStatus').textContent = 'Logged out';
    });
}
    */
