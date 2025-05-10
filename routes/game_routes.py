import os
import json
from flask import Blueprint, request, jsonify, current_app, send_from_directory, session

game_bp = Blueprint('game_bp', __name__)

@game_bp.route('/save_generated_json', methods=['POST'])
def save_generated_json():
    data = request.get_json()

    if not data:
        return jsonify({'error': 'No JSON received'}), 400

    # Generate a unique filename with timestamp
    filename = f'game_data_{session['session_id']}.json'
    folder_path = os.path.join(current_app.static_folder, 'json')
    os.makedirs(folder_path, exist_ok=True)
    file_path = os.path.join(folder_path, filename)

    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)

        return jsonify({
            'status': 'success',
            'fileUrl': f'json/{filename}'
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
    
@game_bp.route('/get_generated_json', methods=['GET'])
def get_generated_json():
    if 'session_id' not in session:
        return jsonify({'error': 'No session ID found'}), 400

    filename = f'game_data_{session["session_id"]}.json'
    folder_path = os.path.join(current_app.static_folder, 'json')

    file_path = os.path.join(folder_path, filename)
    if not os.path.exists(file_path):
        print("JSON not found for session: " + session["session_id"])
        
        # hacking here need to remove this in real production:
        filename = f'game_data_example.json'
        folder_path = os.path.join(current_app.static_folder, 'json')

        file_path = os.path.join(folder_path, filename)
        
        return send_from_directory(folder_path, filename)
        
        return jsonify({'error': 'Generated JSON file not found for this session'}), 404

    return send_from_directory(folder_path, filename)
