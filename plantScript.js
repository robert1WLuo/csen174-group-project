const API = "http://127.0.0.1:8000"; // base api url
const MAX_PLANTS = 5; // maximum number of plants allowed per user
let plants = []; // array to hold plant data
let editingIndex = -1; // index of plant currently being edited (-1 means none)
let currentImageData = null; // stores image data for preview/upload
let notifiedReminders = new Set(); // track reminders already notified

// check authentication and load user-specific data
window.addEventListener('DOMContentLoaded', async () => {
    if (!checkAuth()) return;
    
     loadUserInfo();
    // wait until plants are loaded
    await loadPlants();

    // check reminders immediately
    checkReminders();
    // check reminders every hour
    setInterval(checkReminders, 3600000);
});

// check if user is authenticated
function checkAuth() {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('userEmail');
    // redirect to login if not authenticated
    if (!token || !email) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// load user information and display username
function loadUserInfo() {
    const email = localStorage.getItem('userEmail');
    const username = email.split('@')[0];
    document.getElementById('userInfo').textContent = `Logged in as: ${username}`;
}

// logout function
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


// api helper function to send requests with authorization
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
        // handle expired session
        if (error.message.includes('unauthorized')) {
            alert('Session expired. Please login again.');
            window.location.href = 'login.html';
        }
        throw error;
    }
}

// load plants from server
async function loadPlants() {
    try {
        plants = await apiRequest('/api/plants');
        renderPlants();
        updateAddButton();
    } catch (error) {
        console.error('Failed to load plants:', error);
        alert('Failed to load plants. Please try again.');
    }
}

// open modal for adding a new plant
function openAddModal() {
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

// open modal for editing an existing plant
function openEditModal(index) {
    editingIndex = index;
    const plant = plants[index];
    currentImageData = plant.image;
    
    document.getElementById('modalTitle').textContent = 'Edit Plant';
    document.getElementById('plantName').value = plant.name;
    document.getElementById('plantDescription').value = plant.description;

    // populate reminder fields if they exist
    if (plant.reminder) {
        document.getElementById('reminderType').value = plant.reminder.type || '';
        document.getElementById('reminderFrequency').value = plant.reminder.frequency || '';
        document.getElementById('lastCareDate').value = plant.reminder.lastCareDate || '';
    }
        // show image preview if available
    if (plant.image) {
        const preview = document.getElementById('imagePreview');
        preview.innerHTML = `<img src="${plant.image}" alt="Preview">`;
        preview.style.display = 'block';
    }
    
    document.getElementById('plantModal').classList.add('active');
}
// close modal and reset form
function closeModal() {
    document.getElementById('plantModal').classList.remove('active');
    document.getElementById('plantForm').reset();
    document.getElementById('imagePreview').style.display = 'none';
    editingIndex = -1;
    currentImageData = null;
}

// preview image before saving plant
function previewImage(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('imagePreview');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            currentImageData = e.target.result;
            preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            preview.style.display = 'flex';
        };
        reader.readAsDataURL(file);
    } else {
        preview.style.display = 'none';
        currentImageData = null;
    }
}

// handle form submission for adding or editing plant
document.getElementById('plantForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
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

    try {
        if (editingIndex === -1) {
        // add new plant
            await apiRequest('/api/plants', 'POST', { plant: plantData });
        } else {
            // update existing plant
            await apiRequest('/api/plants', 'PUT', { index: editingIndex, plant: plantData });
        }
        
        await loadPlants();
        closeModal();
    } catch (error) {
        console.error('Failed to save plant:', error);
        alert('Failed to save plant. Please try again.');
    }
});

// delete plant by index
async function deletePlant(index) {
    if (confirm('Are you sure you want to delete this plant?')) {
        try {
            await apiRequest('/api/plants', 'DELETE', { index });
            await loadPlants();
        } catch (error) {
            console.error('Failed to delete plant:', error);
            alert('Failed to delete plant. Please try again.');
        }
    }
}

// calculate reminder status for a plant
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

// return emoji icon based on reminder type
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

// render plant cards in container
function renderPlants() {
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
    // build reminder badge and info text
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
                    ${plant.image ? `<img src="${plant.image}" alt="${escapeHtml(plant.name)}">` : '🌱'}
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
    const addBtn = document.getElementById('addPlantBtn');
    if (plants.length >= MAX_PLANTS) {
        addBtn.disabled = true;
        addBtn.textContent = `Maximum ${MAX_PLANTS} plants reached`;
    } else {
        addBtn.disabled = false;
        addBtn.textContent = '+ Add New Plant';
    }
}

// ---------- Reminders: trigger on due-day or 1-day-early ----------
function checkReminders() {
    const email = localStorage.getItem('userEmail');
    if (!email) return;

    console.log('[checkReminders] plants.length =', plants.length);

    plants.forEach((plant, index) => {
        const status = getReminderStatus(plant);
        if (!status) return;

        const isAdvance1Day = status.daysUntilNext === 1;

        if (status.isDue || isAdvance1Day) {
            const keyId = plant.id || index;
            const reminderKey =
                `${email}-${keyId}-${plant.reminder.lastCareDate}-${status.daysUntilNext}`;

            if (!notifiedReminders.has(reminderKey)) {
                sendReminderEmail(plant, status, isAdvance1Day);
                notifiedReminders.add(reminderKey);
                console.log(
                    `Reminder email triggered for: ${plant.name} (daysUntilNext=${status.daysUntilNext})`
                );
            }
        }
    });
}

async function sendReminderEmail(plant, status, isAdvance1Day) {
    const email = localStorage.getItem('userEmail');
    if (!email) return;

    const reminderType =
        plant.reminder.type.charAt(0).toUpperCase() + plant.reminder.type.slice(1);

    const whenText = status.isDue
        ? 'is due now'
        : (isAdvance1Day
            ? 'is due tomorrow'
            : `in ${status.daysUntilNext} day${status.daysUntilNext > 1 ? 's' : ''}`);

    const subject = `Plant reminder: ${plant.name} ${whenText}`;
    const body =
`Hi ${email.split('@')[0]},\n
This is a reminder that your plant "${plant.name}" needs ${reminderType.toLowerCase()} — ${whenText}.\n
• Last care date: ${plant.reminder.lastCareDate || 'N/A'}
• Frequency: every ${plant.reminder.frequency || '?'} day(s)\n
Please take care of your plant.\n
— Plant Diary`;

    console.log('[sendReminderEmail] calling backend /api/send-reminder');

    try {
        const r = await fetch(`${API}/api/send-reminder`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: email, subject, body })
        });
        const j = await r.json();
        console.log('[sendReminderEmail] server response:', j);

        if (!j.ok) {
            console.error('Server send failed:', j.error);
            // fallback: mailto
            const mailtoLink =
                `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            window.open(mailtoLink);
        }
    } catch (err) {
        console.error('Server send error:', err);
        // fallback: mailto
        const mailtoLink =
            `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailtoLink);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;

}
