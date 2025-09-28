from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import json
import os
from datetime import datetime
import logging
from typing import List, Dict, Optional
import threading
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Attend-II AI Face Recognition", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
face_encodings_db = {}
is_training = False
training_thread = None

# Directories
UPLOAD_DIR = "uploads"
DATASET_DIR = "dataset"

# Ensure directories exist
for directory in [UPLOAD_DIR, DATASET_DIR]:
    os.makedirs(directory, exist_ok=True)

# Data storage files
USERS_FILE = os.path.join(DATASET_DIR, "users.json")
ATTENDANCE_FILE = os.path.join(DATASET_DIR, "attendance.json")
ENCODINGS_FILE = os.path.join(DATASET_DIR, "face_encodings.json")

def load_json_file(file_path: str, default_data=None):
    """Load JSON file with error handling"""
    if default_data is None:
        default_data = []
    
    if not os.path.exists(file_path):
        with open(file_path, 'w') as f:
            json.dump(default_data, f)
        return default_data
    
    try:
        with open(file_path, 'r') as f:
            return json.load(f)
    except (json.JSONDecodeError, Exception) as e:
        logger.error(f"Error loading {file_path}: {e}")
        return default_data

def save_json_file(file_path: str, data):
    """Save JSON file with error handling"""
    try:
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2, default=str)
    except Exception as e:
        logger.error(f"Error saving {file_path}: {e}")

def extract_face_features(image_path: str) -> Optional[np.ndarray]:
    """Extract face features using OpenCV and basic image processing"""
    try:
        # Read image
        img = cv2.imread(image_path)
        if img is None:
            return None
        
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Detect faces
        faces = face_cascade.detectMultiScale(gray, 1.3, 5)
        
        if len(faces) == 0:
            logger.warning(f"No faces detected in {image_path}")
            return None
        
        # Use the first (largest) face
        (x, y, w, h) = faces[0]
        face = gray[y:y+h, x:x+w]
        
        # Resize to standard size (100x100)
        face_resized = cv2.resize(face, (100, 100))
        
        # Normalize pixel values
        face_normalized = face_resized.astype('float32') / 255.0
        
        # Create feature vector using multiple methods
        features = []
        
        # 1. Histogram features
        hist = cv2.calcHist([face_resized], [0], None, [256], [0, 256])
        features.extend(hist.flatten())
        
        # 2. LBP (Local Binary Pattern) features
        def lbp_features(image):
            lbp = np.zeros_like(image)
            for i in range(1, image.shape[0]-1):
                for j in range(1, image.shape[1]-1):
                    center = image[i, j]
                    code = 0
                    code |= (image[i-1, j-1] >= center) << 7
                    code |= (image[i-1, j] >= center) << 6
                    code |= (image[i-1, j+1] >= center) << 5
                    code |= (image[i, j+1] >= center) << 4
                    code |= (image[i+1, j+1] >= center) << 3
                    code |= (image[i+1, j] >= center) << 2
                    code |= (image[i+1, j-1] >= center) << 1
                    code |= (image[i, j-1] >= center) << 0
                    lbp[i, j] = code
            return lbp
        
        lbp = lbp_features(face_resized)
        lbp_hist = cv2.calcHist([lbp], [0], None, [256], [0, 256])
        features.extend(lbp_hist.flatten())
        
        # 3. Edge features
        edges = cv2.Canny(face_resized, 50, 150)
        edge_hist = cv2.calcHist([edges], [0], None, [256], [0, 256])
        features.extend(edge_hist.flatten())
        
        # Convert to numpy array and normalize
        feature_vector = np.array(features, dtype=np.float32)
        feature_vector = feature_vector / (np.linalg.norm(feature_vector) + 1e-7)
        
        return feature_vector
    
    except Exception as e:
        logger.error(f"Error extracting face features from {image_path}: {e}")
        return None

