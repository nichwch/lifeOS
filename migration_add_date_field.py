import json
import os
from summarize import group_files_by_week

def add_missing_files_field():
    # Get the path to weekly_summaries.json
    notes_dir = os.path.expanduser('~/notes')
    summaries_path = os.path.join(notes_dir, 'weekly_summaries.json')
    
    # Load existing summaries
    with open(summaries_path, 'r') as f:
        summaries = json.load(f)
    
    # Get files by week using existing function
    files_by_week = group_files_by_week(notes_dir)
    
    # Update each summary with its files field if missing
    for summary in summaries:
        week = summary['week']
        if 'files' not in summary and week in files_by_week:
            summary['files'] = files_by_week[week]
    
    # Write updated summaries back to file
    with open(summaries_path, 'w') as f:
        json.dump(summaries, f, indent=4)

if __name__ == "__main__":
    add_missing_files_field()
