const API_BASE = "http://127.0.0.1:8000";
const MAX_PLANTS = 5;
let editingIndex = -1;
let currentImageData = null;
let notifiedReminders = new Set();

// Check authentication and load user-specific data
window.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;
    
    loadUserInfo();
    renderPlants();
    updateAddButton();
    
    // Check reminders every hour
    setInterval(checkReminders, 3600000);
    // Check immediately on load
    checkReminders();
});

// Check if user is authenticated
function checkAuth() {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('userEmail');
    
    if (!token || !email) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Load user information
function loadUserInfo() {
    const email = localStorage.getItem('userEmail');
    const username = email.split('@')[0];
    document.getElementById('userInfo').textContent = `Logged in as: ${username}`;
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('userEmail');
        window.location.href = 'login.html';
    }
}

function goBack() {
    window.location.href = 'structure.html';
}

// Get user-specific storage key for plants
function getPlantsStorageKey() {
    const email = localStorage.getItem('userEmail');
    return `plants_${email}`;
}

// Get user's plants
function getUserPlants() {
    const storageKey = getPlantsStorageKey();
    return JSON.parse(localStorage.getItem(storageKey) || '[]');
}

// Save user's plants
function saveUserPlants(plants) {
    const storageKey = getPlantsStorageKey();
    localStorage.setItem(storageKey, JSON.stringify(plants));
}

function openAddModal() {
    const plants = getUserPlants();
    if (plants.length >= MAX_PLANTS) {
        alert(`You can only add up to ${MAX_PLANTS} plants.`);
        return;
    }
    editingIndex = -1;
    currentImageData = null;
    document.getElementById('modalTitle').textContent = 'Add New Plant';
    document.getElementById('plantForm').reset();
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('plantModal').classList.add('active');
}

function openEditModal(index) {
    const plants = getUserPlants();
    editingIndex = index;
    const plant = plants[index];
    currentImageData = plant.image;
    
    document.getElementById('modalTitle').textContent = 'Edit Plant';
    document.getElementById('plantName').value = plant.name;
    document.getElementById('plantDescription').value = plant.description;
    
    if (plant.reminder) {
        document.getElementById('reminderType').value = plant.reminder.type || '';
        document.getElementById('reminderFrequency').value = plant.reminder.frequency || '';
        document.getElementById('lastCareDate').value = plant.reminder.lastCareDate || '';
    }
    
    if (plant.image) {
        const preview = document.getElementById('imagePreview');
        preview.innerHTML = `<img src="${plant.image}" alt="Preview">`;
        preview.style.display = 'block';
    }
    
    document.getElementById('plantModal').classList.add('active');
}

function closeModal() {
    document.getElementById('plantModal').classList.remove('active');
    document.getElementById('plantForm').reset();
    document.getElementById('imagePreview').style.display = 'none';
    editingIndex = -1;
    currentImageData = null;
}

function previewImage(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('imagePreview');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            currentImageData = e.target.result;
            preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        preview.style.display = 'none';
        currentImageData = null;
    }
}

document.getElementById('plantForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const plants = getUserPlants();
    const reminderType = document.getElementById('reminderType').value;
    const reminderFrequency = document.getElementById('reminderFrequency').value;
    const lastCareDate = document.getElementById('lastCareDate').value;

    const plantData = {
        name: document.getElementById('plantName').value,
        description: document.getElementById('plantDescription').value,
        image: currentImageData,
        dateAdded: editingIndex === -1 ? new Date().toISOString() : plants[editingIndex].dateAdded,
        reminder: reminderType ? {
            type: reminderType,
            frequency: parseInt(reminderFrequency) || null,
            lastCareDate: lastCareDate || null
        } : null
    };

    if (editingIndex === -1) {
        plants.push(plantData);
    } else {
        plants[editingIndex] = plantData;
    }

    saveUserPlants(plants);
    renderPlants();
    updateAddButton();
    closeModal();
});

