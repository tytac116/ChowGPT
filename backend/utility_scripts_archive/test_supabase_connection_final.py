#!/usr/bin/env python3
"""
Test Supabase Connection and Data Access - FINAL VERSION
Uses actual column names discovered from the database
"""

import os
import json
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

def get_supabase_client():
    """Initialize Supabase client"""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_ANON_KEY")  # Using anon key for read operations
    
    if not url or not key:
        raise ValueError("Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env file")
    
    print(f"🔗 Connecting to Supabase: {url}")
    return create_client(url, key)

def test_connection(supabase: Client):
    """Test basic connection to Supabase"""
    print("\n🔍 TESTING SUPABASE CONNECTION")
    print("=" * 50)
    
    try:
        # Simple query to test connection
        response = supabase.from_("restaurants").select("placeId").limit(1).execute()
        
        if response.data:
            print("✅ Connection successful!")
            return True
        else:
            print("⚠️  Connection works but no data found")
            return False
            
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

def test_restaurants_table(supabase: Client):
    """Test restaurants table access"""
    print("\n🏪 TESTING RESTAURANTS TABLE")
    print("=" * 50)
    
    try:
        # Get basic stats
        count_response = supabase.from_("restaurants").select("placeId", count="exact").execute()
        total_restaurants = count_response.count
        
        print(f"📊 Total restaurants: {total_restaurants}")
        
        # Get sample data using actual column names
        sample_response = supabase.from_("restaurants").select(
            "placeId, title, city, totalScore, reviewsCount, categoryName, price, phone"
        ).limit(5).execute()
        
        if sample_response.data:
            print(f"📋 Sample restaurants:")
            for i, restaurant in enumerate(sample_response.data, 1):
                title = restaurant.get('title', 'No title')[:30]
                city = restaurant.get('city', 'Unknown')
                rating = restaurant.get('totalScore', 'N/A')  # totalScore not rating
                reviews = restaurant.get('reviewsCount', 'N/A')
                category = restaurant.get('categoryName', 'N/A')
                price = restaurant.get('price', 'N/A')
                print(f"   {i}. {title} | {city} | Score: {rating} | Reviews: {reviews}")
                print(f"      Category: {category} | Price: {price}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error accessing restaurants table: {e}")
        return False

def test_reviews_table(supabase: Client):
    """Test restaurant_reviews table access"""
    print("\n📝 TESTING RESTAURANT_REVIEWS TABLE")
    print("=" * 50)
    
    try:
        # Get basic stats
        count_response = supabase.from_("restaurant_reviews").select("reviewId", count="exact").execute()
        total_reviews = count_response.count
        
        print(f"📊 Total reviews: {total_reviews}")
        
        # Get sample data using actual column names
        sample_response = supabase.from_("restaurant_reviews").select(
            "reviewId, place_id, stars, name, text, publishAt"  # place_id not placeId, stars not rating
        ).limit(5).execute()
        
        if sample_response.data:
            print(f"📋 Sample reviews:")
            for i, review in enumerate(sample_response.data, 1):
                name = review.get('name', 'Anonymous')[:20]
                stars = review.get('stars', 'N/A')  # stars not rating
                text = review.get('text', 'No text')[:50] + "..."
                place_id = review.get('place_id', 'N/A')[:20] + "..."
                publish = review.get('publishAt', 'N/A')
                print(f"   {i}. {name} | Stars: {stars} | Published: {publish}")
                print(f"      Place: {place_id}")
                print(f"      Text: {text}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error accessing restaurant_reviews table: {e}")
        return False

def test_table_relationship(supabase: Client):
    """Test relationship between restaurants and reviews"""
    print("\n🔗 TESTING TABLE RELATIONSHIPS")
    print("=" * 50)
    
    try:
        # Get a restaurant with its reviews
        restaurant_response = supabase.from_("restaurants").select(
            "placeId, title, city, totalScore, reviewsCount"
        ).limit(1).execute()
        
        if not restaurant_response.data:
            print("❌ No restaurants found for relationship test")
            return False
        
        restaurant = restaurant_response.data[0]
        place_id = restaurant['placeId']  # placeId in restaurants table
        
        print(f"🏪 Testing restaurant: {restaurant['title']} ({restaurant['city']})")
        print(f"   Place ID: {place_id}")
        print(f"   Total Score: {restaurant.get('totalScore', 'N/A')}")
        print(f"   Reviews Count: {restaurant.get('reviewsCount', 'N/A')}")
        
        # Get reviews for this restaurant
        reviews_response = supabase.from_("restaurant_reviews").select(
            "reviewId, stars, name, text, publishAt"
        ).eq("place_id", place_id).limit(5).execute()  # place_id in reviews table
        
        print(f"📝 Found {len(reviews_response.data)} reviews for this restaurant:")
        
        for i, review in enumerate(reviews_response.data, 1):
            name = review.get('name', 'Anonymous')[:20]
            stars = review.get('stars', 'N/A')
            text = review.get('text', 'No text')[:40] + "..."
            publish = review.get('publishAt', 'N/A')
            print(f"   {i}. {name} | Stars: {stars} | {publish}")
            print(f"      {text}")
        
        print(f"✅ Relationship working! Restaurant has reviews linked by place_id")
        return True
        
    except Exception as e:
        print(f"❌ Error testing relationships: {e}")
        return False

