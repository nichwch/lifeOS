import json
import os
from datetime import datetime, timedelta
from collections import defaultdict
import openai
import time

def group_files_by_week(directory):
    files_by_week = defaultdict(list)
    for filename in os.listdir(directory):
        if os.path.isfile(os.path.join(directory, filename)):
            try:
                # Try parsing the date from the filename with and without day of the week
                try:
                    file_date = datetime.strptime(filename.split('.')[0], "%a %b %d %Y")
                except ValueError:
                    try:
                        file_date = datetime.strptime(filename.split('.')[0], "%b %d %Y")
                    except ValueError:
                        raise ValueError(f"Unable to parse date from filename: {filename}")
                
                # Calculate the start of the week (Monday)
                start_of_week = file_date - timedelta(days=file_date.weekday())
                # Use the start of the week as the key
                week_key = start_of_week.strftime("%Y-%m-%d")
                # Add the filename to the appropriate week
                files_by_week[week_key].append(filename)
            except ValueError as e:
                print(f'Error processing file {filename}: {str(e)}')
                # Skip files that don't match the expected date format
                continue
    return dict(files_by_week)


def summarize_weekly_notes(all_text_in_week, context):
    print('summarizing')
    response = openai.chat.completions.create(
        model='gpt-4o',
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": f"""Please summarize the following weekly notes, given the following context. 
Write everything in the second person, in the past tense - e.g. "This week, you were focused on fixing your sleep."
You can ignore TODOs and other transient content - try and focus on the big picture. Here is some helpful context about the author's life right now:

{context}

Here are the weekly notes:

{all_text_in_week}"""}
        ],
        functions=[
            {
                "name": "generate_summary",
                "description": "Generate a structured summary of the weekly notes. Include an updated context if the author's life has changed since the last summary.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "overall_summary": {
                            "type": "string",
                            "description": "A brief overall summary of the week's notes, in the second person past tense."
                        },
                        "ideas":{
                            "type":"string",
                            "description":"A summary of ideas or thoughts that the author wants to explore. Leave blank if there aren't ideas, in the second person past tense."
                        },
                        "dreams":{
                            "type":"string",
                            "description":"A summary of dreams that the author has recorded from sleeping. Leave blank if there aren't dreams, in the second person past tense."
                        },
                        "life":{
                            "type":"string",
                            "description":"A summary of life events that the author wants to remember. Leave blank if there aren't life events, in the second person past tense."
                        },
                        "gratitude":{
                            "type":"string",
                            "description":"A summary of things that the author is grateful for. Leave blank if there aren't things to be grateful for, in the second person past tense."
                        },
                        "complaints":{
                            "type":"string",
                            "description":"A summary of complaints that the author has. Leave blank if there aren't complaints, in the second person past tense."
                        },
                        "context":{
                            "type":"string",
                                "description":"""A new summary of the author's overall life, based on the context given in the prompt. 
                            Begin with the old context given in the prompt, and ONLY change it if the author's life has changed significantly. 
                            Remove information if it's no longer relevant, or add information if something significant has happened in the author's life. 
                            If the summary begins to get too long (say, longer than 7 sentences), summarize it down, or remove information that's no longer relevant."""
                        }
                    },
                    "required": ["key_points", "main_themes", "overall_summary"]
                }
            }
        ],
        function_call={"name": "generate_summary"},
        temperature=0.5
    )
    print('summarized')
    # Extract the summary from the response
    function_response = json.loads(response.choices[0].message.function_call.arguments)
    return function_response


def summarize_weekly_notes_in_dir(dir):
    # Set your OpenAI API key
    dir = os.path.expanduser(dir)
    openai.api_key = os.getenv("OPENAI_API_KEY")

    expanded_dir = os.path.expanduser(dir)
    weeks = group_files_by_week(expanded_dir)

    summaries = []

    sorted_weeks = sorted(weeks.items(), key=lambda x: datetime.strptime(x[0], "%Y-%m-%d"), reverse=False)
    
    context = ''
    for week, files in sorted_weeks:
        timestamp = datetime.strptime(week, "%Y-%m-%d").timestamp()
        all_text_in_week = ''
        print('processing week', week)
        for file in files:
            with open(os.path.join(expanded_dir, file), 'r') as f:
                all_text_in_week += f'#### {file}\n\n' + f.read()
        
        weekly_summary = summarize_weekly_notes(all_text_in_week, context)
        context = weekly_summary['context']
        print('context', context)
        summaries.append({
            'week': week,
            'timestamp': timestamp,
            'summary': weekly_summary  
        })
    
    print(summaries)
    output_file = os.path.join(os.path.dirname(__file__), f'{dir}/weekly_summaries.json')
    with open(output_file, 'w') as f:
        json.dump(summaries, f, indent=4)
    print(f'Summaries written to {output_file}')

if __name__ == "__main__":
    summarize_weekly_notes_in_dir('~/work-notes')
