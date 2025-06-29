#!/usr/bin/env python3
"""
Cleaned JSON to CSV Converter for ChowGPT
Removes problematic bigint fields: reviewerId, reviewerUrl, reviewerPhotoUrl, kgmid, fid, cid
"""

import json
import csv
import os
from datetime import datetime
from collections import defaultdict

# Fields to completely omit (causing bigint errors or privacy concerns)
OMIT_FIELDS = {
    'reviewerId',
    'reviewerUrl', 
    'reviewerPhotoUrl',
    'kgmid',
    'fid',
    'cid'
}

def should_omit_field(field_name):
    """Check if a field should be omitted"""
    return field_name in OMIT_FIELDS

def safe_convert_value(value, field_name=""):
    """Safely convert values, handling potential bigint issues"""
    if value is None:
        return None
    
    # Convert everything to string first, then handle specific cases
    str_value = str(value)
    
    # Handle empty strings
    if str_value == "" or str_value == "None":
        return None
    
    # For place_id and review_id, always keep as text
    if 'id' in field_name.lower():
        return str_value
    
    # Handle booleans
    if isinstance(value, bool):
        return value
    
    # Handle numbers that aren't too large
    if isinstance(value, (int, float)):
        # Keep small numbers as numbers, convert large ones to text
        if isinstance(value, int) and len(str(abs(value))) >= 15:
            return str_value  # Convert large integers to text
        return value
    
    # For strings, check for large embedded numbers
    if isinstance(value, str):
        # If it's purely numeric and very long, keep as string
        if str_value.isdigit() and len(str_value) >= 15:
            return str_value
        return value
    
    return str_value

def flatten_restaurant_data(restaurant):
    """Flatten restaurant data, omitting problematic fields"""
    flattened = {}
    
    def add_field(key, value, prefix=""):
        field_name = f"{prefix}.{key}" if prefix else key
        
        # Skip omitted fields
        if should_omit_field(key) or should_omit_field(field_name):
            return
        
        if isinstance(value, dict):
            # Handle nested objects
            for nested_key, nested_value in value.items():
                add_field(nested_key, nested_value, field_name)
        elif isinstance(value, list):
            # Convert lists to JSON strings (except reviews which are handled separately)
            if key != 'reviews':
                # Filter out omitted fields from list items
                if value and isinstance(value[0], dict):
                    cleaned_list = []
                    for item in value:
                        if isinstance(item, dict):
                            cleaned_item = {k: v for k, v in item.items() if not should_omit_field(k)}
                            if cleaned_item:  # Only add if there's data left after cleaning
                                cleaned_list.append(cleaned_item)
                        else:
                            cleaned_list.append(item)
                    if cleaned_list:
                        flattened[field_name] = json.dumps(cleaned_list)
                else:
                    flattened[field_name] = json.dumps(value)
        else:
            # Regular field
            safe_value = safe_convert_value(value, field_name)
            if safe_value is not None:
                flattened[field_name] = safe_value
    
    # Process all fields except reviews
    for key, value in restaurant.items():
        if key != 'reviews':
            add_field(key, value)
    
    return flattened

def extract_reviews(restaurant):
    """Extract and clean review data"""
    reviews = restaurant.get('reviews', [])
    place_id = restaurant.get('placeId', '')
    
    cleaned_reviews = []
    
    for i, review in enumerate(reviews):
        if not isinstance(review, dict):
            continue
            
        cleaned_review = {'place_id': place_id}  # Foreign key
        
        for key, value in review.items():
            # Skip omitted fields
            if should_omit_field(key):
                continue
                
            # Handle nested objects in reviews
            if isinstance(value, dict):
                # Filter out omitted fields from nested objects
                cleaned_nested = {k: v for k, v in value.items() if not should_omit_field(k)}
                if cleaned_nested:
                    cleaned_review[key] = json.dumps(cleaned_nested)
            elif isinstance(value, list):
                # Convert lists to JSON
                cleaned_review[key] = json.dumps(value)
            else:
                safe_value = safe_convert_value(value, key)
                if safe_value is not None:
                    cleaned_review[key] = safe_value
        
        if len(cleaned_review) > 1:  # More than just place_id
            cleaned_reviews.append(cleaned_review)
    
    return cleaned_reviews

def get_all_columns(data, data_type):
    """Get all unique columns from the data"""
    columns = set()
    
    for item in data:
        columns.update(item.keys())
    
    # Sort columns for consistent output
    sorted_columns = sorted(columns)
    
    # Put important columns first
    if data_type == 'restaurants':
        priority_columns = ['placeId', 'title', 'rating', 'address', 'phone']
    else:  # reviews
        priority_columns = ['place_id', 'reviewId', 'rating', 'text', 'publishedAtDate']
    
    # Reorder to put priority columns first
    ordered_columns = []
    for col in priority_columns:
        if col in sorted_columns:
            ordered_columns.append(col)
            sorted_columns.remove(col)
    
    ordered_columns.extend(sorted_columns)
    return ordered_columns

