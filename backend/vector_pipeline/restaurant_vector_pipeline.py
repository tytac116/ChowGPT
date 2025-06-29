#!/usr/bin/env python3
"""
ChowGPT Restaurant Vector Upsert Pipeline
=========================================

Comprehensive vector embedding pipeline that creates rich, semantic chunks
for restaurant data to enable nuanced search queries like:
- "Affordable date spot with parking open late"
- "Family restaurant with outdoor seating near waterfront"
- "Quick sushi lunch under R200 with parking"

Uses LangChain + Pinecone + OpenAI embeddings for optimal performance.
"""

import os
import sys
import json
import time
import re
from typing import List, Dict, Any, Optional, Tuple
from collections import Counter
from datetime import datetime

# Add the parent directory to the path to import from our backend
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

import requests
from dotenv import load_dotenv
from langchain_openai import OpenAIEmbeddings
from langchain_pinecone import PineconeVectorStore
from langchain_core.documents import Document
from pinecone import Pinecone
import tiktoken

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

class RestaurantVectorPipeline:
    """
    Comprehensive restaurant vector embedding pipeline.
    
    Creates 5 types of semantic chunks per restaurant:
    1. Overview Chunk - Name, cuisine, location, highlights
    2. Operational Chunk - Hours, service, accessibility 
    3. Parking & Location Chunk - Parking intelligence, neighborhood context
    4. Experience Chunk - Review-based insights, atmosphere, value
    5. Features Chunk - Natural language feature descriptions
    """
    
    def __init__(self):
        self.setup_clients()
        self.setup_tokenizer()
        self.api_base_url = "http://localhost:3001/api"
        
    def setup_clients(self):
        """Initialize OpenAI, Pinecone, and LangChain clients."""
        print("🔧 Setting up clients...")
        
        # Initialize OpenAI embeddings
        self.embeddings = OpenAIEmbeddings(
            openai_api_key=os.getenv('OPENAI_API_KEY'),
            model="text-embedding-3-small",  # Cost-effective, high-quality embeddings
            chunk_size=1000
        )
        
        # Initialize Pinecone
        self.pinecone_client = Pinecone(api_key=os.getenv('PINECONE_API_KEY'))
        
        # Index configuration
        self.index_name = "chowgpt-restaurants"
        self.dimension = 1536  # text-embedding-3-small dimension
        
        print("✅ Clients initialized successfully")
        
    def setup_tokenizer(self):
        """Setup tokenizer for chunk size estimation."""
        self.tokenizer = tiktoken.encoding_for_model("text-embedding-3-small")
        
    def count_tokens(self, text: str) -> int:
        """Count tokens in text."""
        return len(self.tokenizer.encode(text))
        
    def create_or_get_index(self):
        """Create Pinecone index if it doesn't exist."""
        print(f"🔍 Checking Pinecone index '{self.index_name}'...")
        
        try:
            # Check if index exists
            index_list = self.pinecone_client.list_indexes()
            existing_indexes = [idx['name'] for idx in index_list.indexes]
            
            if self.index_name not in existing_indexes:
                print(f"📝 Creating new Pinecone index '{self.index_name}'...")
                self.pinecone_client.create_index(
                    name=self.index_name,
                    dimension=self.dimension,
                    metric='cosine',
                    spec={
                        'serverless': {
                            'cloud': 'aws',
                            'region': 'us-east-1'
                        }
                    }
                )
                print("✅ Index created successfully")
                time.sleep(30)  # Wait for index to be ready
            else:
                print("✅ Index already exists")
                
            # Initialize vector store
            self.vector_store = PineconeVectorStore(
                index_name=self.index_name,
                embedding=self.embeddings,
                pinecone_api_key=os.getenv('PINECONE_API_KEY')
            )
            
        except Exception as e:
            print(f"❌ Error setting up Pinecone index: {e}")
            raise
            
    def fetch_restaurant_data(self) -> List[Dict]:
        """Fetch all restaurant data from the API using pagination."""
        print("📡 Fetching restaurant data from API...")
        
        try:
            all_restaurants = []
            limit = 50  # Safe limit per request
            offset = 0
            
            while True:
                # Get enhanced restaurant list with pagination
                response = requests.get(f"{self.api_base_url}/restaurants", params={
                    'enhanced': 'true',
                    'limit': limit,
                    'offset': offset
                })
                response.raise_for_status()
                
                data = response.json()
                restaurants = data.get('data', {}).get('restaurants', [])
                total = data.get('data', {}).get('total', 0)
                
                if not restaurants:
                    break
                    
                all_restaurants.extend(restaurants)
                print(f"📥 Fetched batch: {len(restaurants)} restaurants (total: {len(all_restaurants)}/{total})")
                
                # Check if we've fetched all restaurants
                if len(all_restaurants) >= total or len(restaurants) < limit:
                    break
                    
                offset += limit
            
            print(f"✅ Fetched {len(all_restaurants)} restaurants total")
            return all_restaurants
            
        except Exception as e:
            print(f"❌ Error fetching restaurant data: {e}")
            raise
            
    def fetch_detailed_restaurant(self, restaurant_id: str) -> Optional[Dict]:
        """Fetch detailed restaurant data including reviews with aggressive rate limiting."""
        max_retries = 5
        retry_delay = 5  # Start with longer delay
        
        for attempt in range(max_retries):
            try:
                response = requests.get(f"{self.api_base_url}/restaurants/{restaurant_id}")
                
                if response.status_code == 429:  # Rate limited
                    if attempt < max_retries - 1:
                        wait_time = retry_delay * (2 ** attempt)  # Exponential backoff
                        print(f"   ⏳ Rate limited, waiting {wait_time}s before retry (attempt {attempt + 1}/{max_retries})...")
                        time.sleep(wait_time)
                        continue
                        
                response.raise_for_status()
                time.sleep(0.5)  # Longer delay between successful requests to be safe
                return response.json()
                
            except Exception as e:
                if attempt == max_retries - 1:
                    print(f"⚠️  Error fetching detailed data for {restaurant_id}: {e}")
                    return None
                wait_time = retry_delay * (2 ** attempt)
                print(f"   🔄 Retrying in {wait_time}s due to error: {str(e)[:50]}...")
                time.sleep(wait_time)
                
        return None
            
    def extract_parking_intelligence(self, detailed_data: Dict) -> Tuple[str, str]:
        """Extract parking information from reviews and structured data."""
        parking_mentions = []
        parking_difficulty = "unknown"
        
        # Check reviews for parking mentions
        reviews = detailed_data.get('reviews', [])
        for review in reviews:
            text = review.get('text', '').lower()
            context = review.get('reviewContext', {})
            
            # Check review context for parking info
            if 'Parking space' in context:
                parking_space = context['Parking space'].lower()
                if 'plenty' in parking_space:
                    parking_mentions.append("has plenty of parking available")
                    parking_difficulty = "easy"
                elif 'difficult' in parking_space:
                    parking_mentions.append("parking can be challenging to find")
                    parking_difficulty = "difficult"
                elif 'somewhat difficult' in parking_space:
                    parking_mentions.append("parking is somewhat limited")
                    parking_difficulty = "moderate"
                    
            # Check review text for parking mentions
            if any(word in text for word in ['parking', 'valet', 'park']):
                if 'easy parking' in text or 'plenty parking' in text:
                    parking_mentions.append("visitors mention easy parking")
                elif 'difficult parking' in text or 'hard to park' in text:
                    parking_mentions.append("visitors report parking challenges")
                elif 'valet' in text:
                    parking_mentions.append("offers valet parking service")
                    
        # Check service options for parking
        service_options = detailed_data.get('serviceOptions', {})
        if service_options.get('hasParking'):
            parking_mentions.append("provides parking facilities")
            
        parking_desc = ". ".join(parking_mentions) if parking_mentions else "parking information not specified"
        return parking_desc, parking_difficulty
        
    def extract_price_intelligence(self, detailed_data: Dict) -> Tuple[str, int, int]:
        """Extract comprehensive price information."""
        price_mentions = []
        price_min = 0
        price_max = 0
        
        # Get base price level
        base_price = detailed_data.get('price', '')
        if base_price:
            price_mentions.append(f"price range {base_price}")
            
        # Extract from average price if available
        avg_price = detailed_data.get('averagePrice')
        if avg_price:
            price_mentions.append(f"typical cost {avg_price}")
            
            # Extract numeric values for filtering
            price_numbers = re.findall(r'R\s*(\d+)', avg_price)
            if price_numbers:
                price_min = int(price_numbers[0])
                if len(price_numbers) > 1:
                    price_max = int(price_numbers[1])
                else:
                    price_max = price_min + 100
                    
        # Check reviews for price context
        reviews = detailed_data.get('reviews', [])
        for review in reviews:
            context = review.get('reviewContext', {})
            if 'Price per person' in context:
                price_per_person = context['Price per person']
                price_mentions.append(f"diners report spending {price_per_person}")
                
                # Extract price range for metadata
                numbers = re.findall(r'(\d+)', price_per_person)
                if numbers and price_min == 0:
                    price_min = int(numbers[0])
                    if len(numbers) > 1:
                        price_max = int(numbers[1])
                    else:
                        price_max = price_min + 50
                        
        price_desc = ". ".join(price_mentions) if price_mentions else "pricing information varies"
        return price_desc, price_min, price_max
        
    def extract_experience_themes(self, reviews: List[Dict]) -> str:
        """Extract common themes and experiences from reviews."""
        themes = []
        positive_words = []
        service_mentions = []
        food_mentions = []
        
        for review in reviews[:15]:  # Process first 15 reviews for themes
            text = review.get('text', '').lower()
            rating = review.get('rating', 0)
            
            # Extract positive themes from high-rated reviews
            if rating >= 4:
                if any(word in text for word in ['excellent', 'amazing', 'outstanding', 'perfect']):
                    positive_words.append("consistently receives excellent reviews")
                if any(word in text for word in ['service', 'staff', 'friendly', 'helpful']):
                    service_mentions.append("praised for friendly service")
                if any(word in text for word in ['delicious', 'tasty', 'fresh', 'quality']):
                    food_mentions.append("food quality highly rated")
                if any(word in text for word in ['atmosphere', 'ambiance', 'cozy', 'romantic']):
                    themes.append("creates a welcoming atmosphere")
                if any(word in text for word in ['value', 'worth', 'reasonable', 'affordable']):
                    themes.append("offers good value for money")
                    
        # Combine unique themes
        all_themes = list(set(themes + positive_words + service_mentions + food_mentions))
        return ". ".join(all_themes[:5]) if all_themes else "popular dining destination"
        
    def create_overview_chunk(self, restaurant: Dict, detailed_data: Dict) -> Document:
        """Create rich overview chunk with restaurant essentials including description."""
        title = restaurant.get('title', 'Restaurant')
        category = restaurant.get('categoryName', 'Restaurant')
        categories = restaurant.get('categories', [])
        neighborhood = restaurant.get('neighborhood', '')
        address = restaurant.get('address', '')
        rating = restaurant.get('totalScore', 0)
        review_count = restaurant.get('reviewsCount', 0)
        description = detailed_data.get('description', '') or restaurant.get('description', '')
        
        # Create rich, natural language content
        content_parts = [
            f"{title} is a {category.lower()} located in {neighborhood}, Cape Town.",
        ]
        
        # Add restaurant description if available
        if description and description.strip():
            content_parts.append(f"Restaurant description: {description.strip()}")
        
        if categories and len(categories) > 1:
            other_categories = [cat for cat in categories if cat != category]
            if other_categories:
                content_parts.append(f"This establishment also serves {', '.join(other_categories[:3]).lower()} cuisine.")
                
        if rating > 0:
            content_parts.append(f"Highly rated with {rating} stars from {review_count} customer reviews.")
            
        if rating >= 4.5:
            content_parts.append("Consistently recognized as an exceptional dining destination.")
        elif rating >= 4.0:
            content_parts.append("Well-regarded for quality and service.")
            
        # Add address context
        if address:
            content_parts.append(f"Conveniently located at {address}.")
            
        content = " ".join(content_parts)
        
        # Create metadata
        metadata = {
            'restaurant_id': restaurant['id'],
            'chunk_type': 'overview',
            'name': title,
            'neighborhood': neighborhood,
            'cuisine_primary': category,
            'cuisine_tags': categories[:5],
            'rating': float(rating),
            'review_count': int(review_count),
            'address': address
        }
        
        return Document(page_content=content, metadata=metadata)
        
    def create_operational_chunk(self, restaurant: Dict, detailed_data: Dict) -> Document:
        """Create operational details chunk."""
        title = restaurant.get('title', 'Restaurant')
        opening_hours = detailed_data.get('openingHours', [])
        service_options = detailed_data.get('serviceOptions', {})
        phone = detailed_data.get('phone', '')
        website = detailed_data.get('website', '')
        
        content_parts = [f"{title} operational information:"]
        
        # Opening hours analysis
        if opening_hours:
            # Check if open late (after 9 PM)
            late_hours = []
            early_hours = []
            for day_info in opening_hours:
                hours = day_info.get('hours', '')
                if any(time in hours.lower() for time in ['10 pm', '11 pm', '12 am', '1 am']):
                    late_hours.append(day_info.get('day'))
                if any(time in hours.lower() for time in ['7 am', '8 am', '9 am']):
                    early_hours.append(day_info.get('day'))
                    
            if late_hours:
                content_parts.append(f"Open late for dining on {', '.join(late_hours[:3])}.")
            if early_hours:
                content_parts.append(f"Early dining available on {', '.join(early_hours[:3])}.")
                
            # General hours description
            content_parts.append("Operating hours vary by day, with full weekly schedule available.")
            
        # Service options
        service_features = []
        if service_options.get('dineIn'):
            service_features.append("dine-in service")
        if service_options.get('takeaway'):
            service_features.append("takeaway orders")
        if service_options.get('delivery'):
            service_features.append("delivery service")
        if service_options.get('reservations'):
            service_features.append("accepts reservations")
            
        if service_features:
            content_parts.append(f"Offers {', '.join(service_features)}.")
            
        # Accessibility and family features
        accessibility_features = []
        if service_options.get('wheelchairAccessible'):
            accessibility_features.append("wheelchair accessible")
        if service_options.get('goodForKids'):
            accessibility_features.append("family-friendly with children welcome")
        if service_options.get('goodForGroups'):
            accessibility_features.append("accommodates large groups")
            
        if accessibility_features:
            content_parts.append(f"Features include {', '.join(accessibility_features)}.")
            
        # Payment and amenities
        amenity_features = []
        if service_options.get('acceptsCreditCards'):
            amenity_features.append("accepts credit cards")
        if service_options.get('hasWifi'):
            amenity_features.append("provides Wi-Fi")
        if service_options.get('outdoorSeating'):
            amenity_features.append("outdoor seating available")
            
        if amenity_features:
            content_parts.append(f"Additional amenities: {', '.join(amenity_features)}.")
            
        # Contact information
        if phone:
            content_parts.append(f"Contact available at {phone}.")
        if website:
            content_parts.append("Website and online information available.")
            
        content = " ".join(content_parts)
        
        # Metadata for filtering
        metadata = {
            'restaurant_id': restaurant['id'],
            'chunk_type': 'operational',
            'name': title,
            'open_late': bool(late_hours) if 'late_hours' in locals() else False,
            'open_early': bool(early_hours) if 'early_hours' in locals() else False,
            'accepts_reservations': service_options.get('reservations', False),
            'delivery_available': service_options.get('delivery', False),
            'takeaway_available': service_options.get('takeaway', False),
            'wheelchair_accessible': service_options.get('wheelchairAccessible', False),
            'family_friendly': service_options.get('goodForKids', False),
            'good_for_groups': service_options.get('goodForGroups', False),
            'outdoor_seating': service_options.get('outdoorSeating', False),
            'has_wifi': service_options.get('hasWifi', False)
        }
        
        return Document(page_content=content, metadata=metadata)
        
    def create_parking_location_chunk(self, restaurant: Dict, detailed_data: Dict) -> Document:
        """Create parking and location intelligence chunk."""
        title = restaurant.get('title', 'Restaurant')
        neighborhood = restaurant.get('neighborhood', '')
        address = restaurant.get('address', '')
        
        parking_desc, parking_difficulty = self.extract_parking_intelligence(detailed_data)
        
        content_parts = [f"{title} location and parking information:"]
        
        # Neighborhood context
        if neighborhood:
            content_parts.append(f"Situated in {neighborhood}, a popular dining area in Cape Town.")
            
            # Add neighborhood characteristics
            if any(area in neighborhood.lower() for area in ['waterfront', 'harbour', 'sea']):
                content_parts.append("Located in a scenic waterfront location with tourist attractions nearby.")
            elif any(area in neighborhood.lower() for area in ['city', 'cbd', 'centre']):
                content_parts.append("Centrally located in the city center with business district access.")
            elif any(area in neighborhood.lower() for area in ['kloof', 'gardens', 'tamboerskloof']):
                content_parts.append("Nestled in an upscale residential area with trendy dining scene.")
                
        # Parking intelligence
        content_parts.append(parking_desc.capitalize() + ".")
        
        # Address context
        if address:
            if any(street in address.lower() for street in ['long street', 'kloof street', 'bree street']):
                content_parts.append("Located on a major Cape Town street with good accessibility.")
                
        content = " ".join(content_parts)
        
        metadata = {
            'restaurant_id': restaurant['id'],
            'chunk_type': 'parking_location',
            'name': title,
            'neighborhood': neighborhood,
            'parking_difficulty': parking_difficulty,
            'has_parking': parking_difficulty in ['easy', 'moderate'],
            'city_center': any(area in neighborhood.lower() for area in ['city', 'cbd', 'centre']),
            'waterfront': any(area in neighborhood.lower() for area in ['waterfront', 'harbour', 'sea']),
            'tourist_area': any(area in neighborhood.lower() for area in ['waterfront', 'camps bay', 'sea point'])
        }
        
        return Document(page_content=content, metadata=metadata)
        
    def create_review_chunks(self, restaurant: Dict, detailed_data: Dict) -> List[Document]:
        """Create review chunks with ALL reviews, splitting if necessary to manage size."""
        title = restaurant.get('title', 'Restaurant')
        reviews = detailed_data.get('reviews', [])
        rating = restaurant.get('totalScore', 0)
        
        if not reviews:
            return []
        
        price_desc, price_min, price_max = self.extract_price_intelligence(detailed_data)
        experience_themes = self.extract_experience_themes(reviews)
        
        # Create base content for all review chunks
        base_content_parts = [f"{title} customer reviews and dining experiences:"]
        
        # Rating context
        if rating >= 4.5:
            base_content_parts.append("Exceptional dining experience with outstanding customer satisfaction.")
        elif rating >= 4.0:
            base_content_parts.append("High-quality dining experience with positive customer feedback.")
        elif rating >= 3.5:
            base_content_parts.append("Good dining option with generally satisfied customers.")
            
        # Experience themes from reviews
        if experience_themes:
            base_content_parts.append(experience_themes.capitalize() + ".")
        
        # Price and value context
        if price_desc:
            base_content_parts.append(price_desc.capitalize() + ".")
            
        base_content = " ".join(base_content_parts)
        base_tokens = self.count_tokens(base_content)
        
        # Prepare all review texts
        all_review_texts = []
        for review in reviews:
            review_text = review.get('text', '').strip()
            if review_text:
                reviewer_name = review.get('reviewerName', 'Customer')
                rating_stars = review.get('rating', 0)
                review_entry = f"Review by {reviewer_name} ({rating_stars}/5): {review_text}"
                all_review_texts.append(review_entry)
        
        if not all_review_texts:
            return []
            
        # Smart chunking - keep chunks under 800 tokens
        chunks = []
        current_chunk_reviews = []
        current_chunk_tokens = base_tokens
        max_chunk_tokens = 800
        
        for review_text in all_review_texts:
            review_tokens = self.count_tokens(review_text)
            
            # If adding this review would exceed limit, create current chunk and start new one
            if current_chunk_tokens + review_tokens > max_chunk_tokens and current_chunk_reviews:
                # Create chunk with current reviews
                chunk_content = base_content + " " + " | ".join(current_chunk_reviews)
                
                metadata = {
                    'restaurant_id': restaurant['id'],
                    'chunk_type': f'reviews_part_{len(chunks) + 1}',
                    'name': title,
                    'rating': float(rating),
                    'price_min': price_min,
                    'price_max': price_max,
                    'high_rated': rating >= 4.0,
                    'exceptional': rating >= 4.5,
                    'affordable': price_max > 0 and price_max <= 300,
                    'mid_range': price_min >= 200 and price_max <= 500,
                    'upscale': price_min >= 400,
                    'review_count': len(current_chunk_reviews),
                    'total_reviews': len(reviews)
                }
                
                chunks.append(Document(page_content=chunk_content, metadata=metadata))
                
                # Start new chunk
                current_chunk_reviews = [review_text]
                current_chunk_tokens = base_tokens + review_tokens
            else:
                # Add review to current chunk
                current_chunk_reviews.append(review_text)
                current_chunk_tokens += review_tokens
        
        # Create final chunk with remaining reviews
        if current_chunk_reviews:
            chunk_content = base_content + " " + " | ".join(current_chunk_reviews)
            
            metadata = {
                'restaurant_id': restaurant['id'],
                'chunk_type': f'reviews_part_{len(chunks) + 1}' if chunks else 'reviews',
                'name': title,
                'rating': float(rating),
                'price_min': price_min,
                'price_max': price_max,
                'high_rated': rating >= 4.0,
                'exceptional': rating >= 4.5,
                'affordable': price_max > 0 and price_max <= 300,
                'mid_range': price_min >= 200 and price_max <= 500,
                'upscale': price_min >= 400,
                'review_count': len(current_chunk_reviews),
                'total_reviews': len(reviews)
            }
            
            chunks.append(Document(page_content=chunk_content, metadata=metadata))
            
        return chunks
        
    def create_features_chunk(self, restaurant: Dict, detailed_data: Dict) -> Document:
        """Create natural language features chunk."""
        title = restaurant.get('title', 'Restaurant')
        service_options = detailed_data.get('serviceOptions', {})
        categories = restaurant.get('categories', [])
        
        content_parts = [f"{title} features and specialties:"]
        
        # Cuisine specialties
        if categories:
            if len(categories) > 1:
                content_parts.append(f"Specializes in {categories[0].lower()} with {', '.join(categories[1:3]).lower()} influences.")
            else:
                content_parts.append(f"Authentic {categories[0].lower()} cuisine prepared with care.")
                
        # Service features in natural language
        feature_sentences = []
        
        if service_options.get('dineIn') and service_options.get('outdoorSeating'):
            feature_sentences.append("offers both indoor dining and outdoor seating options")
        elif service_options.get('outdoorSeating'):
            feature_sentences.append("features pleasant outdoor seating")
        elif service_options.get('dineIn'):
            feature_sentences.append("provides comfortable indoor dining")
            
        if service_options.get('delivery') and service_options.get('takeaway'):
            feature_sentences.append("convenient delivery and takeaway services available")
        elif service_options.get('delivery'):
            feature_sentences.append("offers delivery service to your location")
        elif service_options.get('takeaway'):
            feature_sentences.append("quick takeaway service for busy schedules")
            
        if service_options.get('goodForGroups') and service_options.get('acceptsCreditCards'):
            feature_sentences.append("perfect for group dining with easy payment options")
        elif service_options.get('goodForGroups'):
            feature_sentences.append("accommodates large parties and celebrations")
            
        if service_options.get('goodForKids'):
            feature_sentences.append("family-friendly environment welcoming children")
            
        if service_options.get('hasWifi'):
            feature_sentences.append("provides complimentary Wi-Fi for guests")
            
        if service_options.get('liveMusic'):
            feature_sentences.append("features live music entertainment")
            
        if service_options.get('acceptsCreditCards'):
            feature_sentences.append("accepts major credit cards for convenience")
            
        if feature_sentences:
            content_parts.append(f"This establishment {', '.join(feature_sentences[:4])}.")
            
        # Atmosphere and vibe
        if service_options.get('goodForGroups') and service_options.get('goodForKids'):
            content_parts.append("Creates a lively, welcoming atmosphere suitable for all ages.")
        elif service_options.get('outdoorSeating') and not service_options.get('liveMusic'):
            content_parts.append("Offers a relaxed dining atmosphere with pleasant ambiance.")
        elif service_options.get('liveMusic'):
            content_parts.append("Vibrant entertainment venue with energetic atmosphere.")
            
        content = " ".join(content_parts)
        
        metadata = {
            'restaurant_id': restaurant['id'],
            'chunk_type': 'features',
            'name': title,
            'cuisine_tags': categories[:5],
            'dining_style': 'casual' if service_options.get('goodForKids') else 'upscale',
            'entertainment': service_options.get('liveMusic', False),
            'romantic': service_options.get('outdoorSeating', False) and not service_options.get('goodForKids', False),
            'business_friendly': service_options.get('hasWifi', False) and service_options.get('acceptsCreditCards', False)
        }
        
        return Document(page_content=content, metadata=metadata)
        
    def process_restaurant(self, restaurant: Dict) -> List[Document]:
        """Process a single restaurant and create all 5 chunks."""
        restaurant_id = restaurant['id']
        title = restaurant.get('title', 'Restaurant')
        
        # Fetch detailed data
        detailed_data = self.fetch_detailed_restaurant(restaurant_id)
        if not detailed_data:
            print(f"⚠️  Skipping {title} - no detailed data available")
            return []
            
        # Create all 5 chunks
        chunks = []
        
        try:
            # 1. Overview chunk (includes description)
            overview_chunk = self.create_overview_chunk(restaurant, detailed_data)
            chunks.append(overview_chunk)
            
            # 2. Operational chunk
            operational_chunk = self.create_operational_chunk(restaurant, detailed_data)
            chunks.append(operational_chunk)
            
            # 3. Parking & Location chunk
            parking_chunk = self.create_parking_location_chunk(restaurant, detailed_data)
            chunks.append(parking_chunk)
            
            # 4. Review chunks (ALL reviews, smartly chunked)
            review_chunks = self.create_review_chunks(restaurant, detailed_data)
            chunks.extend(review_chunks)
            
            # 5. Features chunk
            features_chunk = self.create_features_chunk(restaurant, detailed_data)
            chunks.append(features_chunk)
            
            # Validate chunk sizes and log stats
            total_reviews = len(detailed_data.get('reviews', []))
            print(f"   📝 Created {len(chunks)} chunks ({len(review_chunks)} review chunks) for {total_reviews} reviews")
            
            for i, chunk in enumerate(chunks):
                token_count = self.count_tokens(chunk.page_content)
                if token_count > 900:
                    print(f"⚠️  Chunk {i+1} for {title} is {token_count} tokens (large)")
                    
            return chunks
            
        except Exception as e:
            print(f"❌ Error processing {title}: {e}")
            return []
            
    def upsert_documents(self, documents: List[Document], batch_size: int = 50):
        """Upsert documents to Pinecone in batches."""
        if not documents:
            return
            
        print(f"📤 Upserting {len(documents)} documents to Pinecone...")
        
        try:
            # Upsert in batches
            for i in range(0, len(documents), batch_size):
                batch = documents[i:i + batch_size]
                self.vector_store.add_documents(batch)
                print(f"✅ Upserted batch {i//batch_size + 1}/{(len(documents)-1)//batch_size + 1}")
                time.sleep(1)  # Rate limiting
                
        except Exception as e:
            print(f"❌ Error upserting documents: {e}")
            raise
            
    def run_pipeline(self, start_from: int = 0, limit: Optional[int] = None):
        """Run the complete vector upsert pipeline with checkpointing."""
        print("🚀 Starting ChowGPT Restaurant Vector Pipeline")
        print("=" * 60)
        
        start_time = time.time()
        
        try:
            # Setup
            self.create_or_get_index()
            
            # Fetch restaurant data
            restaurants = self.fetch_restaurant_data()
            
            # Apply start position and limit if specified
            if start_from > 0:
                restaurants = restaurants[start_from:]
                print(f"📍 Resuming from restaurant #{start_from + 1}")
                
            if limit:
                restaurants = restaurants[:limit]
                print(f"🔒 Processing limited to {limit} restaurants")
                
            total_restaurants = len(restaurants)
            
            print(f"\n📊 Processing {total_restaurants} restaurants...")
            print("=" * 60)
            
            all_documents = []
            processed_count = 0
            
            # Process each restaurant
            for i, restaurant in enumerate(restaurants, 1):
                actual_index = start_from + i  # Adjust for start position
                title = restaurant.get('title', f'Restaurant {actual_index}')
                print(f"🏪 [{actual_index:3d}] Processing: {title}")
                
                # Create chunks for this restaurant
                chunks = self.process_restaurant(restaurant)
                
                if chunks:
                    all_documents.extend(chunks)
                    processed_count += 1
                    print(f"   ✅ Created {len(chunks)} chunks ({len(all_documents)} total)")
                else:
                    print(f"   ⚠️  No chunks created")
                    
                # Progress update
                if i % 10 == 0:
                    elapsed = time.time() - start_time
                    avg_time = elapsed / i
                    remaining = (total_restaurants - i) * avg_time
                    print(f"\n📈 Progress: {i}/{total_restaurants} ({i/total_restaurants*100:.1f}%)")
                    print(f"⏱️  Elapsed: {elapsed/60:.1f}m, Estimated remaining: {remaining/60:.1f}m")
                    print("-" * 40)
                    
                # Upsert in batches of 50 restaurants (250 chunks)
                if len(all_documents) >= 250:
                    self.upsert_documents(all_documents)
                    all_documents = []
                    
            # Upsert remaining documents
            if all_documents:
                self.upsert_documents(all_documents)
                
            # Final statistics
            total_time = time.time() - start_time
                
            print("\n🎉 Pipeline Complete!")
            print("=" * 60)
            print(f"✅ Processed: {processed_count}/{len(restaurants)} restaurants")
            print(f"⏱️  Total time: {total_time/60:.1f} minutes")
            if processed_count > 0:
                print(f"📈 Average time per restaurant: {total_time/processed_count:.1f} seconds")
            print(f"🎯 Pinecone index: {self.index_name}")
            print(f"💾 ALL restaurant reviews included in vector database")
            print(f"📝 Smart chunking applied to keep tokens under 1000")
            
        except Exception as e:
            print(f"❌ Pipeline failed: {e}")
            raise

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='ChowGPT Restaurant Vector Pipeline')
    parser.add_argument('--start-from', type=int, default=0, 
                       help='Start processing from restaurant index (0-based)')
    parser.add_argument('--limit', type=int, default=None,
                       help='Limit number of restaurants to process')
    
    args = parser.parse_args()
    
    pipeline = RestaurantVectorPipeline()
    pipeline.run_pipeline(start_from=args.start_from, limit=args.limit) 