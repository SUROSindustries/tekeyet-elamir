document.addEventListener('DOMContentLoaded', function () {
    // API Configuration - only used for final submission
    const API_URL = "https://your-restaurant-api.com/api/reservations";

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
    timeSelect.disabled = true;

    // ======================
    // CLIENT-SIDE AVAILABILITY SYSTEM
    // ======================

    // Mock availability data generator
    function generateMockAvailability(date) {
        // Standard time slots with random availability
        const timeSlots = ["10:00", "12:00", "14:00", "16:00", "18:00", "20:00"];
        const availability = {};

        timeSlots.forEach(time => {
            // Randomize availability (more available in early/late slots)
            let available;
            if (time === "10:00" || time === "20:00") {
                available = Math.floor(Math.random() * 4) + 4; // 4-7 available
            } else {
                available = Math.floor(Math.random() * 3) + 2; // 2-4 available
            }

            availability[time] = {
                available: available,
                total: 8 // Always 8 tables total
            };
        });

        return availability;
    }

    // Simulate checking availability
    function checkLocalAvailability(date, time, guests) {
        const availability = generateMockAvailability(date);
        const slot = availability[time];

        return {
            isAvailable: slot && slot.available >= guests,
            available: slot ? slot.available : 0,
            total: slot ? slot.total : 0
        };
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

        // Get first day of month and total days in month
        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const today = new Date();

        // Create days from previous month
        const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
        for (let i = firstDay - 1; i >= 0; i--) {
            const day = document.createElement('div');
            day.className = 'calendar-day other-month';
            day.textContent = prevMonthDays - i;
            calendarGrid.appendChild(day);
        }

        // Create days for current month
        for (let i = 1; i <= daysInMonth; i++) {
            const day = document.createElement('div');
            day.className = 'calendar-day';

            // Check if this is today
            if (i === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()) {
                day.classList.add('today');
            }

            // Check if this date is selected
            if (selectedDate && i === selectedDate.getDate() && currentMonth === selectedDate.getMonth() && currentYear === selectedDate.getFullYear()) {
                day.classList.add('selected');
            }

            day.textContent = i;

            // Add click event
            day.addEventListener('click', () => {
                const clickedDate = new Date(currentYear, currentMonth, i);
                selectedDate = clickedDate;
                renderCalendar();
                showTimeSlots(clickedDate);

                // Update the date input
                const dateStr = clickedDate.toISOString().split('T')[0];
                dateInput.value = dateStr;
            });

            calendarGrid.appendChild(day);
        }

        // Create days from next month
        const totalCells = firstDay + daysInMonth;
        const nextMonthDays = 42 - totalCells; // 6 rows x 7 days
        for (let i = 1; i <= nextMonthDays; i++) {
            const day = document.createElement('div');
            day.className = 'calendar-day other-month';
            day.textContent = i;
            calendarGrid.appendChild(day);
        }
    }

    // Show time slots for selected date (now syncs with dropdown)
    function showTimeSlots(date) {
        timeSlotsContainer.style.display = 'block';
        timeSlotsContainer.innerHTML = `
            <div class="time-slots-header">
                Available times for ${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
            <div class="time-slots-grid" id="timeSlotsGrid"></div>
        `;

        const timeSlotsGrid = document.getElementById('timeSlotsGrid');
        const availability = generateMockAvailability(date);

        // Clear and repopulate the time dropdown
        timeSelect.innerHTML = '<option value="" disabled selected>Select time</option>';
        timeSelect.disabled = false;

        // Standard time slots
        const timeSlots = ["10:00", "12:00", "14:00", "16:00", "18:00", "20:00"];

        timeSlots.forEach(time => {
            const slot = availability[time];
            const isAvailable = slot && slot.available > 0;

            // Add to visual grid
            const timeSlot = document.createElement('div');
            timeSlot.className = `time-slot ${isAvailable ? '' : 'unavailable'}`;
            timeSlot.textContent = time;
            timeSlot.dataset.time = time;

            if (isAvailable) {
                timeSlot.style.cursor = 'pointer';
                timeSlot.addEventListener('click', () => {
                    selectTime(time);
                });
            } else {
                timeSlot.style.cursor = 'not-allowed';
            }

            timeSlotsGrid.appendChild(timeSlot);

            // Add to dropdown select
            if (isAvailable) {
                const option = document.createElement('option');
                option.value = time;
                option.textContent = time;
                timeSelect.appendChild(option);
            }
        });

        // If a time was previously selected, reselect it
        if (selectedTime) {
            selectTime(selectedTime);
        }
    }

    // Handle time selection (from either visual slots or dropdown)
    function selectTime(time) {
        // Update visual selection
        document.querySelectorAll('.time-slot').forEach(el => {
            el.classList.remove('selected');
            if (el.dataset.time === time) {
                el.classList.add('selected');
            }
        });

        // Update dropdown selection
        timeSelect.value = time;
        selectedTime = time;

        // Update availability status
        if (selectedDate && guestsSelect.value) {
            checkAvailability(selectedDate, time, guestsSelect.value);
        }
    }

    // Check availability (client-side only)
    function checkAvailability(date, time, guests) {
        const { isAvailable, available, total } = checkLocalAvailability(date, time, guests);

        if (isAvailable) {
            availabilityStatus.textContent = `Table available for ${guests} at ${time} (${available} of ${total} tables remaining)`;
            availabilityStatus.className = 'availability-status available';
            submitBtn.disabled = false;
        } else {
            availabilityStatus.textContent = `Only ${available} tables available for ${time}. Not enough for ${guests} guests.`;
            availabilityStatus.className = 'availability-status unavailable';
            submitBtn.disabled = true;
        }
        availabilityStatus.style.display = 'block';
    }

    // ======================
    // BACKEND INTEGRATION (ONLY FOR SUBMISSION)
    // ======================
    async function submitReservation(formData) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error('Booking failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Error submitting reservation:', error);
            throw error;
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

    guestsSelect.addEventListener('change', () => {
        if (selectedDate && selectedTime) {
            checkAvailability(selectedDate, selectedTime, guestsSelect.value);
        }
    });

    timeSelect.addEventListener('change', () => {
        if (timeSelect.value) {
            selectTime(timeSelect.value);
        }
    });

    reservationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing...';

        // Get form values
        const formData = {
            name: document.getElementById('name').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            date: selectedDate.toISOString(),
            time: selectedTime,
            guests: parseInt(guestsSelect.value),
            requests: document.getElementById('requests').value.trim()
        };

        // Client-side validation
        if (!formData.name || !formData.email || !formData.phone) {
            alert('Please fill in all required fields');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Book Now';
            return;
        }

        try {
            // ONLY BACKEND CALL HAPPENS HERE
            const result = await submitReservation(formData);

            // Show success message
            const successHTML = `
                <div class="reservation-success">
                    <h3>Reservation Confirmed!</h3>
                    <p>Thank you, ${formData.name}!</p>
                    <p>Your reservation for ${formData.guests} guests on 
                    ${new Date(formData.date).toLocaleDateString()} at ${formData.time} has been confirmed.</p>
                    <p>Confirmation #: ${result.reservationId || 'DEMO-12345'}</p>
                    <p>A confirmation has been sent to ${formData.email}</p>
                    <button onclick="window.location.reload()">Make Another Reservation</button>
                </div>
            `;

            reservationForm.innerHTML = successHTML;
        } catch (error) {
            console.error('Reservation error:', error);
            alert('Failed to make reservation. Please try again or call us.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Book Now';
        }
    });

    // Initialize
    renderCalendar();
});