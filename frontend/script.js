// ---- LOG WORKOUT PAGE ----

// ---- LOG WORKOUT PAGE ----

// ---- LOG WORKOUT PAGE ----

const addExerciseBtn = document.getElementById('add-exercise-btn');
const exerciseList = document.getElementById('exercise-list');
let exerciseRowCount = 1;

if (addExerciseBtn) {
    addExerciseBtn.addEventListener('click', function() {
        exerciseRowCount++;

        const newRow = document.createElement('div');
        newRow.className = 'exercise-row';
        newRow.innerHTML = `
            <select class="muscle-select" name="muscle-${exerciseRowCount}" required>
                <option value="">Muscle group</option>
                <option value="Chest">Chest</option>
                <option value="Upper Chest">Upper Chest</option>
                <option value="Lower Chest">Lower Chest</option>
                <option value="Back">Back</option>
                <option value="Lats">Lats</option>
                <option value="Legs">Legs</option>
                <option value="Quads">Quads</option>
                <option value="Hamstrings">Hamstrings</option>
                <option value="Glutes">Glutes</option>
                <option value="Shoulders">Shoulders</option>
                <option value="Arms">Arms</option>
                <option value="Biceps">Biceps</option>
                <option value="Triceps">Triceps</option>
                <option value="Core">Core</option>
                <option value="Cardio">Cardio</option>
                <option value="Endurance">Endurance</option>
                <option value="Others">Others</option>
            </select>
            <input type="text" class="custom-muscle-input" name="custom-muscle-${exerciseRowCount}" placeholder="Specify muscle" autocomplete="off" style="display:none;">
            <input type="text" class="exercise-input" name="exercise-${exerciseRowCount}" placeholder="e.g. Bench Press" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" required>
        `;
        exerciseList.appendChild(newRow);
    });
}

// Show/hide the "specify muscle" field whenever ANY dropdown changes
// (event delegation: one listener on the container handles all rows, even future ones)
if (exerciseList) {
    exerciseList.addEventListener('change', function(event) {
        if (event.target.classList.contains('muscle-select')) {
            const row = event.target.closest('.exercise-row');
            const customInput = row.querySelector('.custom-muscle-input');

            if (event.target.value === 'Others') {
                customInput.style.display = 'block';
                customInput.required = true;
            } else {
                customInput.style.display = 'none';
                customInput.required = false;
                customInput.value = '';
            }
        }
    });
}

const logForm = document.querySelector('.log-form');

if (logForm) {
    logForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const date = document.getElementById('date').value;
        const duration = document.getElementById('duration').value;
        const notes = document.getElementById('notes').value;
        const rows = document.querySelectorAll('.exercise-row');

        const savePromises = [];

        rows.forEach(function(row) {
            let muscle = row.querySelector('.muscle-select').value;
            const exercise = row.querySelector('.exercise-input').value;

            if (muscle === 'Others') {
                const customValue = row.querySelector('.custom-muscle-input').value;
                muscle = customValue || 'Others';
            }

            const workoutData = {
                date: date,
                muscle: muscle,
                exercise: exercise,
                duration: duration,
                notes: notes
            };

            const savePromise = fetch('http://127.0.0.1:5001/workouts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(workoutData)
}).then(function(response) {
    if (!response.ok) {
        throw new Error('Server responded with status ' + response.status);
    }
    return response.json();
});

savePromises.push(savePromise);
        });
console.log('Sending workout data:', document.querySelectorAll('.exercise-row'));
        Promise.all(savePromises)
            .then(function() {
                alert('Workout saved!');
                window.location.href = 'dashboard.html';
            })
            .catch(function(error) {
                console.error('Error saving workout:', error);
                alert('Something went wrong saving your workout. Check the console for details.');
            });
    });
}

/// ---- DASHBOARD PAGE ----

const progressGrid = document.querySelector('.progress-grid');