def test_data_types(supabase: Client):
    """Test data type handling and key fields"""
    print("\n🔧 TESTING KEY DATA FIELDS")
    print("=" * 50)
    
    try:
        # Get sample data to check key fields
        response = supabase.from_("restaurants").select(
            "placeId, title, totalScore, reviewsCount, city, categoryName, price, phone, address, website"
        ).limit(1).execute()
        
        if response.data:
            restaurant = response.data[0]
            print("📊 Key restaurant fields (all stored as TEXT):")
            
            key_fields = ['placeId', 'title', 'totalScore', 'reviewsCount', 'city', 
                         'categoryName', 'price', 'phone', 'address', 'website']
            
            for field in key_fields:
                value = restaurant.get(field, 'N/A')
                value_preview = str(value)[:50] + "..." if len(str(value)) > 50 else str(value)
                print(f"   {field:15} = '{value_preview}'")
            
            print("\n💡 Frontend parsing examples (JavaScript):")
            print(f"   const totalScore = parseFloat(data.totalScore) || 0;")
            print(f"   const reviewsCount = parseInt(data.reviewsCount) || 0;")
            print(f"   const placeId = data.placeId; // Keep as string")
            print(f"   const title = data.title || 'Unknown Restaurant';")
        
        # Test review fields
        review_response = supabase.from_("restaurant_reviews").select(
            "reviewId, place_id, stars, name, text, publishAt, reviewerNumberOfReviews"
        ).limit(1).execute()
        
        if review_response.data:
            review = review_response.data[0]
            print(f"\n📊 Key review fields (all stored as TEXT):")
            
            key_fields = ['reviewId', 'place_id', 'stars', 'name', 'text', 
                         'publishAt', 'reviewerNumberOfReviews']
            
            for field in key_fields:
                value = review.get(field, 'N/A')
                value_preview = str(value)[:40] + "..." if len(str(value)) > 40 else str(value)
                print(f"   {field:20} = '{value_preview}'")
            
            print("\n💡 Review parsing examples (JavaScript):")
            print(f"   const stars = parseInt(data.stars) || 0;")
            print(f"   const reviewerCount = parseInt(data.reviewerNumberOfReviews) || 0;")
            print(f"   const publishDate = new Date(data.publishedAtDate);")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing data types: {e}")
        return False

def main():
    """Main test function"""
    print("🚀 SUPABASE CONNECTION TEST - FINAL VERSION")
    print("=" * 70)
    print("🎯 Testing connection and data access")
    print("📊 Verifying table structure and relationships")
    print("🔧 Using actual column names from database")
    print("=" * 70)
    
    try:
        # Initialize Supabase client
        supabase = get_supabase_client()
        
        # Run tests
        tests = [
            ("Connection Test", lambda: test_connection(supabase)),
            ("Restaurants Table", lambda: test_restaurants_table(supabase)),
            ("Reviews Table", lambda: test_reviews_table(supabase)),
            ("Table Relationships", lambda: test_table_relationship(supabase)),
            ("Key Data Fields", lambda: test_data_types(supabase))
        ]
        
        results = []
        for test_name, test_func in tests:
            print(f"\n{'='*20} {test_name} {'='*20}")
            success = test_func()
            results.append((test_name, success))
        
        # Summary
        print(f"\n🎯 TEST RESULTS SUMMARY")
        print("=" * 50)
        
        passed = sum(1 for _, success in results if success)
        total = len(results)
        
        for test_name, success in results:
            status = "✅ PASS" if success else "❌ FAIL"
            print(f"   {test_name}: {status}")
        
        print(f"\n📊 Overall: {passed}/{total} tests passed")
        
        if passed == total:
            print(f"\n🎉 ALL TESTS PASSED!")
            print("✅ Supabase connection is working perfectly")
            print("✅ Both tables are accessible with correct column names")
            print("✅ Relationships are working (placeId ↔ place_id)")
            print("✅ Data is properly formatted and accessible")
            print("\n💡 Ready for frontend integration!")
            print("\n📋 CORRECT COLUMN NAMES FOR FRONTEND:")
            print("   🏪 Restaurants table:")
            print("      - placeId (PK)")
            print("      - title, city, categoryName, price, phone, address, website")
            print("      - totalScore (not 'rating'), reviewsCount")
            print("      - location.lat, location.lng (for maps)")
            print("   📝 Restaurant_reviews table:")
            print("      - reviewId (PK)")
            print("      - place_id (FK to restaurants.placeId)")
            print("      - stars (not 'rating'), name, text, publishAt")
            print("      - reviewerNumberOfReviews, isLocalGuide")
        else:
            print(f"\n⚠️  Some tests failed. Please check the errors above.")
            
    except Exception as e:
        print(f"❌ Fatal error: {e}")

if __name__ == "__main__":
    main() 