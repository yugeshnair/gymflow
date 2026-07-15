from flask import Flask, request, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
app = Flask(__name__)
CORS(app)
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'gymflow.db')
db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    google_id = db.Column(db.String(100), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email
        }
class Workout(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    date = db.Column(db.String(20), nullable=False)
    muscle = db.Column(db.String(50), nullable=False)
    exercise = db.Column(db.String(200), nullable=False)
    duration = db.Column(db.Integer)
    notes = db.Column(db.String(500))

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'date': self.date,
            'muscle': self.muscle,
            'exercise': self.exercise,
            'duration': self.duration,
            'notes': self.notes
        }
GOOGLE_CLIENT_ID = '479738025259-47qk8q4803b04806d2l0g86i6sd20mb9.apps.googleusercontent.com'


@app.route('/auth/google', methods=['POST'])
def google_auth():
    data = request.get_json()
    token = data.get('id_token')

    try:
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), GOOGLE_CLIENT_ID)
    except ValueError:
        return jsonify({'error': 'Invalid token'}), 401

    google_id = idinfo['sub']
    name = idinfo['name']
    email = idinfo['email']

    user = User.query.filter_by(google_id=google_id).first()

    if user is None:
        user = User(google_id=google_id, name=name, email=email)
        db.session.add(user)
        db.session.commit()

    return jsonify(user.to_dict()), 200

@app.route('/')
def login_page():
    return render_template('index.html')


@app.route('/dashboard.html')
def dashboard_page():
    return render_template('dashboard.html')


@app.route('/log-workout.html')
def log_workout_page():
    return render_template('log-workout.html')


@app.route('/history.html')
def history_page():
    return render_template('history.html')


@app.route('/workouts', methods=['GET'])
def get_workouts():
    all_workouts = Workout.query.all()
    return jsonify([w.to_dict() for w in all_workouts])


@app.route('/workouts', methods=['POST'])
def add_workout():
    data = request.get_json()

    new_workout = Workout(
        user_id=data['user_id'],
        date=data['date'],
        muscle=data['muscle'],
        exercise=data['exercise'],
        duration=data.get('duration'),
        notes=data.get('notes')
    )

    db.session.add(new_workout)
    db.session.commit()

    return jsonify(new_workout.to_dict()), 201

@app.route('/workouts/<int:workout_id>', methods=['DELETE'])
def delete_workout(workout_id):
    workout = Workout.query.get(workout_id)

    if workout is None:
        return jsonify({'error': 'Workout not found'}), 404

    db.session.delete(workout)
    db.session.commit()

    return jsonify({'message': 'Workout deleted'}), 200

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5001)