import { initializeApp, getApps } from 'firebase/app';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Initialize Firebase (singleton pattern)
export function getFirebase() {
  if (getApps().length === 0) {
    return initializeApp(firebaseConfig);
  }
  return getApps()[0];
}

// Get Firebase Storage instance
export function getFirebaseStorage() {
  const app = getFirebase();
  return getStorage(app);
}

// Get Firebase Auth instance
export function getFirebaseAuth() {
  const app = getFirebase();
  return getAuth(app);
}

/**
 * Upload file to Firebase Storage with progress tracking
 * @param {File} file - File to upload
 * @param {string} path - Storage path (e.g., 'guards/123/documents/aadhaar/v1/file.pdf')
 * @param {function} onProgress - Progress callback (percentage)
 * @returns {Promise<string>} - Download URL
 */
export async function uploadFileToStorage(file, path, onProgress) {
  const storage = getFirebaseStorage();
  const storageRef = ref(storage, path);
  
  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) {
          onProgress(progress);
        }
      },
      (error) => {
        console.error('Upload error:', error);
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (error) {
          reject(error);
        }
      }
    );
  });
}

/**
 * Delete file from Firebase Storage
 * @param {string} path - Storage path
 * @returns {Promise<void>}
 */
export async function deleteFileFromStorage(path) {
  const storage = getFirebaseStorage();
  const storageRef = ref(storage, path);
  
  try {
    await deleteObject(storageRef);
    return true;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
}

export default {
  getFirebase,
  getFirebaseStorage,
  getFirebaseAuth,
  uploadFileToStorage,
  deleteFileFromStorage,
};