def cosine_similarity_simple(a, b):
    """Calculate cosine similarity between two vectors"""
    dot_product = np.dot(a, b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    
    if norm_a == 0 or norm_b == 0:
        return 0.0
    
    return dot_product / (norm_a * norm_b)

def train_model_async():
    """Train model using face encodings"""
    global face_encodings_db, is_training
    
    is_training = True
    logger.info("Starting model training...")
    
    try:
        users = load_json_file(USERS_FILE, [])
        
        if len(users) < 1:
            logger.warning("Need at least 1 user to train model")
            is_training = False
            return
        
        # Prepare training data
        encodings_db = {}
        
        for user in users:
            username = user['username']
            image_path = os.path.join(UPLOAD_DIR, f"{username}.jpg")
            
            if os.path.exists(image_path):
                face_features = extract_face_features(image_path)
                if face_features is not None:
                    encodings_db[username] = face_features.tolist()
                    logger.info(f"Extracted features for user: {username}")
        
        if len(encodings_db) < 1:
            logger.warning("Not enough valid face images for training")
            is_training = False
            return
        
        # Save encodings to file
        save_json_file(ENCODINGS_FILE, encodings_db)
        
        # Update global encodings database
        face_encodings_db = encodings_db
        
        logger.info(f"Model training completed with {len(encodings_db)} users!")
        
    except Exception as e:
        logger.error(f"Error during model training: {e}")
    finally:
        is_training = False

def load_trained_encodings():
    """Load pre-trained face encodings"""
    global face_encodings_db
    
    try:
        encodings_db = load_json_file(ENCODINGS_FILE, {})
        face_encodings_db = encodings_db
        logger.info(f"Loaded face encodings for {len(encodings_db)} users")
        return len(encodings_db) > 0
    except Exception as e:
        logger.error(f"Error loading face encodings: {e}")
    
    return False

def predict_face(face_features: np.ndarray) -> tuple:
    """Predict face using similarity comparison with stricter validation"""
    global face_encodings_db
    
    if not face_encodings_db:
        return None, 0.0
    
    try:
        best_match = None
        best_confidence = 0.0
        all_similarities = []
        
        # Compare with all stored encodings
        for username, stored_features in face_encodings_db.items():
            stored_array = np.array(stored_features)
            
            # Calculate cosine similarity
            similarity = cosine_similarity_simple(stored_array, face_features)
            all_similarities.append(similarity)
            
            if similarity > best_confidence:
                best_confidence = similarity
                best_match = username
        
        # Additional validation: Check if the best match is significantly better than others
        # Only apply this validation if confidence is below 90% to avoid rejecting high-confidence matches
        if len(all_similarities) > 1 and best_confidence < 0.90:
            all_similarities.sort(reverse=True)
            top_similarity = all_similarities[0]
            second_similarity = all_similarities[1] if len(all_similarities) > 1 else 0.0
            
            # If the difference between top two matches is too small, reject
            confidence_gap = top_similarity - second_similarity
            if confidence_gap < 0.03:  # Require at least 3% difference (less strict)
                logger.info(f"Ambiguous match: top={top_similarity:.3f}, second={second_similarity:.3f}, gap={confidence_gap:.3f}")
                return None, top_similarity
        
        # Log the prediction for debugging
        logger.info(f"Best match: {best_match} with confidence {best_confidence:.3f}")
        
        return best_match, float(best_confidence)
    
    except Exception as e:
        logger.error(f"Error predicting face: {e}")
        return None, 0.0

# Load existing encodings on startup
load_trained_encodings()
logger.info("Attend-II Face Recognition System initialized")

@app.get("/")
async def root():
    return {"message": "Attend-II AI Face Recognition System", "status": "active"}

@app.post("/register_user")
async def register_user(
    username: str = Form(...), 
    file: UploadFile = File(...),
    email: str = Form(None),
    department: str = Form(None),
    role: str = Form(None)
):
    """Register a new user with their face image and details"""
    try:
        # Validate input
        if not username.strip():
            raise HTTPException(status_code=400, detail="Username cannot be empty")
        
        username = username.strip().lower().replace(" ", "_")
        
        # Check if user already exists
        users = load_json_file(USERS_FILE, [])
        existing_usernames = [user['username'] for user in users]
        
        if username in existing_usernames:
            raise HTTPException(status_code=400, detail="User already exists")
        
        # Validate image file
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Save image
        image_path = os.path.join(UPLOAD_DIR, f"{username}.jpg")
        
        contents = await file.read()
        with open(image_path, "wb") as f:
            f.write(contents)
        
        # Validate face in image
        face_features = extract_face_features(image_path)
        if face_features is None:
            os.remove(image_path)  # Clean up
            raise HTTPException(status_code=400, detail="No face detected in the image. Please upload a clear face photo.")
        
        # Add user to database
        new_user = {
            "username": username,
            "registered_date": datetime.now().isoformat(),
            "image_path": image_path,
            "email": email if email else "",
            "department": department if department else "",
            "role": role if role else ""
        }
        
        users.append(new_user)
        save_json_file(USERS_FILE, users)
        
        # Start model retraining in background
        global training_thread
        if training_thread is None or not training_thread.is_alive():
            training_thread = threading.Thread(target=train_model_async)
            training_thread.start()
        
        logger.info(f"User {username} registered successfully")
        
        return {
            "message": f"User '{username}' registered successfully! AI model is retraining automatically.",
            "username": username,
            "total_users": len(users)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error registering user: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/recognize_face")
async def recognize_face(file: UploadFile = File(...)):
    """Recognize face and mark attendance"""
    global face_encodings_db
    
    try:
        # Check if model is trained
        if not face_encodings_db:
            raise HTTPException(status_code=400, detail="AI model not trained yet. Please register at least 1 user first.")
        
        if is_training:
            raise HTTPException(status_code=400, detail="Model is currently training. Please wait a moment.")
        
        # Save uploaded image temporarily
        temp_path = os.path.join(UPLOAD_DIR, "temp_recognition.jpg")
        contents = await file.read()
        
        with open(temp_path, "wb") as f:
            f.write(contents)
        
        # Extract face features
        face_features = extract_face_features(temp_path)
        
        # Clean up temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)
        
        if face_features is None:
            return {
                "status": "error",
                "message": "No face detected in the image. Please ensure your face is clearly visible."
            }
        
        # Predict user
        predicted_user, confidence = predict_face(face_features)
        
        # Confidence threshold for recognition
        confidence_threshold = 0.65  # 65% threshold for better user experience
        
        logger.info(f"Recognition attempt: user={predicted_user}, confidence={confidence:.3f}, threshold={confidence_threshold}")
        
        if predicted_user is None or confidence < confidence_threshold:
            return {
                "status": "unknown",
                "message": f"Face not recognized (confidence: {confidence:.1%}). Please register as a new student first.",
                "confidence": confidence
            }
        
        # Check if attendance already marked today
        attendance_records = load_json_file(ATTENDANCE_FILE, [])
        today = datetime.now().date().isoformat()
        
        today_attendance = [
            record for record in attendance_records 
            if record.get('username') == predicted_user and record.get('date') == today
        ]
        
        if today_attendance:
            # Format username for display (replace underscores with spaces and capitalize)
            display_name = predicted_user.replace('_', ' ').title()
            return {
                "status": "already_marked",
                "user": predicted_user,
                "message": f"Attendance already marked for {display_name} today!",
                "confidence": confidence
            }
        
        # Mark attendance
        attendance_record = {
            "username": predicted_user,
            "timestamp": datetime.now().isoformat(),
            "date": today,
            "confidence": confidence,
            "method": "face_recognition"
        }
        
        attendance_records.append(attendance_record)
        save_json_file(ATTENDANCE_FILE, attendance_records)
        
        logger.info(f"Attendance marked for {predicted_user} with {confidence:.1%} confidence")
        
        # Format username for display
        display_name = predicted_user.replace('_', ' ').title()
        
        return {
            "status": "success",
            "user": predicted_user,
            "message": f"Welcome {display_name}! Attendance marked successfully.",
            "confidence": confidence,
            "timestamp": attendance_record["timestamp"]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error recognizing face: {e}")
        raise HTTPException(status_code=500, detail="Face recognition failed")

@app.get("/users")
async def get_users():
    """Get all registered users"""
    users = load_json_file(USERS_FILE, [])
    return {"users": users, "total": len(users)}

@app.get("/attendance")
async def get_attendance():
    """Get all attendance records"""
    attendance_records = load_json_file(ATTENDANCE_FILE, [])
    return {"attendance": attendance_records, "total": len(attendance_records)}

@app.get("/attendance/today")
async def get_today_attendance():
    """Get today's attendance"""
    attendance_records = load_json_file(ATTENDANCE_FILE, [])
    today = datetime.now().date().isoformat()
    
    today_attendance = [
        record for record in attendance_records 
        if record.get('date') == today
    ]
    
    return {"attendance": today_attendance, "date": today, "total": len(today_attendance)}

@app.delete("/attendance/{username}")
async def remove_attendance(username: str, date: str = None):
    """Remove attendance record for a specific user and date"""
    try:
        username = username.lower().replace(" ", "_")
        
        # Load attendance records
        attendance_records = load_json_file(ATTENDANCE_FILE, [])
        original_count = len(attendance_records)
        
        # If no date specified, use today's date
        if not date:
            date = datetime.now().date().isoformat()
        
        # Filter out the specific attendance record
        updated_records = [
            record for record in attendance_records 
            if not (record.get('username') == username and record.get('date') == date)
        ]
        
        # Check if any record was removed
        removed_count = original_count - len(updated_records)
        
        if removed_count == 0:
            return {
                "message": f"No attendance record found for {username} on {date}",
                "removed": False,
                "date": date,
                "username": username
            }
        
        # Save updated records
        save_json_file(ATTENDANCE_FILE, updated_records)
        
        logger.info(f"Removed {removed_count} attendance record(s) for {username} on {date}")
        
        return {
            "message": f"Attendance record removed for {username} on {date}",
            "removed": True,
            "date": date,
            "username": username,
            "remaining_records": len(updated_records)
        }
        
    except Exception as e:
        logger.error(f"Error removing attendance: {e}")
        raise HTTPException(status_code=500, detail="Error removing attendance record")

@app.delete("/attendance/today/{username}")
async def remove_today_attendance(username: str):
    """Remove today's attendance record for a specific user"""
    try:
        username = username.lower().replace(" ", "_")
        today = datetime.now().date().isoformat()
        
        # Load attendance records
        attendance_records = load_json_file(ATTENDANCE_FILE, [])
        original_count = len(attendance_records)
        
        # Filter out today's attendance for the user
        updated_records = [
            record for record in attendance_records 
            if not (record.get('username') == username and record.get('date') == today)
        ]
        
        # Check if any record was removed
        removed_count = original_count - len(updated_records)
        
        if removed_count == 0:
            return {
                "message": f"No attendance record found for {username} today",
                "removed": False,
                "date": today,
                "username": username
            }
        
        # Save updated records
        save_json_file(ATTENDANCE_FILE, updated_records)
        
        logger.info(f"Removed today's attendance for {username}")
        
        return {
            "message": f"Today's attendance removed for {username}",
            "removed": True,
            "date": today,
            "username": username,
            "remaining_records": len(updated_records)
        }
        
    except Exception as e:
        logger.error(f"Error removing today's attendance: {e}")
        raise HTTPException(status_code=500, detail="Error removing attendance record")

@app.delete("/attendance/all/{username}")
async def remove_all_attendance(username: str):
    """Remove all attendance records for a specific user"""
    try:
        username = username.lower().replace(" ", "_")
        
        # Load attendance records
        attendance_records = load_json_file(ATTENDANCE_FILE, [])
        original_count = len(attendance_records)
        
        # Filter out all attendance records for the user
        updated_records = [
            record for record in attendance_records 
            if record.get('username') != username
        ]
        
        # Check if any records were removed
        removed_count = original_count - len(updated_records)
        
        if removed_count == 0:
            return {
                "message": f"No attendance records found for {username}",
                "removed": False,
                "username": username,
                "removed_count": 0
            }
        
        # Save updated records
        save_json_file(ATTENDANCE_FILE, updated_records)
        
        logger.info(f"Removed all {removed_count} attendance records for {username}")
        
        return {
            "message": f"All attendance records removed for {username}",
            "removed": True,
            "username": username,
            "removed_count": removed_count,
            "remaining_records": len(updated_records)
        }
        
    except Exception as e:
        logger.error(f"Error removing all attendance records: {e}")
        raise HTTPException(status_code=500, detail="Error removing attendance records")

@app.get("/user/{username}")
async def get_user_details(username: str):
    """Get detailed information about a specific user"""
    try:
        username = username.lower().replace(" ", "_")
        
        # Get user info
        users = load_json_file(USERS_FILE, [])
        user_info = next((user for user in users if user['username'] == username), None)
        
        if not user_info:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get user's attendance records
        attendance_records = load_json_file(ATTENDANCE_FILE, [])
        user_attendance = [
            record for record in attendance_records 
            if record.get('username') == username
        ]
        
        # Calculate attendance statistics
        total_days = len(set(record.get('date') for record in user_attendance))
        latest_attendance = max(user_attendance, key=lambda x: x.get('timestamp', ''), default=None)
        
        # Check if image file exists
        image_path = os.path.join(UPLOAD_DIR, f"{username}.jpg")
        has_image = os.path.exists(image_path)
        
        return {
            "username": username,
            "display_name": username.replace('_', ' ').title(),
            "registered_date": user_info.get('registered_date'),
            "email": user_info.get('email', ''),
            "department": user_info.get('department', ''),
            "role": user_info.get('role', ''),
            "total_attendance_days": total_days,
            "total_attendance_records": len(user_attendance),
            "latest_attendance": latest_attendance.get('date') if latest_attendance else None,
            "has_image": has_image,
            "attendance_records": user_attendance[-10:]  # Last 10 records
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user details: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving user details")

@app.get("/users/detailed")
async def get_users_detailed():
    """Get detailed information about all users"""
    try:
        users = load_json_file(USERS_FILE, [])
        attendance_records = load_json_file(ATTENDANCE_FILE, [])
        
        detailed_users = []
        for user in users:
            username = user['username']
            
            # Get user's attendance count
            user_attendance = [
                record for record in attendance_records 
                if record.get('username') == username
            ]
            
            total_days = len(set(record.get('date') for record in user_attendance))
            latest_attendance = max(user_attendance, key=lambda x: x.get('timestamp', ''), default=None)
            
            # Check if image exists
            image_path = os.path.join(UPLOAD_DIR, f"{username}.jpg")
            
            detailed_users.append({
                "username": username,
                "display_name": username.replace('_', ' ').title(),
                "registered_date": user.get('registered_date'),
                "total_attendance_days": total_days,
                "total_attendance_records": len(user_attendance),
                "latest_attendance": latest_attendance.get('date') if latest_attendance else None,
                "latest_attendance_time": latest_attendance.get('timestamp') if latest_attendance else None,
                "has_image": os.path.exists(image_path)
            })
        
        return {
            "users": detailed_users,
            "total": len(detailed_users)
        }
        
    except Exception as e:
        logger.error(f"Error getting detailed users: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving users")

@app.delete("/user/{username}")
async def delete_user(username: str):
    """Delete a user and all their data"""
    try:
        username = username.lower().replace(" ", "_")
        
        # Check if user exists
        users = load_json_file(USERS_FILE, [])
        user_exists = any(user['username'] == username for user in users)
        
        if not user_exists:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Remove from users file
        users = [user for user in users if user['username'] != username]
        save_json_file(USERS_FILE, users)
        
        # Remove from face encodings
        global face_encodings_db
        if username in face_encodings_db:
            del face_encodings_db[username]
            # Save updated encodings
            save_json_file(ENCODINGS_FILE, face_encodings_db)
        
        # Remove image file
        image_path = os.path.join(UPLOAD_DIR, f"{username}.jpg")
        if os.path.exists(image_path):
            os.remove(image_path)
        
        # Remove all attendance records for this user
        attendance_records = load_json_file(ATTENDANCE_FILE, [])
        original_count = len(attendance_records)
        attendance_records = [
            record for record in attendance_records 
            if record.get('username') != username
        ]
        removed_attendance = original_count - len(attendance_records)
        save_json_file(ATTENDANCE_FILE, attendance_records)
        
        # Start model retraining if users remain
        if len(users) >= 1:
            global training_thread
            if training_thread is None or not training_thread.is_alive():
                training_thread = threading.Thread(target=train_model_async)
                training_thread.start()
        
        logger.info(f"Deleted user {username}, removed {removed_attendance} attendance records")
        
        return {
            "message": f"User {username.replace('_', ' ').title()} deleted successfully",
            "username": username,
            "remaining_users": len(users),
            "removed_attendance_records": removed_attendance,
            "retraining_started": len(users) >= 1
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting user: {e}")
        raise HTTPException(status_code=500, detail="Error deleting user")

@app.post("/retrain")
async def retrain_model():
    """Manually trigger model retraining"""
    global training_thread
    
    if is_training:
        return {"message": "Model is already training", "status": "training"}
    
    if training_thread is None or not training_thread.is_alive():
        training_thread = threading.Thread(target=train_model_async)
        training_thread.start()
        return {"message": "Model retraining started", "status": "started"}
    
    return {"message": "Training thread is still active", "status": "active"}

@app.get("/model_status")
async def get_model_status():
    """Get current model status"""
    users = load_json_file(USERS_FILE, [])
    
    return {
        "model_trained": len(face_encodings_db) > 0,
        "total_users": len(users),
        "training_in_progress": is_training,
        "last_trained": datetime.now().isoformat() if face_encodings_db else None,
        "min_users_required": 1
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)