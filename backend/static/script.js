

// ---- LOGIN PAGE ----

function handleGoogleSignIn(response) {
    const idToken = response.credential;

    fetch('/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_token: idToken })
    })
    .then(function(res) {
        if (!res.ok) {
            throw new Error('Login failed');
        }
        return res.json();
    })
    .then(function(data) {
        localStorage.setItem('gymflow_user', JSON.stringify(data));
        window.location.href = 'dashboard.html';
    })
    .catch(function(error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
    });
}

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

        const storedUser = JSON.parse(localStorage.getItem('gymflow_user'));
        const savePromises = [];

        rows.forEach(function(row) {
            let muscle = row.querySelector('.muscle-select').value;
            const exercise = row.querySelector('.exercise-input').value;

            if (muscle === 'Others') {
                const customValue = row.querySelector('.custom-muscle-input').value;
                muscle = customValue || 'Others';
            }
const workoutData = {
    user_id: storedUser.id,
    date: date,
    muscle: muscle,
    exercise: exercise,
    duration: duration,
    notes: notes
};

           const savePromise = fetch('/workouts', {
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

// ---- DASHBOARD PAGE ----

const progressGrid = document.querySelector('.progress-grid');

if (progressGrid) {
    const storedUser = JSON.parse(localStorage.getItem('gymflow_user'));
    const userId = storedUser ? storedUser.id : null;

    if (!userId) {
        window.location.href = 'index.html';
    } else {
        fetch('/workouts?user_id=' + userId)
            .then(function(response) {
            if (!response.ok) {
                throw new Error('Server responded with status ' + response.status);
            }
            return response.json();
        })
        .then(function(workouts) {
            renderDashboard(workouts);
        })
       .catch(function(error) {
            console.error('Error loading workouts:', error);
        });
    }
}

function renderDashboard(workouts) {
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
          entriesByDay[dayOfWeek].push({ id: workout.id, muscle: workout.muscle, exercise: workout.exercise });
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
    const storedUser = JSON.parse(localStorage.getItem('gymflow_user'));
    const userId = storedUser ? storedUser.id : null;

    if (!userId) {
        window.location.href = 'index.html';
    } else {
        fetch('/workouts?user_id=' + userId)
            .then(function(response) {
                if (!response.ok) {
                    throw new Error('Server responded with status ' + response.status);
                }
                return response.json();
            })
            .then(function(workouts) {
                renderHistory(workouts);
            })
            .catch(function(error) {
                console.error('Error loading history:', error);
            });
    }
}

function renderHistory(workouts) {
    if (workouts.length === 0) {
        historyList.innerHTML = '<p class="history-empty">No workouts logged yet. Go log your first one!</p>';
        return;
    }

    const entriesByDate = {};

    workouts.forEach(function(workout) {
        if (!entriesByDate[workout.date]) {
            entriesByDate[workout.date] = [];
        }
       entriesByDate[workout.date].push({ id: workout.id, muscle: workout.muscle, exercise: workout.exercise });
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

    historyList.addEventListener('click', function(event) {
        if (event.target.classList.contains('see-more-btn')) {
            const dateStr = event.target.getAttribute('data-date');
            openHistoryModal(dateStr, formatDate(dateStr), entriesByDate[dateStr]);
        }
    });
}
// ---- HISTORY MODAL LOGIC ----

function openHistoryModal(dateKey, dateLabel, entries) {
    const modal = document.getElementById('day-modal');
    const title = document.getElementById('modal-day-title');
    const list = document.getElementById('modal-exercise-list');

    title.textContent = dateLabel;
    list.innerHTML = '';

    entries.forEach(function(entry) {
        const li = document.createElement('li');
        li.innerHTML = '<strong>' + entry.muscle + '</strong> — ' + entry.exercise +
            ' <button class="delete-entry-btn" data-id="' + entry.id + '">Delete</button>';
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
// ---- DELETE WORKOUT ENTRY ----

const modalExerciseList = document.getElementById('modal-exercise-list');

if (modalExerciseList) {
    modalExerciseList.addEventListener('click', function(event) {
        if (event.target.classList.contains('delete-entry-btn')) {
            const entryId = event.target.getAttribute('data-id');

            if (confirm('Delete this exercise entry?')) {
                fetch('/workouts/' + entryId, {
                    method: 'DELETE'
                })
                .then(function(response) {
                    if (!response.ok) {
                        throw new Error('Failed to delete');
                    }
                    event.target.closest('li').remove();
                })
                .catch(function(error) {
                    console.error('Error deleting workout:', error);
                    alert('Could not delete. Please try again.');
                });
            }
        }
    });
}
// ---- RELOAD ALL DATA ----

function reloadAllData() {
    if (progressGrid) {
        fetch('/workouts')
            .then(function(response) { return response.json(); })
            .then(function(workouts) { renderDashboard(workouts); });
    }

    if (historyList) {
        historyList.innerHTML = '';
        if (dateFilter) {
            dateFilter.innerHTML = '<option value="">All dates</option>';
        }
       fetch('/workouts')
            .then(function(response) { return response.json(); })
            .then(function(workouts) { renderHistory(workouts); });
    }
}
