const API = "http://127.0.0.1:8000";

// Check authentication on page load
window.addEventListener('DOMContentLoaded', function() {
  checkAuth();
  loadUserProfile();
  loadChatMessages();
  
  // Set up chat input Enter key listener
  const chatInput = document.getElementById('chatInput');
  if (chatInput) {
    chatInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });
  }
});

// Check if user is authenticated
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

// Load user profile information
function loadUserProfile() {
  const email = localStorage.getItem('userEmail');
  if (!email) return;
  
  // Extract username from email (part before @)
  const username = email.split('@')[0];
  
  document.getElementById('userName').textContent = username;
  document.getElementById('userEmail').textContent = email;
}

// Logout function
function logout() {
  if (confirm('Are you sure you want to logout?')) {
    // Clear chat messages from localStorage for this user
    const email = localStorage.getItem('userEmail');
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    
    // Redirect to login
    window.location.href = 'login.html';
  }
}

// Navigation functions
function showProfile() {
  document.getElementById('profile').classList.add('active');
  document.getElementById('chat').classList.remove('active');
}

function showChat() {
  document.getElementById('chat').classList.add('active');
  document.getElementById('profile').classList.remove('active');
  loadChatMessages();
}

// Chat functionality with user-specific storage
function getChatStorageKey() {
  return 'chatMessages'; // Shared chat for all users
}

function loadChatMessages() {
  const chatMessages = document.getElementById('chatMessages');
  const storageKey = getChatStorageKey();
  const messages = JSON.parse(localStorage.getItem(storageKey) || '[]');
  
  chatMessages.innerHTML = '';
   
  messages.forEach(msg => renderMessage(msg));
  
  
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
  const username = email.split('@')[0];
  const now = new Date();
  const timestamp = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + 
                    ', ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const messageData = {
    email: email,
    username: username,
    timestamp: timestamp,
    content: message
  };

  // Save to localStorage
  const storageKey = getChatStorageKey();
  const messages = JSON.parse(localStorage.getItem(storageKey) || '[]');
  messages.push(messageData);
  localStorage.setItem(storageKey, JSON.stringify(messages));

  // Render the message
  renderMessage(messageData);
  
  input.value = '';

  // Auto scroll to bottom
  const chatMessages = document.getElementById('chatMessages');
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}