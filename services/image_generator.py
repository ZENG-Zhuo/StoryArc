import base64
from io import BytesIO

from flask import jsonify
from SDAPIs import generate_pixel_image

def generate_image_response(prompt):
    images, error = generate_pixel_image(prompt)

    if error:
        return jsonify({'error': error}), 400

    if images and len(images) > 0:
        buffered = BytesIO()
        images[0].save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode('utf-8')
        return jsonify({'imageUrl': f"data:image/png;base64,{img_str}"})

    return jsonify({'error': "No images found."}), 404
