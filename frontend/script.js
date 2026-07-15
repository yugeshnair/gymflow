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
            </select>
            <input type="text" class="exercise-input" name="exercise-${exerciseRowCount}" placeholder="e.g. Bench Press" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" required>
        `;
        exerciseList.appendChild(newRow);
    });
}

const logForm = document.querySelector('.log-form');

if (logForm) {
    logForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const entries = [];
        const rows = document.querySelectorAll('.exercise-row');

        rows.forEach(function(row) {
            const muscle = row.querySelector('.muscle-select').value;
            const exercise = row.querySelector('.exercise-input').value;
            entries.push({ muscle: muscle, exercise: exercise });
        });

        const workout = {
            date: document.getElementById('date').value,
            entries: entries,
            duration: document.getElementById('duration').value,
            notes: document.getElementById('notes').value
        };

        const existingWorkouts = JSON.parse(localStorage.getItem('workouts')) || [];
        existingWorkouts.push(workout);
        localStorage.setItem('workouts', JSON.stringify(existingWorkouts));

        alert('Workout saved!');
        window.location.href = 'dashboard.html';
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