from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
import os

app = Flask(__name__)
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'gymflow.db')
db = SQLAlchemy(app)


class Workout(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.String(20), nullable=False)
    muscle = db.Column(db.String(50), nullable=False)
    exercise = db.Column(db.String(200), nullable=False)
    duration = db.Column(db.Integer)
    notes = db.Column(db.String(500))

    def to_dict(self):
        return {
            'id': self.id,
            'date': self.date,
            'muscle': self.muscle,
            'exercise': self.exercise,
            'duration': self.duration,
            'notes': self.notes
        }


@app.route('/')
def home():
    return 'GymFlow backend is running!'


@app.route('/workouts', methods=['GET'])
def get_workouts():
    all_workouts = Workout.query.all()
    return jsonify([w.to_dict() for w in all_workouts])


@app.route('/workouts', methods=['POST'])
def add_workout():
    data = request.get_json()

    new_workout = Workout(
        date=data['date'],
        muscle=data['muscle'],
        exercise=data['exercise'],
        duration=data.get('duration'),
        notes=data.get('notes')
    )

    db.session.add(new_workout)
    db.session.commit()

    return jsonify(new_workout.to_dict()), 201


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5001)