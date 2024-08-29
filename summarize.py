import os
from datetime import datetime
from collections import defaultdict
import anthropic
import concurrent.futures

# Initialize the Anthropic client
client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

def summarize_text(text):
    prompt = f"\n\nHuman: Please summarize the following text:\n\n{text}\n\nAssistant: Here's a summary of the text:"
    
    response = client.completions.create(
        prompt=prompt,
        model="claude-2.1",
        max_tokens_to_sample=300,
        temperature=0.7,
    )
    
    summary = response.completion.strip()
    print(f"Generated summary: {summary[:50]}...")  # Print first 50 characters of the summary
    return summary

def process_file(filename, input_dir):
    print(f"Processing file: {filename}")
    date = datetime.strptime(filename.split('.')[0], '%a %b %d %Y')
    year_month = date.strftime('%Y-%m')
    week = date.strftime('%Y-W%W')
    
    with open(os.path.join(input_dir, filename), 'r') as f:
        content = f.read()
    
    print(f"Generating summary for {filename}")
    summary = summarize_text(content)
    return year_month, week, date, summary

def process_notes(input_dir, output_dir):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    notes = defaultdict(lambda: defaultdict(list))
    
    files = [f for f in os.listdir(input_dir) if f.endswith('.txt')]
    
    with concurrent.futures.ThreadPoolExecutor() as executor:
        future_to_file = {executor.submit(process_file, filename, input_dir): filename for filename in files}
        for future in concurrent.futures.as_completed(future_to_file):
            year_month, week, date, summary = future.result()
            notes[year_month][week].append((date, summary))
    
    for year_month, weeks in notes.items():
        print(f"Processing month: {year_month}")
        month_summaries = []
        
        for week, day_summaries in weeks.items():
            print(f"Generating summary for week: {week}")
            week_summary = summarize_text(' '.join([summary for _, summary in day_summaries]))
            month_summaries.append(week_summary)
            
            # Write weekly summary
            output_file = os.path.join(output_dir, f'{week}_summary.txt')
            print(f"Writing weekly summary to: {output_file}")
            with open(output_file, 'w') as f:
                f.write(f"Week Summary: {week}\n\n")
                f.write(week_summary)
                f.write("\n\nDaily Summaries:\n")
                for date, summary in sorted(day_summaries):
                    f.write(f"\n{date.strftime('%Y-%m-%d')}:\n{summary}\n")
        
        # Write monthly summary
        print(f"Generating summary for month: {year_month}")
        month_summary = summarize_text(' '.join(month_summaries))
        output_file = os.path.join(output_dir, f'{year_month}_summary.txt')
        print(f"Writing monthly summary to: {output_file}")
        with open(output_file, 'w') as f:
            f.write(f"Month Summary: {year_month}\n\n")
            f.write(month_summary)
            f.write("\n\nWeekly Summaries:\n")
            for week in sorted(weeks.keys()):
                week_summary = summarize_text(' '.join([summary for _, summary in weeks[week]]))
                f.write(f"\n{week}:\n{week_summary}\n")

if __name__ == "__main__":
    input_directory = os.path.expanduser("~/notes")
    output_directory = os.path.expanduser("~/summaries")
    print(f"Input directory: {input_directory}")
    print(f"Output directory: {output_directory}")
    process_notes(input_directory, output_directory)
