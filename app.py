from flask import Flask

import summarize

app = Flask(__name__)

@app.route("/weekly_summaries")
def weekly_summaries():
    import json
    import os

    # Get the directory of the current script
    current_dir = os.path.dirname(os.path.abspath(__file__))
    # Construct the path to weekly_summaries.json
    json_file_path = os.path.join(current_dir, 'weekly_summaries.json')
    # Read and return the contents of the JSON file
    with open(json_file_path, 'r') as file:
        weekly_summaries = json.load(file)
    return json.dumps(weekly_summaries, indent=4)


@app.post('/summarize')
def summarize_notes():
    summarize.main()
