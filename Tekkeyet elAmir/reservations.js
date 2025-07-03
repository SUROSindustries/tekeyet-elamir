// ======================
// REAL API INTEGRATION
// ======================
const API_URL = "https://your-heroku-app.herokuapp.com"; // Replace with your actual backend URL

// DOM Elements
const dateInput = document.getElementById('date');
const reservationForm = document.getElementById('reservationForm');
const guestsSelect = document.getElementById('guests');
const timeSelect = document.getElementById('time');
const submitBtn = document.getElementById('submitBtn');
const availabilityStatus = document.getElementById('availabilityStatus');
const calendarModal = document.getElementById('calendarModal');
const closeCalendar = document.getElementById('closeCalendar');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const currentMonthEl = document.getElementById('currentMonth');
const calendarGrid = document.getElementById('calendarGrid');
const timeSlotsContainer = document.getElementById('timeSlotsContainer');

// State variables
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let selectedDate = null;
let selectedTime = null;

// Initialize with today's date
dateInput.min = new Date().toISOString().split('T')[0];

// ======================
// API FUNCTIONS
// ======================
async function fetchAvailability(date) {
    try {
        const response = await fetch(`${API_URL}/api/availability/${date}`);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error('Error fetching availability:', error);
        return null;
    }
}

async function submitReservation(formData) {
    try {
        const response = await fetch(`${API_URL}/api/reservations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        if (!response.ok) throw new Error('Booking failed');
        return await response.json();
    } catch (error) {
        console.error('Error submitting reservation:', error);
        throw error;
    }
}

// ======================
// CALENDAR FUNCTIONS
// ======================
function renderCalendar() {
    calendarGrid.innerHTML = '';
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    currentMonthEl.textContent = `${monthNames[currentMonth]} ${currentYear}`;

    // Day headers
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.textContent = day;
        calendarGrid.appendChild(dayHeader);
    });

    // Calendar days
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const today = new Date();

    for (let i = 0; i < 42; i++) {
        const dayEl = document.createElement('div');
        let dayNumber, isCurrentMonth, isToday, isSelected;

        if (i < firstDay) {
            // Previous month
            dayNumber = new Date(currentYear, currentMonth, 0).getDate() - (firstDay - i - 1);
            isCurrentMonth = false;
        } else if (i < firstDay + daysInMonth) {
            // Current month
            dayNumber = i - firstDay + 1;
            isCurrentMonth = true;
            isToday = dayNumber === today.getDate() &&
                currentMonth === today.getMonth() &&
                currentYear === today.getFullYear();
            isSelected = selectedDate &&
                dayNumber === selectedDate.getDate() &&
                currentMonth === selectedDate.getMonth() &&
                currentYear === selectedDate.getFullYear();
        } else {
            // Next month
            dayNumber = i - firstDay - daysInMonth + 1;
            isCurrentMonth = false;
        }

        dayEl.className = 'calendar-day';
        if (!isCurrentMonth) dayEl.classList.add('other-month');
        if (isToday) dayEl.classList.add('today');
        if (isSelected) dayEl.classList.add('selected');

        dayEl.innerHTML = `<div class="calendar-day-number">${dayNumber}</div>`;

        if (isCurrentMonth) {
            dayEl.addEventListener('click', () => {
                selectedDate = new Date(currentYear, currentMonth, dayNumber);
                renderCalendar();
                updateTimeSlots();
            });
        }

        calendarGrid.appendChild(dayEl);
    }
}

async function updateTimeSlots() {
    if (!selectedDate) return;

    const dateStr = selectedDate.toISOString().split('T')[0];
    const availability = await fetchAvailability(dateStr);

    timeSlotsContainer.innerHTML = `
        <div class="time-slots-header">
            Available times for ${selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
        <div class="time-slots-grid" id="timeSlotsGrid"></div>
    `;

    const timeSlotsGrid = document.getElementById('timeSlotsGrid');
    const timeSlots = ["10:00", "12:00", "14:00", "16:00", "18:00", "20:00"];

    timeSlots.forEach(time => {
        const slot = document.createElement('div');
        const isAvailable = availability && availability[time] && availability[time].available > 0;

        slot.className = `time-slot ${isAvailable ? '' : 'unavailable'}`;
        slot.textContent = time;

        if (isAvailable) {
            slot.addEventListener('click', () => {
                document.querySelectorAll('.time-slot').forEach(el => el.classList.remove('selected'));
                slot.classList.add('selected');
                timeSelect.value = time;
                selectedTime = time;
                checkAvailability();
            });
        }

        timeSlotsGrid.appendChild(slot);
    });
}

async function checkAvailability() {
    if (!selectedDate || !selectedTime || !guestsSelect.value) return;

    const dateStr = selectedDate.toISOString().split('T')[0];
    const availability = await fetchAvailability(dateStr);
    const slotAvailability = availability && availability[selectedTime];

    if (slotAvailability && slotAvailability.available >= parseInt(guestsSelect.value)) {
        availabilityStatus.textContent = `Table for ${guestsSelect.value} available at ${selectedTime}`;
        availabilityStatus.className = 'availability-status available';
        submitBtn.disabled = false;
    } else {
        availabilityStatus.textContent = 'No availability for selected time/guests';
        availabilityStatus.className = 'availability-status unavailable';
        submitBtn.disabled = true;
    }
}

// ======================
// EVENT LISTENERS
// ======================
dateInput.addEventListener('focus', (e) => {
    e.preventDefault();
    calendarModal.style.display = 'block';
});

closeCalendar.addEventListener('click', () => {
    calendarModal.style.display = 'none';
});

prevMonthBtn.addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar();
});

nextMonthBtn.addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar();
});

guestsSelect.addEventListener('change', checkAvailability);

reservationForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        date: selectedDate.toISOString(),
        time: selectedTime,
        guests: guestsSelect.value,
        requests: document.getElementById('requests').value
    };

    try {
        const result = await submitReservation(formData);
        alert(`Reservation confirmed! ID: ${result._id}`);
        reservationForm.reset();
        availabilityStatus.style.display = 'none';
        submitBtn.disabled = true;
    } catch (error) {
        alert('Failed to book reservation. Please try again or call us.');
    }
});

// Initialize
renderCalendar();