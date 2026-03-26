import firebase_admin
from firebase_admin import credentials, storage
import os
from pathlib import Path

# Firebase Admin SDK initialization
# This will be initialized when firebase-admin.json is provided
firebase_app = None
storage_bucket = None

def initialize_firebase():
    """Initialize Firebase Admin SDK with service account credentials"""
    global firebase_app, storage_bucket
    
    if firebase_app is not None:
        return firebase_app
    
    try:
        # Path to service account JSON file
        cred_path = Path(__file__).parent / 'firebase-admin.json'
        
        if not cred_path.exists():
            print("⚠️  Firebase credentials not found. Document upload will not work.")
            print("   Please add firebase-admin.json to /app/backend/")
            return None
        
        # Initialize Firebase Admin SDK
        cred = credentials.Certificate(str(cred_path))
        
        # Get storage bucket from environment or use default
        bucket_name = os.environ.get('FIREBASE_STORAGE_BUCKET')
        
        firebase_app = firebase_admin.initialize_app(cred, {
            'storageBucket': bucket_name
        })
        
        # Get storage bucket
        storage_bucket = storage.bucket()
        
        print("✅ Firebase Admin SDK initialized successfully")
        return firebase_app
        
    except Exception as e:
        print(f"❌ Firebase initialization failed: {str(e)}")
        return None

def get_storage_bucket():
    """Get Firebase Storage bucket instance"""
    if firebase_app is None:
        initialize_firebase()
    return storage_bucket

def upload_file_to_firebase(file_data: bytes, file_path: str, content_type: str = 'application/octet-stream') -> str:
    """Upload file to Firebase Storage and return public URL
    
    Args:
        file_data: File content as bytes
        file_path: Path in Firebase Storage (e.g., 'guards/123/documents/aadhaar/v1/file.pdf')
        content_type: MIME type of the file
    
    Returns:
        Public URL of the uploaded file
    """
    bucket = get_storage_bucket()
    
    if bucket is None:
        raise Exception("Firebase Storage not initialized. Please configure firebase-admin.json")
    
    # Create blob and upload
    blob = bucket.blob(file_path)
    blob.upload_from_string(file_data, content_type=content_type)
    
    # Make the blob publicly accessible (you can modify this for authenticated access)
    blob.make_public()
    
    return blob.public_url

def delete_file_from_firebase(file_path: str) -> bool:
    """Delete file from Firebase Storage
    
    Args:
        file_path: Path in Firebase Storage
    
    Returns:
        True if deleted successfully, False otherwise
    """
    bucket = get_storage_bucket()
    
    if bucket is None:
        return False
    
    try:
        blob = bucket.blob(file_path)
        blob.delete()
        return True
    except Exception as e:
        print(f"Error deleting file: {str(e)}")
        return False
