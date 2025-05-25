import uuid
from flask import Flask, render_template, session
from routes.image_routes import image_bp
from routes.preprocess_story_routes import story_bp
from routes.game_routes import game_bp

app = Flask(__name__)
app.register_blueprint(image_bp)
app.register_blueprint(story_bp)
app.register_blueprint(game_bp)

app.secret_key = 'non secret key'

@app.before_request
def ensure_session_id():
    if 'session_id' not in session:
        session['session_id'] = str(uuid.uuid4())

@app.route('/')
def home():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