function deletePlant(index) {
    if (confirm('Are you sure you want to delete this plant?')) {
        const plants = getUserPlants();
        plants.splice(index, 1);
        saveUserPlants(plants);
        renderPlants();
        updateAddButton();
    }
}

function getReminderStatus(plant) {
    if (!plant.reminder || !plant.reminder.lastCareDate || !plant.reminder.frequency) {
        return null;
    }

    const lastCare = new Date(plant.reminder.lastCareDate);
    const today = new Date();
    const daysSinceLastCare = Math.floor((today - lastCare) / (1000 * 60 * 60 * 24));
    const daysUntilNext = plant.reminder.frequency - daysSinceLastCare;

    return {
        daysUntilNext,
        isDue: daysUntilNext <= 0,
        isUpcoming: daysUntilNext > 0 && daysUntilNext <= 2
    };
}

function getReminderIcon(type) {
    const icons = {
        watering: '💧',
        fertilizing: '🌿',
        repotting: '🪴',
        pruning: '✂️',
        other: '📝'
    };
    return icons[type] || '⏰';
}

function renderPlants() {
    const plants = getUserPlants();
    const container = document.getElementById('plantsContainer');
    const emptyState = document.getElementById('emptyState');
    
    if (plants.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';
    container.innerHTML = plants.map((plant, index) => {
        const reminderStatus = getReminderStatus(plant);
        let reminderBadge = '';
        let reminderInfo = '';

        if (reminderStatus) {
            if (reminderStatus.isDue) {
                reminderBadge = '<div class="reminder-badge">Due Now!</div>';
                reminderInfo = `<div class="reminder-info due">${getReminderIcon(plant.reminder.type)} ${plant.reminder.type.charAt(0).toUpperCase() + plant.reminder.type.slice(1)} is due now!</div>`;
            } else if (reminderStatus.isUpcoming) {
                reminderBadge = `<div class="reminder-badge upcoming">In ${reminderStatus.daysUntilNext}d</div>`;
                reminderInfo = `<div class="reminder-info upcoming">${getReminderIcon(plant.reminder.type)} ${plant.reminder.type.charAt(0).toUpperCase() + plant.reminder.type.slice(1)} in ${reminderStatus.daysUntilNext} day${reminderStatus.daysUntilNext > 1 ? 's' : ''}</div>`;
            } else {
                reminderInfo = `<div class="reminder-info">${getReminderIcon(plant.reminder.type)} Next ${plant.reminder.type} in ${reminderStatus.daysUntilNext} days</div>`;
            }
        } else if (plant.reminder && plant.reminder.type) {
            reminderInfo = `<div class="reminder-info">${getReminderIcon(plant.reminder.type)} ${plant.reminder.type.charAt(0).toUpperCase() + plant.reminder.type.slice(1)} reminder set</div>`;
        }

        return `
            <div class="plant-card">
                <div class="plant-image-container ${plant.image ? '' : 'empty'}">
                    ${plant.image ? `<img src="${plant.image}" alt="${plant.name}">` : '🌱'}
                    ${reminderBadge}
                </div>
                <div class="plant-info">
                    <h3>${escapeHtml(plant.name)}</h3>
                    <p>${escapeHtml(plant.description || 'No description provided.')}</p>
                    ${reminderInfo}
                </div>
                <div class="plant-actions">
                    <button class="edit-btn" onclick="openEditModal(${index})">Edit</button>
                    <button class="delete-btn" onclick="deletePlant(${index})">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

function updateAddButton() {
    const plants = getUserPlants();
    const addBtn = document.getElementById('addPlantBtn');
    if (plants.length >= MAX_PLANTS) {
        addBtn.disabled = true;
        addBtn.textContent = `Maximum ${MAX_PLANTS} plants reached`;
    } else {
        addBtn.disabled = false;
        addBtn.textContent = '+ Add New Plant';
    }
}

// function checkReminders() {
//     const plants = getUserPlants();
//     const email = localStorage.getItem('userEmail');
    
//     plants.forEach((plant, index) => {
//         const status = getReminderStatus(plant);
//         if (status && (status.isDue || status.isUpcoming)) {
//             const reminderKey = `${email}-${index}-${plant.reminder.lastCareDate}`;
            
//             // Only send email if we haven't already notified about this reminder
//             if (!notifiedReminders.has(reminderKey)) {
//                 sendReminderEmail(plant, status);
//                 notifiedReminders.add(reminderKey);
//                 console.log(`Reminder email triggered for: ${plant.name}`);
//             }
//         }
//     });
// }

// function sendReminderEmail(plant, status) {
//     const email = localStorage.getItem('userEmail');
//     const reminderType = plant.reminder.type.charAt(0).toUpperCase() + plant.reminder.type.slice(1);
    
//     let statusText;
//     if (status.isDue) {
//         statusText = 'is due now';
//     } else if (status.isUpcoming) {
//         statusText = `is approaching (in ${status.daysUntilNext} day${status.daysUntilNext > 1 ? 's' : ''})`;
//     }

//     const subject = 'Reminder is approaching';
//     const body = `Hi ${email.split('@')[0]},\n\nThis is a reminder that your plant "${plant.name}" needs ${reminderType.toLowerCase()} - ${statusText}!\n\nPlease take care of your plant.\n\nBest regards,\nPlant Diary`;
    
//     const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
//     // Opens the user's default email client with pre-filled content
//     window.open(mailtoLink);
// }

// ---------- Reminders: trigger on due-day or 1-day-early ----------
function checkReminders() {
    const plants = getUserPlants();
    const email = localStorage.getItem('userEmail');
    if (!email) return;
    
    plants.forEach((plant, index) => {
        const status = getReminderStatus(plant);
        if (!status) return;

        // the day or the day before
        const isAdvance1Day = status.daysUntilNext === 1;
        if (status.isDue || isAdvance1Day) {
            // key with daysUntilNext to differentiate the day and the day before
            const reminderKey = `${email}-${index}-${plant.reminder.lastCareDate}-${status.daysUntilNext}`;
            if (!notifiedReminders.has(reminderKey)) {
                sendReminderEmail(plant, status, isAdvance1Day);
                notifiedReminders.add(reminderKey);
                console.log(`Reminder email triggered for: ${plant.name} (daysUntilNext=${status.daysUntilNext})`);
            }
        }
    });
}

// Modified: switched from mailto to backend API; falls back to mailto on failure to keep demo functional
async function sendReminderEmail(plant, status, isAdvance1Day) {
    const email = localStorage.getItem('userEmail');
    const reminderType = plant.reminder.type.charAt(0).toUpperCase() + plant.reminder.type.slice(1);

    const whenText = status.isDue
        ? 'is due now'
        : (isAdvance1Day ? 'is due tomorrow' : `in ${status.daysUntilNext} day${status.daysUntilNext > 1 ? 's' : ''}`);

    const subject = `Plant reminder: ${plant.name} ${whenText}`;
    const body = `Hi ${email.split('@')[0]},\n\nThis is a reminder that your plant "${plant.name}" needs ${reminderType.toLowerCase()} — ${whenText}.\n\n• Last care date: ${plant.reminder.lastCareDate || 'N/A'}\n• Frequency: every ${plant.reminder.frequency || '?'} day(s)\n\nPlease take care of your plant.\n\n— Plant Diary`;

    try {
        const r = await fetch(`${API_BASE}/api/send-reminder`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ to: email, subject, body })
        });
        const j = await r.json();
        if (!j.ok) {
            console.error('Server send failed:', j.error);
            // fallback：mailto
            const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            window.open(mailtoLink);
        }
    } catch (err) {
        console.error('Server send error:', err);
        // fallback：mailto
        const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailtoLink);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}