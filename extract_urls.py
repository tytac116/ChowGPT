import json
import math

def extract_restaurant_urls(input_file, output_prefix="urls_batch", max_urls_per_file=150):
    """
    Extract URLs from restaurants.json and split them into multiple files with max URLs per file
    """
    try:
        # Read the restaurants.json file
        with open(input_file, 'r', encoding='utf-8') as file:
            restaurants_data = json.load(file)
        
        # Extract URLs and format them
        url_list = []
        for restaurant in restaurants_data:
            if 'url' in restaurant and restaurant['url']:
                url_entry = {
                    "url": restaurant['url'],
                    "method": "GET"
                }
                url_list.append(url_entry)
        
        # Calculate number of files needed
        total_urls = len(url_list)
        num_files = math.ceil(total_urls / max_urls_per_file)
        
        print(f"Successfully extracted {total_urls} URLs from {input_file}")
        print(f"Splitting into {num_files} files with max {max_urls_per_file} URLs each")
        
        # Split URLs into chunks and save to separate files
        for i in range(num_files):
            start_idx = i * max_urls_per_file
            end_idx = min((i + 1) * max_urls_per_file, total_urls)
            chunk = url_list[start_idx:end_idx]
            
            # Create filename for this chunk
            output_file = f"{output_prefix}_{i+1}.json"
            
            # Write the chunk to file
            with open(output_file, 'w', encoding='utf-8') as file:
                json.dump(chunk, file, indent=4)
            
            print(f"Saved {len(chunk)} URLs to {output_file} (URLs {start_idx+1}-{end_idx})")
        
        # Show preview of first file
        if url_list:
            print(f"\nFirst 3 entries from {output_prefix}_1.json:")
            for i, entry in enumerate(url_list[:3]):
                print(f"{i+1}. {entry}")
            
    except FileNotFoundError:
        print(f"Error: Could not find {input_file}")
    except json.JSONDecodeError:
        print(f"Error: Invalid JSON format in {input_file}")
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    # Extract URLs from restaurants.json and split into files with max 150 URLs each
    extract_restaurant_urls("restaurants.json", "urls_batch", 150) 