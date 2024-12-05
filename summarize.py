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
        model='gpt-4',
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
                        'questions':{
                            "type":"string",
                            "description":"Some questions to prompt the author to journal further."
                        },
                        'answers':{
                            "type":"string",
                            "description":"Give advice and some answers to open questions in the author's life."
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


def get_unsummarized_weeks(directory, output_file):
    expanded_dir = os.path.expanduser(directory)
    all_weeks = group_files_by_week(expanded_dir)
    
    try:
        with open(output_file, 'r') as f:
            summaries = json.load(f)
        # Create a dict mapping weeks to their files from existing summaries
        existing_weeks = {summary['week']: set(summary.get('files', [])) for summary in summaries}
        # Check both if week is new or if files have changed
        unsummarized_weeks = {
            week: files 
            for week, files in all_weeks.items() 
            if week not in existing_weeks or len(files) != len(existing_weeks[week])
        }
    except FileNotFoundError:
        unsummarized_weeks = all_weeks
    
    return unsummarized_weeks

def summarize_new_notes(directory):
    expanded_dir = os.path.expanduser(directory)
    output_file = os.path.join(os.path.dirname(__file__), f'{expanded_dir}/weekly_summaries.json')
    
    unsummarized_weeks = get_unsummarized_weeks(expanded_dir, output_file)
    
    if not unsummarized_weeks:
        print("No new weeks to summarize.")
        return
    
    try:
        with open(output_file, 'r') as f:
            summaries = json.load(f)
        context = summaries[-1]['summary']['context'] if summaries else ''
    except FileNotFoundError:
        summaries = []
        context = ''
    
    sorted_weeks = sorted(unsummarized_weeks.items(), key=lambda x: datetime.strptime(x[0], "%Y-%m-%d"))
    
    for week, files in sorted_weeks:
        timestamp = datetime.strptime(week, "%Y-%m-%d").timestamp()
        all_text_in_week = ''
        print('processing week', week)
        for file in files:
            with open(os.path.join(expanded_dir, file), 'r') as f:
                all_text_in_week += f'#### {file}\n\n' + f.read()
        
        weekly_summary = summarize_weekly_notes(all_text_in_week, context)
        context = weekly_summary['context']
        # Check if a summary for this week already exists
        existing_summary_index = next((i for i, s in enumerate(summaries) if s['week'] == week), None)
        new_entry = {
            'week': week,
            'timestamp': timestamp,
            'summary': weekly_summary,
            'files': files
        }
        if existing_summary_index is not None:
            # Update existing summary
            summaries[existing_summary_index] = new_entry
        else:
            # Append new summary
            summaries.append(new_entry)
                
        # Write to the output file after each summary is generated
        summaries.sort(key=lambda x: x['timestamp'])
        with open(output_file, 'w') as f:
            json.dump(summaries, f, indent=4)
        print(f'Updated summary for week {week} written to {output_file}')
    
    print(f'All summaries written to {output_file}')

if __name__ == "__main__":
    summarize_new_notes('~/notes')
