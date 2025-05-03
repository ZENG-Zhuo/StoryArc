from flask import Blueprint, request, jsonify
from services.image_generator import generate_image_response

image_bp = Blueprint('image_bp', __name__)

@image_bp.route('/generate_image', methods=['POST'])
def generate_image():
    data = request.json
    prompt = data.get('prompt', '')
    return generate_image_response(prompt)
