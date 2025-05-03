import base64
from io import BytesIO
import os
import uuid

from flask import current_app, jsonify
from SDAPIs import generate_pixel_image

def generate_image_response(prompt):
    images, error = generate_pixel_image(prompt)

    if error:
        return jsonify({'error': error}), 400

    if images and len(images) > 0:
        # Generate unique filename
        filename = f"{uuid.uuid4().hex}.png"
        save_path = os.path.join(current_app.static_folder, 'imgs', filename)
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        images[0].save(save_path, format="PNG")

        # Return only the relative URL path (frontend will prepend static prefix)
        return jsonify({'imageUrl': f"imgs/{filename}"})

    return jsonify({'error': "No images found."}), 404
