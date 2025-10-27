// Navigation functions
function showProfile() {
  document.getElementById('profile').classList.add('active');
  document.getElementById('chat').classList.remove('active');
}

function showChat() {
  document.getElementById('chat').classList.add('active');
  document.getElementById('profile').classList.remove('active');
}

// Chat functionality
function sendMessage() {
  const input = document.getElementById('chatInput');
  const message = input.value.trim();
  
  if (message === '') {
    return;
  }

  const chatMessages = document.getElementById('chatMessages');
  const now = new Date();
  const timestamp = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + 
                    ', ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  // Create message element
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message message-own';
  messageDiv.innerHTML = `
    <div class="message-header">
      <span class="username">Robert</span>
      <span class="timestamp">${timestamp}</span>
    </div>
    <div class="message-content">${escapeHtml(message)}</div>
  `;

  chatMessages.appendChild(messageDiv);
  input.value = '';

  // Auto scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Handle Enter key in chat input
document.addEventListener('DOMContentLoaded', function() {
  const chatInput = document.getElementById('chatInput');
  if (chatInput) {
    chatInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });
  }
});

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
 