def write_csv_file(data, filename, data_type):
    """Write data to CSV file"""
    if not data:
        print(f"⚠️  No data to write for {filename}")
        return False
    
    try:
        # Get all columns
        columns = get_all_columns(data, data_type)
        
        print(f"📝 Writing {filename}...")
        print(f"   📊 Rows: {len(data)}")
        print(f"   📋 Columns: {len(columns)}")
        
        with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=columns, quoting=csv.QUOTE_NONNUMERIC)
            writer.writeheader()
            
            for row in data:
                # Ensure all values are properly handled
                cleaned_row = {}
                for col in columns:
                    value = row.get(col)
                    if value is None:
                        cleaned_row[col] = None
                    else:
                        cleaned_row[col] = value
                
                writer.writerow(cleaned_row)
        
        file_size = os.path.getsize(filename) / 1024 / 1024  # MB
        print(f"   ✅ Written: {file_size:.1f} MB")
        return True
        
    except Exception as e:
        print(f"❌ Error writing {filename}: {e}")
        return False

def convert_json_to_csv():
    """Main conversion function"""
    print("🧹 CLEANED JSON TO CSV CONVERTER")
    print("=" * 60)
    print(f"🗑️  Omitting problematic fields: {', '.join(sorted(OMIT_FIELDS))}")
    print("=" * 60)
    
    # Load JSON data
    json_file = 'restaurant_data/full_restaurant.json'
    
    try:
        with open(json_file, 'r', encoding='utf-8') as f:
            restaurants = json.load(f)
        
        print(f"📊 Loaded {len(restaurants)} restaurants")
        
    except FileNotFoundError:
        print(f"❌ File not found: {json_file}")
        return False
    except Exception as e:
        print(f"❌ Error loading JSON: {e}")
        return False
    
    # Process data
    print("\n🔧 Processing restaurant data...")
    restaurant_data = []
    all_reviews = []
    
    for i, restaurant in enumerate(restaurants):
        if i % 50 == 0:
            print(f"   Processing restaurant {i+1}/{len(restaurants)}...")
        
        # Flatten restaurant data (excluding reviews)
        flattened_restaurant = flatten_restaurant_data(restaurant)
        if flattened_restaurant:
            restaurant_data.append(flattened_restaurant)
        
        # Extract reviews
        reviews = extract_reviews(restaurant)
        all_reviews.extend(reviews)
    
    print(f"✅ Processed {len(restaurant_data)} restaurants")
    print(f"✅ Processed {len(all_reviews)} reviews")
    
    # Create output directory
    output_dir = 'csv_output'
    os.makedirs(output_dir, exist_ok=True)
    
    # Generate timestamp for filenames
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Write CSV files
    print(f"\n📁 Writing to {output_dir}/...")
    
    restaurants_file = f"{output_dir}/restaurants_CLEANED_{timestamp}.csv"
    reviews_file = f"{output_dir}/reviews_CLEANED_{timestamp}.csv"
    
    restaurants_success = write_csv_file(restaurant_data, restaurants_file, 'restaurants')
    reviews_success = write_csv_file(all_reviews, reviews_file, 'reviews')
    
    # Generate summary report
    summary_file = f"{output_dir}/CLEANING_REPORT_{timestamp}.txt"
    
    with open(summary_file, 'w') as f:
        f.write("CLEANING REPORT - ChowGPT Data\n")
        f.write("=" * 50 + "\n")
        f.write(f"Timestamp: {timestamp}\n")
        f.write(f"Source: {json_file}\n\n")
        
        f.write("REMOVED FIELDS (to fix bigint errors):\n")
        for field in sorted(OMIT_FIELDS):
            f.write(f"  ❌ {field}\n")
        f.write("\n")
        
        f.write("OUTPUT FILES:\n")
        f.write(f"  📊 {restaurants_file}: {len(restaurant_data)} restaurants\n")
        f.write(f"  📝 {reviews_file}: {len(all_reviews)} reviews\n\n")
        
        if restaurant_data:
            restaurant_columns = get_all_columns(restaurant_data, 'restaurants')
            f.write(f"RESTAURANT COLUMNS ({len(restaurant_columns)}):\n")
            for col in restaurant_columns:
                f.write(f"  - {col}\n")
            f.write("\n")
        
        if all_reviews:
            review_columns = get_all_columns(all_reviews, 'reviews')
            f.write(f"REVIEW COLUMNS ({len(review_columns)}):\n")
            for col in review_columns:
                f.write(f"  - {col}\n")
    
    print(f"\n📋 Summary report: {summary_file}")
    
    if restaurants_success and reviews_success:
        print("\n🎉 CONVERSION COMPLETED SUCCESSFULLY!")
        print("✅ All problematic bigint fields removed")
        print("✅ Data ready for Supabase import")
        print(f"✅ Output files in: {output_dir}/")
        return True
    else:
        print("\n❌ Conversion failed")
        return False

def main():
    """Main execution"""
    success = convert_json_to_csv()
    
    if success:
        print("\n💡 NEXT STEPS:")
        print("1. Review the CLEANING_REPORT file")
        print("2. Import the CSV files to Supabase")
        print("3. No more bigint overflow errors!")
    else:
        print("\n❌ Please check the errors above and try again")

if __name__ == "__main__":
    main() 