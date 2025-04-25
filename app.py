from flask import Flask, render_template
from routes.image_routes import image_bp

app = Flask(__name__)
app.register_blueprint(image_bp)

@app.route('/')
def home():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)