if (progressGrid) {
    const workouts = JSON.parse(localStorage.getItem('workouts')) || [];

    const dayMap = {
        0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat'
    };

    const dayFullNames = {
        mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday',
        fri: 'Friday', sat: 'Saturday', sun: 'Sunday'
    };

    const today = new Date();
    const todayDayNum = today.getDay();
    const daysSinceMonday = todayDayNum === 0 ? 6 : todayDayNum - 1;

    const monday = new Date(today);
    monday.setDate(today.getDate() - daysSinceMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const entriesByDay = {};

    workouts.forEach(function(workout) {
        const workoutDate = new Date(workout.date);

        if (workoutDate >= monday && workoutDate <= sunday) {
            const dayOfWeek = dayMap[workoutDate.getDay()];

            if (!entriesByDay[dayOfWeek]) {
                entriesByDay[dayOfWeek] = [];
            }
            entriesByDay[dayOfWeek] = entriesByDay[dayOfWeek].concat(workout.entries);
        }
    });

    Object.keys(dayMap).forEach(function(key) {
        const day = dayMap[key];
        const box = document.getElementById('box-' + day);
        const muscleLabel = document.getElementById('muscle-' + day);

        if (box && muscleLabel) {
            const dayEntries = entriesByDay[day];

            if (dayEntries && dayEntries.length > 0) {
                box.classList.add('done');
                const count = dayEntries.length;
                muscleLabel.textContent = count + (count === 1 ? ' exercise' : ' exercises');
                muscleLabel.classList.add('tag-count');
            } else {
                box.classList.remove('done');
                muscleLabel.textContent = '—';
                muscleLabel.classList.remove('tag-count');
            }

            // Click handler to open the modal for this day
            box.addEventListener('click', function() {
                openDayModal(day, dayFullNames[day], entriesByDay[day] || []);
            });
        }
    });
}

// ---- MODAL LOGIC ----

function openDayModal(dayKey, dayName, entries) {
    const modal = document.getElementById('day-modal');
    const title = document.getElementById('modal-day-title');
    const list = document.getElementById('modal-exercise-list');

    title.textContent = dayName;
    list.innerHTML = '';

    if (entries.length === 0) {
        list.innerHTML = '<li class="empty-message">No workout logged for this day yet.</li>';
    } else {
        entries.forEach(function(entry) {
            const li = document.createElement('li');
            li.innerHTML = '<strong>' + entry.muscle + '</strong> — ' + entry.exercise;
            list.appendChild(li);
        });
    }

    modal.classList.add('open');
}

const modalCloseBtn = document.getElementById('modal-close-btn');
const modalOverlay = document.getElementById('day-modal');

if (modalCloseBtn && modalOverlay) {
    modalCloseBtn.addEventListener('click', function() {
        modalOverlay.classList.remove('open');
    });

    // Also close if clicking the dark background (outside the box)
    modalOverlay.addEventListener('click', function(event) {
        if (event.target === modalOverlay) {
            modalOverlay.classList.remove('open');
        }
    });
}
// ---- HISTORY PAGE ----

const historyList = document.getElementById('history-list');
const dateFilter = document.getElementById('date-filter');

if (historyList) {
    const workouts = JSON.parse(localStorage.getItem('workouts')) || [];

    if (workouts.length === 0) {
        historyList.innerHTML = '<p class="history-empty">No workouts logged yet. Go log your first one!</p>';
    } else {
        const entriesByDate = {};

        workouts.forEach(function(workout) {
            if (!entriesByDate[workout.date]) {
                entriesByDate[workout.date] = [];
            }
            entriesByDate[workout.date] = entriesByDate[workout.date].concat(workout.entries);
        });

        const sortedDates = Object.keys(entriesByDate).sort(function(a, b) {
            return new Date(b) - new Date(a);
        });

        function formatDate(dateStr) {
            const dateObj = new Date(dateStr);
            return dateObj.toLocaleDateString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
            });
        }

        // Build the summary cards
        sortedDates.forEach(function(dateStr) {
            const card = document.createElement('div');
            card.className = 'history-summary-card';

            const count = entriesByDate[dateStr].length;

            card.innerHTML = `
                <div class="summary-info">
                    <div class="summary-date">${formatDate(dateStr)}</div>
                    <div class="summary-count">${count} ${count === 1 ? 'exercise' : 'exercises'}</div>
                </div>
                <button class="see-more-btn" data-date="${dateStr}">See More</button>
            `;

            historyList.appendChild(card);
        });

        // Build the filter dropdown options
        if (dateFilter) {
            sortedDates.forEach(function(dateStr) {
                const option = document.createElement('option');
                option.value = dateStr;
                option.textContent = formatDate(dateStr);
                dateFilter.appendChild(option);
            });

            dateFilter.addEventListener('change', function() {
                if (dateFilter.value) {
                    openHistoryModal(dateFilter.value, formatDate(dateFilter.value), entriesByDate[dateFilter.value]);
                }
            });
        }

        // "See More" buttons (event delegation, same pattern as before)
        historyList.addEventListener('click', function(event) {
            if (event.target.classList.contains('see-more-btn')) {
                const dateStr = event.target.getAttribute('data-date');
                openHistoryModal(dateStr, formatDate(dateStr), entriesByDate[dateStr]);
            }
        });
    }
}

function openHistoryModal(dateKey, dateLabel, entries) {
    const modal = document.getElementById('day-modal');
    const title = document.getElementById('modal-day-title');
    const list = document.getElementById('modal-exercise-list');

    title.textContent = dateLabel;
    list.innerHTML = '';

    entries.forEach(function(entry) {
        const li = document.createElement('li');
        li.innerHTML = '<strong>' + entry.muscle + '</strong> — ' + entry.exercise;
        list.appendChild(li);
    });

    modal.classList.add('open');
}

const historyModalCloseBtn = document.getElementById('modal-close-btn');
const historyModalOverlay = document.getElementById('day-modal');

if (historyModalCloseBtn && historyModalOverlay && historyList) {
    historyModalCloseBtn.addEventListener('click', function() {
        historyModalOverlay.classList.remove('open');
    });

    historyModalOverlay.addEventListener('click', function(event) {
        if (event.target === historyModalOverlay) {
            historyModalOverlay.classList.remove('open');
        }
    });
}