
const MAX_PLANTS = 5;
let plants = [];
let editingIndex = -1;
let currentImageData = null;
let notifiedReminders = new Set(); // Track which reminders we've already sent

// Load plants from memory on page load
window.addEventListener('DOMContentLoaded', () => {
    renderPlants();
    updateAddButton();
    // Check reminders every hour
    setInterval(checkReminders, 3600000);
    // Check immediately on load
    checkReminders();
});

function goBack() {
    window.history.back();
}

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

function openEditModal(index) {
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
        reader.onload = function (e) {
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

document.getElementById('plantForm').addEventListener('submit', function (e) {
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

    if (editingIndex === -1) {
        plants.push(plantData);
    } else {
        plants[editingIndex] = plantData;
    }

    renderPlants();
    updateAddButton();
    closeModal();
});

function deletePlant(index) {
    if (confirm('Are you sure you want to delete this plant?')) {
        plants.splice(index, 1);
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
                            <h3>${plant.name}</h3>
                            <p>${plant.description || 'No description provided.'}</p>
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

function checkReminders() {
    plants.forEach((plant, index) => {
        const status = getReminderStatus(plant);
        if (status && (status.isDue || status.isUpcoming)) {
            const reminderKey = `${index}-${plant.reminder.lastCareDate}`;

            // Only send email if we haven't already notified about this reminder
            if (!notifiedReminders.has(reminderKey)) {
                sendReminderEmail(plant, status);
                notifiedReminders.add(reminderKey);
                console.log(`Reminder email triggered for: ${plant.name}`);
            }
        }
    });
}

function sendReminderEmail(plant, status) {
    const reminderType = plant.reminder.type.charAt(0).toUpperCase() + plant.reminder.type.slice(1);

    let statusText;
    if (status.isDue) {
        statusText = 'is due now';
    } else if (status.isUpcoming) {
        statusText = `is approaching (in ${status.daysUntilNext} day${status.daysUntilNext > 1 ? 's' : ''})`;
    }

    const subject = 'Reminder is approaching';
    const body = `Hi there,\n\nThis is a reminder that your plant "${plant.name}" needs ${reminderType.toLowerCase()} - ${statusText}!\n\nPlease take care of your plant.\n\nBest regards,\nPlant Diary`;

    // the current email is fixed at test@test.com
    const mailtoLink = `mailto:test@test.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Opens the user's default email client with pre-filled content
    window.open(mailtoLink);
} 