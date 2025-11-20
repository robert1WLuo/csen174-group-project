const API = "http://127.0.0.1:8000";
let currentProfileImageData = null;

// check authentication on page load
window.addEventListener('DOMContentLoaded', function() {
  checkAuth();
  loadUserProfile();
  loadChatMessages();
  
  // set up chat input Enter key listener
  const chatInput = document.getElementById('chatInput');
  if (chatInput) {
    chatInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });
  }
});

// check if user is authenticated
function checkAuth() {
  const token = localStorage.getItem('token');
  const email = localStorage.getItem('userEmail');
  
  if (!token || !email) {
    // Redirect to login if not authenticated
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

// API Helper function
async function apiRequest(endpoint, method = 'GET', body = null) {
  const token = localStorage.getItem('token');
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(API + endpoint, options);
    const data = await response.json();
    
    if (!data.ok) {
      throw new Error(data.error || 'Request failed');
    }
    
    return data.data;
  } catch (error) {
    console.error('API Error:', error);
    if (error.message.includes('unauthorized')) {
      alert('Session expired. Please login again.');
      window.location.href = 'login.html';
    }
    throw error;
  }
}

// load user profile information
async function loadUserProfile() {
  const email = localStorage.getItem('userEmail');
  if (!email) return;
  
  try {
    // get profile from server
    const profile = await apiRequest('/api/profile');
    
    // display profile
    const displayName = profile.name || email.split('@')[0];
    const profileImage = profile.image || 'images/github.png';
    
    document.getElementById('userName').textContent = displayName;
    document.getElementById('userEmail').textContent = email;
    document.getElementById('profileImage').src = profileImage;
  } catch (error) {
    // if profile doesn't exist yet, use defaults
    const username = email.split('@')[0];
    document.getElementById('userName').textContent = username;
    document.getElementById('userEmail').textContent = email;
  }
}

// open edit profile modal
function openEditProfileModal() {
  const email = localStorage.getItem('userEmail');
  const currentName = document.getElementById('userName').textContent;
  const currentImage = document.getElementById('profileImage').src;
  
  document.getElementById('profileName').value = currentName;
  document.getElementById('profileImagePreview').src = currentImage;
  currentProfileImageData = currentImage.startsWith('data:') ? currentImage : null;
  
  document.getElementById('editProfileModal').classList.add('active');
}

// close edit profile modal
function closeEditProfileModal() {
  document.getElementById('editProfileModal').classList.remove('active');
  currentProfileImageData = null;
}

// preview profile image
function previewProfileImage(event) {
  const file = event.target.files[0];
  const preview = document.getElementById('profileImagePreview');
  
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      currentProfileImageData = e.target.result;
      preview.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
}

// handle profile edit form submission
document.getElementById('editProfileForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const name = document.getElementById('profileName').value.trim();
  
  if (!name) {
    alert('Please enter a display name');
    return;
  }
  
  try {
    const profileData = {
      name: name,
      image: currentProfileImageData || document.getElementById('profileImage').src
    };
    
    await apiRequest('/api/profile', 'POST', profileData);
    
    // update display
    document.getElementById('userName').textContent = name;
    if (currentProfileImageData) {
      document.getElementById('profileImage').src = currentProfileImageData;
    }
    
    closeEditProfileModal();
    alert('Profile updated successfully!');
  } catch (error) {
    console.error('Failed to update profile:', error);
    alert('Failed to update profile. Please try again.');
  }
});

// logout function
function logout() {
  if (confirm('Are you sure you want to logout?')) {
    // Clear chat messages from localStorage for this user
    const email = localStorage.getItem('userEmail');
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    
    // redirect to login
    window.location.href = 'login.html';
  }
}

// navigation functions
function showProfile() {
  document.getElementById('profile').classList.add('active');
  document.getElementById('chat').classList.remove('active');
}

function showChat() {
  document.getElementById('chat').classList.add('active');
  document.getElementById('profile').classList.remove('active');
  loadChatMessages();
}

// chat functionality with user-specific storage
function getChatStorageKey() {
  return 'chatMessages'; // Shared chat for all users
}

function loadChatMessages() {
  const chatMessages = document.getElementById('chatMessages');
  const storageKey = getChatStorageKey();
  const messages = JSON.parse(localStorage.getItem(storageKey) || '[]');
  
  chatMessages.innerHTML = '';
  messages.forEach(msg => {renderMessage(msg);}); 
  
  // Auto scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function renderMessage(msg) {
  const chatMessages = document.getElementById('chatMessages');
  const currentEmail = localStorage.getItem('userEmail');
  
  const messageDiv = document.createElement('div');
  messageDiv.className = msg.email === currentEmail ? 'message message-own' : 'message message-other';
  messageDiv.innerHTML = `
    <div class="message-header">
      <span class="username">${escapeHtml(msg.username)}</span>
      <span class="timestamp">${escapeHtml(msg.timestamp)}</span>
    </div>
    <div class="message-content">${escapeHtml(msg.content)}</div>
  `;
  
  chatMessages.appendChild(messageDiv);
}

function sendMessage() {
  const input = document.getElementById('chatInput');
  const message = input.value.trim();
  
  if (message === '') {
    return;
  }

  const email = localStorage.getItem('userEmail');
  const username = document.getElementById('userName').textContent;
  const now = new Date();
  const timestamp = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + 
                    ', ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const messageData = {
    email: email,
    username: username,
    timestamp: timestamp,
    content: message
  };

  // save to localStorage
  const storageKey = getChatStorageKey();
  const messages = JSON.parse(localStorage.getItem(storageKey) || '[]');
  messages.push(messageData);
  localStorage.setItem(storageKey, JSON.stringify(messages));

  // render the message
  renderMessage(messageData);
  
  input.value = '';

  // auto scroll to bottom
  const chatMessages = document.getElementById('chatMessages');
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;

}
