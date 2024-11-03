import json
import os
from datetime import datetime
from openai import OpenAI

def get_philosophical_advice(note_dir, identity="a wise philosopher"):
    # 1. Open and read weekly_summaries.json
    note_dir = os.path.expanduser(note_dir)
    json_path = os.path.join(note_dir, 'weekly_summaries.json')
    try:
        with open(json_path, 'r') as f:
            weekly_data = json.load(f)
    except FileNotFoundError:
        return "Error: Could not find weekly_summaries.json"

    # 2. Find the latest week
    if not weekly_data:
        return "Error: No weekly summaries found"
    
    # Convert list of entries to dictionary keyed by week
    weekly_dict = {entry['week']: entry['summary']['overall_summary'] 
                   for entry in weekly_data 
                   if 'week' in entry and 'summary' in entry and 'overall_summary' in entry['summary']}
    
    if not weekly_dict:
        return "Error: No valid weekly summaries found"
    
    latest_week = max(weekly_dict.keys(), key=lambda x: datetime.strptime(x, '%Y-%m-%d'))
    latest_summary = weekly_dict[latest_week]

    # 3. Generate philosophical advice using OpenAI
    client = OpenAI()
    
    prompt = f"""Given this person's weekly summary: "{latest_summary}", 
    provide structured advice as if you were {identity}. Focus on practical wisdom and ethical living."""

    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": f"You are {identity}. Provide advice in a structured format."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1000,
            temperature=0.7,
            functions=[{
                "name": "provide_structured_advice",
                "description": "Provide structured philosophical advice",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "overall_advice": {
                            "type": "string",
                            "description": "Concise overall advice for the situation"
                        },
                        "relevant_quotes": {
                            "type": "array",
                            "items": {
                                "type": "string"
                            },
                            "description": "2-3 quotes from the author that relate to the user's situation"
                        },
                        "praise": {
                            "type": "string",
                            "description": "Praise for the user from the author's perspective"
                        },
                        "criticism": {
                            "type": "string",
                            "description": "Constructive criticism from the author's perspective"
                        }
                    },
                    "required": ["overall_advice", "relevant_quotes", "praise", "criticism"]
                }
            }],
            function_call={"name": "provide_structured_advice"}
        )
        
        # 4. Return the structured advice
        return response.choices[0].message.function_call.arguments
    except Exception as e:
        return f"Error generating advice: {str(e)}"

# Example usage:
print(get_philosophical_advice('~/notes', "Milan Kundera"))
