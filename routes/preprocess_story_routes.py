from flask import Blueprint, request, jsonify
import json
import re

# Import your story generation service
from world_generator.llm_client import GPTClient
from world_generator.model.entity import GameStructure
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

    try:
        # gen_story_node now returns a StoryStructure instance directly
        story_structure: StoryStructure = story_generator.gen_story_node(story_description, story_arc, num_endings)
        result = story_structure.to_dict()
    except Exception as e:
        return jsonify({"error": f"Failed to generate or process story data: {str(e)}"}), 500

    return jsonify(result)



@story_bp.route('/generate_entities', methods=['POST'])
def generate_entities():
    data = request.json
    print("Received data:", data)
    
    try:
        # Parse the input into a StoryStructure instance
        story_node = StoryStructure(**data)
    except Exception as e:
        return jsonify({"error": f"Invalid StoryStructure input: {str(e)}"}), 400

    try:
        # gen_entity now returns a GameStructure instance
        game_structure: GameStructure = story_generator.gen_entity_stepwise(story_node)

        # Convert to dictionary for JSON response
        result = game_structure.to_dict()

        return jsonify(result)
    except Exception as e:
        return jsonify({"error": f"Internal error during generation: {str(e)}"}), 500
