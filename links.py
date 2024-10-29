import requests
import json

def test_get_links():
    # URL of your Flask application
    url = "http://127.0.0.1:5000/get_links"

    # Sample text to send in the request
    sample_text = "Python programming best practices"

    # Prepare the request payload
    payload = {
        "text": sample_text
    }

    # Send POST request to the /get_links endpoint
    response = requests.post(url, json=payload)

    # Check if the request was successful
    if response.status_code == 200:
        # Parse the JSON response
        data = response.json()
        
        print("Links retrieved successfully:")
        for link in data.get("links", []):
            print(f"Title: {link['title']}")
            print(f"URL: {link['url']}")
            print("---")
    else:
        print(f"Error: {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    test_get_links()
