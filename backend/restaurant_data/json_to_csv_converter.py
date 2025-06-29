#!/usr/bin/env python3
"""
Convert restaurant JSON data to CSV format for Supabase upload.
This script flattens the nested JSON structure while preserving important data.
"""

import json
import csv
import sys
from pathlib import Path

def flatten_location(location_obj):
    """Extract latitude and longitude from location object."""
    if location_obj and isinstance(location_obj, dict):
        return {
            'latitude': location_obj.get('lat'),
            'longitude': location_obj.get('lng')
        }
    return {'latitude': None, 'longitude': None}

def flatten_reviews_distribution(dist_obj):
    """Extract review distribution counts."""
    if dist_obj and isinstance(dist_obj, dict):
        return {
            'reviews_one_star': dist_obj.get('oneStar', 0),
            'reviews_two_star': dist_obj.get('twoStar', 0),
            'reviews_three_star': dist_obj.get('threeStar', 0),
            'reviews_four_star': dist_obj.get('fourStar', 0),
            'reviews_five_star': dist_obj.get('fiveStar', 0)
        }
    return {
        'reviews_one_star': 0,
        'reviews_two_star': 0,
        'reviews_three_star': 0,
        'reviews_four_star': 0,
        'reviews_five_star': 0
    }

def flatten_opening_hours(hours_list):
    """Convert opening hours list to a simplified format."""
    if not hours_list or not isinstance(hours_list, list):
        return None
    
    # Create a dictionary of day -> hours
    hours_dict = {}
    for item in hours_list:
        if isinstance(item, dict) and 'day' in item and 'hours' in item:
            hours_dict[item['day']] = item['hours']
    
    # Convert to a JSON string for storage
    return json.dumps(hours_dict) if hours_dict else None

def flatten_categories(categories_list):
    """Convert categories list to comma-separated string."""
    if categories_list and isinstance(categories_list, list):
        return ', '.join(str(cat) for cat in categories_list)
    return None

def flatten_image_categories(image_cats):
    """Convert image categories to comma-separated string."""
    if image_cats and isinstance(image_cats, list):
        return ', '.join(str(cat) for cat in image_cats)
    return None

def extract_popular_times_live(restaurant):
    """Extract current popular times data."""
    return {
        'popular_times_live_text': restaurant.get('popularTimesLiveText'),
        'popular_times_live_percent': restaurant.get('popularTimesLivePercent')
    }

def process_additional_info(additional_info):
    """Process additional info into flattened format."""
    if not additional_info or not isinstance(additional_info, dict):
        return {}
    
    result = {}
    
    # Extract key service options
    service_options = additional_info.get('Service options', [])
    if service_options:
        for option in service_options:
            if isinstance(option, dict):
                for key, value in option.items():
                    result[f'service_{key.lower().replace(" ", "_").replace("-", "_")}'] = value
    
    # Extract highlights
    highlights = additional_info.get('Highlights', [])
    if highlights:
        for highlight in highlights:
            if isinstance(highlight, dict):
                for key, value in highlight.items():
                    result[f'highlight_{key.lower().replace(" ", "_").replace("-", "_")}'] = value
    
    # Extract popular for
    popular_for = additional_info.get('Popular for', [])
    if popular_for:
        for item in popular_for:
            if isinstance(item, dict):
                for key, value in item.items():
                    result[f'popular_for_{key.lower().replace(" ", "_").replace("-", "_")}'] = value
    
    # Extract accessibility
    accessibility = additional_info.get('Accessibility', [])
    if accessibility:
        for item in accessibility:
            if isinstance(item, dict):
                for key, value in item.items():
                    result[f'accessibility_{key.lower().replace(" ", "_").replace("-", "_")}'] = value
    
    # Extract atmosphere
    atmosphere = additional_info.get('Atmosphere', [])
    if atmosphere:
        for item in atmosphere:
            if isinstance(item, dict):
                for key, value in item.items():
                    result[f'atmosphere_{key.lower().replace(" ", "_").replace("-", "_")}'] = value
    
    # Extract payments
    payments = additional_info.get('Payments', [])
    if payments:
        for item in payments:
            if isinstance(item, dict):
                for key, value in item.items():
                    result[f'payment_{key.lower().replace(" ", "_").replace("-", "_")}'] = value
    
    return result

