import base64
from io import BytesIO
from flask import Flask, render_template, jsonify, request
from SDAPIs import generate_pixel_image  

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/generate_image', methods=['POST'])
def generate_image():
    data = request.json
    prompt = data.get('prompt', '')

    # Call the image generation function
    images, error = generate_pixel_image(prompt)

    if error:
        return jsonify({'error': error}), 400
    
    if images and len(images) > 0:
        # Convert the first image to base64
        buffered = BytesIO()
        images[0].save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode('utf-8')
        return jsonify({'imageUrl': f"data:image/png;base64,{img_str}"})
    
    return jsonify({'error': "No images found."}), 404

if __name__ == '__main__':
    app.run(debug=True)