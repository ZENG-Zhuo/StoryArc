from flask import Blueprint, request, jsonify
import json
import re

# Import your story generation service
from world_generator.llm_client import GPTClient

# Initialize Blueprint
story_bp = Blueprint('story_bp', __name__)

# Initialize service
story_generator = GPTClient()

@story_bp.route('/preprocess_story', methods=['POST'])
def preprocess_story():
    data = request.json
    story_description = data.get('storyDescription', '')
    story_arc = data.get('storyArc', '')
    num_endings = data.get('numEndings', 1)

    if not story_description or not story_arc:
        return jsonify({"error": "Missing story description or story arc"}), 400

    raw_result = story_generator.dummy_gen_story_node(story_description, story_arc, num_endings)
    
    # Clean the ```json wrapping
    cleaned_json_string = re.sub(r"```json|```", "", raw_result).strip()
    try:
        result = json.loads(cleaned_json_string)
    except json.JSONDecodeError:
        return jsonify({"error": "Failed to decode story data"}), 500

    return jsonify(result)