def flatten_restaurant_data(restaurant):
    """Convert a single restaurant object to flattened dictionary for CSV."""
    flattened = {}
    
    # Basic restaurant information
    flattened['place_id'] = restaurant.get('placeId')
    flattened['title'] = restaurant.get('title')
    flattened['subtitle'] = restaurant.get('subTitle')
    flattened['description'] = restaurant.get('description')
    flattened['price'] = restaurant.get('price')
    flattened['category_name'] = restaurant.get('categoryName')
    
    # Location information
    flattened['address'] = restaurant.get('address')
    flattened['neighborhood'] = restaurant.get('neighborhood')
    flattened['street'] = restaurant.get('street')
    flattened['city'] = restaurant.get('city')
    flattened['postal_code'] = restaurant.get('postalCode')
    flattened['state'] = restaurant.get('state')
    flattened['country_code'] = restaurant.get('countryCode')
    
    # Flatten location coordinates
    location_data = flatten_location(restaurant.get('location'))
    flattened.update(location_data)
    
    # Contact information
    flattened['website'] = restaurant.get('website')
    flattened['phone'] = restaurant.get('phone')
    flattened['phone_unformatted'] = restaurant.get('phoneUnformatted')
    
    # Business status and ratings
    flattened['total_score'] = restaurant.get('totalScore')
    flattened['permanently_closed'] = restaurant.get('permanentlyClosed')
    flattened['temporarily_closed'] = restaurant.get('temporarilyClosed')
    flattened['claim_this_business'] = restaurant.get('claimThisBusiness')
    
    # Google-specific IDs
    flattened['fid'] = restaurant.get('fid')
    flattened['cid'] = restaurant.get('cid')
    flattened['plus_code'] = restaurant.get('plusCode')
    
    # Review information
    flattened['reviews_count'] = restaurant.get('reviewsCount')
    flattened['images_count'] = restaurant.get('imagesCount')
    
    # Flatten review distribution
    review_dist = flatten_reviews_distribution(restaurant.get('reviewsDistribution'))
    flattened.update(review_dist)
    
    # Categories and image categories
    flattened['categories'] = flatten_categories(restaurant.get('categories'))
    flattened['image_categories'] = flatten_image_categories(restaurant.get('imageCategories'))
    
    # Popular times
    popular_times = extract_popular_times_live(restaurant)
    flattened.update(popular_times)
    
    # Opening hours (simplified)
    flattened['opening_hours'] = flatten_opening_hours(restaurant.get('openingHours'))
    
    # Timestamps
    flattened['scraped_at'] = restaurant.get('scrapedAt')
    
    # Business type specific fields
    flattened['reserve_table_url'] = restaurant.get('reserveTableUrl')
    flattened['google_food_url'] = restaurant.get('googleFoodUrl')
    
    # URLs and search info
    flattened['url'] = restaurant.get('url')
    flattened['search_string'] = restaurant.get('searchString')
    flattened['language'] = restaurant.get('language')
    flattened['is_advertisement'] = restaurant.get('isAdvertisement')
    flattened['image_url'] = restaurant.get('imageUrl')
    flattened['kgmid'] = restaurant.get('kgmid')
    
    # Process additional info (service options, highlights, etc.)
    additional_info_flattened = process_additional_info(restaurant.get('additionalInfo'))
    flattened.update(additional_info_flattened)
    
    # Complex data as JSON strings (for data that's too complex to flatten)
    complex_fields = [
        'popularTimesHistogram', 'additionalOpeningHours', 'peopleAlsoSearch',
        'placesTags', 'reviewsTags', 'questionsAndAnswers', 'webResults',
        'orderBy', 'restaurantData', 'imageUrls', 'reviews'
    ]
    
    for field in complex_fields:
        if field in restaurant and restaurant[field] is not None:
            # Only include if data exists and is not empty
            data = restaurant[field]
            if data:  # Check if not empty list/dict/string
                flattened[f'{field.lower()}_json'] = json.dumps(data)
    
    return flattened

def convert_json_to_csv(input_file, output_file):
    """Convert restaurant JSON file to CSV format."""
    try:
        print(f"Loading JSON data from {input_file}...")
        with open(input_file, 'r', encoding='utf-8') as f:
            restaurants = json.load(f)
        
        if not restaurants:
            print("No restaurant data found in the JSON file.")
            return
        
        print(f"Found {len(restaurants)} restaurants to convert.")
        
        # Process first restaurant to get all possible columns
        print("Analyzing data structure...")
        all_columns = set()
        sample_size = min(100, len(restaurants))  # Sample first 100 to get column structure
        
        for i, restaurant in enumerate(restaurants[:sample_size]):
            flattened = flatten_restaurant_data(restaurant)
            all_columns.update(flattened.keys())
            if (i + 1) % 50 == 0:
                print(f"  Processed {i + 1} restaurants for column analysis...")
        
        # Sort columns for consistent output
        columns = sorted(list(all_columns))
        print(f"Found {len(columns)} unique columns.")
        
        # Write CSV file
        print(f"Writing CSV data to {output_file}...")
        with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=columns, extrasaction='ignore')
            writer.writeheader()
            
            for i, restaurant in enumerate(restaurants):
                flattened = flatten_restaurant_data(restaurant)
                # Ensure all columns are present (fill missing with None/empty)
                row = {col: flattened.get(col, None) for col in columns}
                writer.writerow(row)
                
                if (i + 1) % 500 == 0:
                    print(f"  Processed {i + 1}/{len(restaurants)} restaurants...")
        
        print(f"✅ Successfully converted {len(restaurants)} restaurants to CSV!")
        print(f"   Output file: {output_file}")
        print(f"   Columns: {len(columns)}")
        
        # Show sample of columns
        print("\nSample of columns created:")
        for i, col in enumerate(columns[:20]):
            print(f"  {i+1}. {col}")
        if len(columns) > 20:
            print(f"  ... and {len(columns) - 20} more columns")
            
    except FileNotFoundError:
        print(f"❌ Error: Could not find input file {input_file}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"❌ Error: Invalid JSON format in {input_file}: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

def main():
    """Main function to run the conversion."""
    # Get the directory of this script
    script_dir = Path(__file__).parent
    
    # Define input and output files
    input_file = script_dir / "full_restaurant.json"
    output_file = script_dir / "restaurants.csv"
    
    print("🍽️  Restaurant JSON to CSV Converter")
    print("=" * 50)
    
    if not input_file.exists():
        print(f"❌ Error: Input file not found: {input_file}")
        print("   Make sure full_restaurant.json is in the same directory as this script.")
        sys.exit(1)
    
    convert_json_to_csv(input_file, output_file)

if __name__ == "__main__":
    main() 