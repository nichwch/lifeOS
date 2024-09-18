import os
from datetime import datetime, timedelta
from collections import defaultdict
import anthropic
import concurrent.futures

# Initialize the Anthropic client
print(os.environ.get("ANTHROPIC_API_KEY"))
client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))


def group_files_by_week(directory):
    files_by_week = defaultdict(list)
    
    for filename in os.listdir(directory):
        try:
            # Parse the date from the filename
            file_date = datetime.strptime(filename, "%a %b %d %Y")
            
            # Calculate the start of the week (Monday)
            start_of_week = file_date - timedelta(days=file_date.weekday())
            
            # Use the start of the week as the key
            week_key = start_of_week.strftime("%Y-%m-%d")
            
            # Add the filename to the appropriate week
            files_by_week[week_key].append(filename)
        except ValueError:
            # Skip files that don't match the expected date format
            continue
    
    return dict(files_by_week)

# Example usage:
# directory = "path/to/your/directory"
# grouped_files = group_files_by_week(directory)
# for week, files in grouped_files.items():
#     print(f"Week of {week}:")
#     for file in files:
#         print(f"  {file}")

