from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os

import requests
from advice import get_philosophical_advice
import summarize

app = Flask(__name__)
CORS(app)  # This will enable CORS for all routes

@app.route("/weekly_summaries")
def weekly_summaries():
    # Get the directory from query parameters
    directory = request.args.get('directory', '~/notes')  # Default to '~/notes' if not provided
    # Construct the path to weekly_summaries.json
    json_file_path = os.path.join(os.path.expanduser(directory), 'weekly_summaries.json')
    # Read and return the contents of the JSON file
    with open(json_file_path, 'r') as file:
        weekly_summaries = json.load(file)
    return json.dumps(weekly_summaries, indent=4)

@app.route('/summarize', methods=['POST'])
@app.route('/summarize/<path:directory>', methods=['POST'])
def summarize_notes():
    directory = request.args.get('directory', '~/notes')  # Default to '~/notes' if not provided
    summarize.summarize_new_notes(directory)
    return "Summarization complete", 200



@app.route('/unsummarized_count')
def unsummarized_count():
    directory = request.args.get('directory', '~/notes')  # Default to '~/notes' if not provided
    expanded_dir = os.path.expanduser(directory)
    json_file_path = os.path.join(expanded_dir, 'weekly_summaries.json')
    
    unsummarized_weeks = summarize.get_unsummarized_weeks(directory, json_file_path)
    
    total_unsummarized_notes = sum(len(files) for files in unsummarized_weeks.values())
    
    return jsonify({
        'unsummarized_count': total_unsummarized_notes,
        'unsummarized_weeks': len(unsummarized_weeks)
    })

@app.route('/get_links', methods=['POST'])
def get_links():
    # Get the text from the request body
    data = request.json
    text = data.get('text')
    
    if not text:
        return jsonify({"error": "No text provided"}), 400

    try:
        # Make a request to Exa's API
        exa_api_key = os.environ.get('EXA_API_KEY')
        if not exa_api_key:
            return jsonify({"error": "EXA_API_KEY not set in environment variables"}), 500

        headers = {
            "Content-Type": "application/json",
            "x-api-key": exa_api_key
        }
        
        payload = {
            "query": text,
            "num_results": 5,  # Adjust as needed
            "use_autoprompt": True
        }
        
        response = requests.post("https://api.exa.ai/search", headers=headers, json=payload)
        response.raise_for_status()
        
        # Extract relevant links from the response
        results = response.json().get('results', [])
        links = [{"title": result.get('title'), "url": result.get('url')} for result in results]
        
        return jsonify({"links": links})
    
    except requests.RequestException as e:
        return jsonify({"error": f"Error fetching links: {str(e)}"}), 500

@app.route('/chat', methods=['POST'])
def chat():
    # Get OpenAI API key from environment variables
    openai_api_key = os.environ.get('OPENAI_API_KEY')
    if not openai_api_key:
        return jsonify({"error": "OPENAI_API_KEY not set in environment variables"}), 500

    # Get the request data
    data = request.json
    messages = data.get('messages')
    
    if not messages:
        return jsonify({"error": "No messages provided"}), 400

    try:
        # Make request to OpenAI API
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {openai_api_key}"
        }
        
        payload = {
            "model": "gpt-4",  # or "gpt-4" depending on your needs
            "messages": messages
        }
        
        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers,
            json=payload
        )
        response.raise_for_status()
        
        # Return the response from OpenAI
        return jsonify(response.json())
    
    except requests.RequestException as e:
        return jsonify({"error": f"Error calling OpenAI API: {str(e)}"}), 500

@app.route('/read_file', methods=['GET'])
def read_file():
    # Get the file path from query parameters
    file_path = request.args.get('path')
    if not file_path:
        return jsonify({"error": "No file path provided"}), 400

    # Expand user path if necessary (e.g., ~/documents)
    file_path = os.path.expanduser(file_path)

    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
        return jsonify({"content": content})
    except FileNotFoundError:
        return jsonify({"error": f"File not found: {file_path}"}), 404
    except Exception as e:
        return jsonify({"error": f"Error reading file: {str(e)}"}), 500

@app.route('/write_file', methods=['POST'])
def write_file():
    data = request.json
    file_path = data.get('path')
    content = data.get('content')

    if not file_path or content is None:
        return jsonify({"error": "Both file path and content are required"}), 400

    # Expand user path if necessary
    file_path = os.path.expanduser(file_path)

    try:
        # Create directories if they don't exist
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        with open(file_path, 'w', encoding='utf-8') as file:
            file.write(content)
        return jsonify({"message": f"Successfully wrote to {file_path}"})
    except Exception as e:
        return jsonify({"error": f"Error writing file: {str(e)}"}), 500

@app.route('/generate_advice', methods=['POST'])
def generate_advice():
    data = request.json
    philosophers = data.get('philosophers', [])
    directory = os.path.expanduser(data.get('directory', '~/notes'))

    if not philosophers:
        return jsonify({"error": "No philosophers provided"}), 400

    try:
        advice_list = []
        for philosopher in philosophers:
            advice = json.loads(get_philosophical_advice(directory, philosopher))
            advice['philosopher'] = philosopher
            advice_list.append(advice)

        # Write to advice.json in the specified directory
        advice_path = os.path.join(directory, 'advice.json')
        with open(advice_path, 'w') as f:
            json.dump(advice_list, f, indent=4)

        return jsonify(advice_list)
    except Exception as e:
        return jsonify({"error": f"Error getting philosophical advice: {str(e)}"}), 500

@app.route('/get_advice', methods=['GET'])
def get_saved_advice():
    directory = os.path.expanduser(request.args.get('directory', '~/notes'))
    advice_path = os.path.join(directory, 'advice.json')
    
    try:
        with open(advice_path, 'r') as f:
            advice_list = json.load(f)
        return jsonify(advice_list)
    except FileNotFoundError:
        return jsonify({"error": "No advice file found"}), 404
    except Exception as e:
        return jsonify({"error": f"Error reading advice file: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True)

