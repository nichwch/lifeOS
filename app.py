from flask import Flask, request
from flask_cors import CORS
import json
import os
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


if __name__ == '__main__':
    app.run(debug=True)
