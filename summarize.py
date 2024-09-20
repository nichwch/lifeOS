import json
import os
from datetime import datetime, timedelta
from collections import defaultdict
import litellm
from litellm import completion
import concurrent


def group_files_by_week(directory):
    files_by_week = defaultdict(list)
    for filename in os.listdir(directory):
        if os.path.isfile(os.path.join(directory, filename)):
            try:
                # Parse the date from the filename
                file_date = datetime.strptime(filename.split('.')[0], "%a %b %d %Y")
                # Calculate the start of the week (Monday)
                start_of_week = file_date - timedelta(days=file_date.weekday())
                # Use the start of the week as the key
                week_key = start_of_week.strftime("%Y-%m-%d")
                # Add the filename to the appropriate week
                files_by_week[week_key].append(filename)
            except ValueError:
                print('error', filename)
                # Skip files that don't match the expected date format
                continue
    
    return dict(files_by_week)


def summarize_weekly_notes(all_text_in_week, model="gpt-4o"):
    print('summarizing')
    response = completion(
        model=model,
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": f"Please summarize the following weekly notes:\n\n{all_text_in_week}"}
        ],
        max_tokens=1000,
        temperature=0.5
    )
    print('summarized')
    
    # Extract the summary from the response
    return response['choices'][0]['message']['content']


def main():
    expanded_dir = os.path.expanduser('~/notes')
    weeks = group_files_by_week(expanded_dir)

    summaries = []

    sorted_weeks = sorted(weeks.items(), key=lambda x: datetime.strptime(x[0], "%Y-%m-%d"), reverse=True)
    
    def process_week(week_data):
        week, files = week_data
        timestamp = datetime.strptime(week, "%Y-%m-%d").timestamp()
        all_text_in_week = ''
        print('processing week', week)
        for file in files:
            with open(os.path.join(expanded_dir, file), 'r') as f:
                all_text_in_week += f'#### {file}\n\n' + f.read()
        
        weekly_summary = summarize_weekly_notes(all_text_in_week)
        
        return {
            'week': week,
            'timestamp': timestamp,
            'summary': weekly_summary
        }
    
    with concurrent.futures.ThreadPoolExecutor() as executor:
        summaries = list(executor.map(process_week, sorted_weeks))
    
    print(summaries)
    output_file = os.path.join(os.path.dirname(__file__), 'weekly_summaries.json')
    with open(output_file, 'w') as f:
        json.dump(summaries, f, indent=4)
    print(f'Summaries written to {output_file}')

if __name__ == "__main__":
    main()
