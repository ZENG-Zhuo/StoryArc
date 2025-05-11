import os
import json
import shutil
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


@game_bp.route('/save_named_game', methods=['POST'])
def save_named_game():
    content = request.get_json()
    name = content.get('name')
    if not name:
        return jsonify({'error': 'Missing name'}), 400

    session_id = session.get('session_id')
    if not session_id:
        return jsonify({'error': 'Missing session'}), 400

    src_filename = f'game_data_{session_id}.json'
    dest_filename = f'{name}.json'

    src_path = os.path.join(current_app.static_folder, 'json', src_filename)
    saved_folder = os.path.join(current_app.static_folder, 'json', 'Saved')
    os.makedirs(saved_folder, exist_ok=True)
    dest_path = os.path.join(saved_folder, dest_filename)

    if not os.path.exists(src_path):
        return jsonify({'error': 'No game data to save'}), 404

    try:
        shutil.copyfile(src_path, dest_path)
        return jsonify({'status': 'success', 'filename': dest_filename})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@game_bp.route('/load_named_game', methods=['POST'])
def load_named_game():
    data = request.get_json()
    if not data or 'filename' not in data:
        return jsonify({'error': 'Missing filename'}), 400

    filename = data['filename']
    session_id = session.get('session_id')
    if not session_id:
        return jsonify({'error': 'Missing session'}), 400

    saved_path = os.path.join(current_app.static_folder, 'json', 'Saved', filename)
    dest_path = os.path.join(current_app.static_folder, 'json', f'game_data_{session_id}.json')

    if not os.path.exists(saved_path):
        return jsonify({'error': 'File not found'}), 404

    try:
        shutil.copyfile(saved_path, dest_path)

        with open(dest_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500



@game_bp.route('/list_saved_games', methods=['GET'])
def list_saved_games():
    saved_folder = os.path.join(current_app.static_folder, 'json', 'Saved')
    try:
        files = os.listdir(saved_folder)
        saves = [f for f in files if f.endswith('.json')]
        return jsonify(saves)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
