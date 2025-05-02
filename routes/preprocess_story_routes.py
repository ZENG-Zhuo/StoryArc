from flask import Blueprint, request, jsonify
import json
import re

# Import your story generation service
from world_generator.llm_client import GPTClient
from world_generator.model.story_node import StoryStructure

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

    raw_result = story_generator.gen_story_node(story_description, story_arc, num_endings)
    
    # Clean the ```json wrapping
    cleaned_json_string = re.sub(r"```json|```", "", raw_result).strip()
    try:
        result = json.loads(cleaned_json_string)
    except json.JSONDecodeError:
        return jsonify({"error": "Failed to decode story data"}), 500

    return jsonify(result)


@story_bp.route('/generate_entities', methods=['POST'])
def generate_entities():
    data = request.json

    try:
        # Parse the whole JSON into one StoryStructure
        story_node = StoryStructure(**data)
    except Exception as e:
        return jsonify({"error": f"Invalid StoryStructure input: {str(e)}"}), 400

    try:
        enriched = story_generator.gen_entity(story_node)
        if enriched:
            return jsonify(enriched)
        else:
            return jsonify({"error": "Entity generation failed after retries"}), 500
    except Exception as e:
        return jsonify({"error": f"Internal error during generation: {str(e)}"}), 500