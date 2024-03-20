import {
    getAuth,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
} from "firebase/auth";
import { getApps, initializeApp } from 'firebase/app';
import { getFirestore, query, where, getDocs, doc, setDoc, collection, getDoc } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const apps = getApps();
let app = undefined;
if (!apps.length) {
    app = initializeApp(firebaseConfig);
}

export const auth = getAuth();
export const db = getFirestore();
export const storage = getStorage();
export const functions = getFunctions(app, 'asia-northeast1');
export const provider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        console.log('Google sign in success!!');

        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            const userData = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoUrl: user.photoURL,
                provider: "google.com",
            };
            await setDoc(userRef, userData);
            console.log('User added to Firestore');
        } else {
            console.log('User already exists in Firestore');
        }

        return 'success';
    } catch (error) {
        console.error("Error during Google sign in:", error);
        return 'failed';
    }
};

export const signInWithEmailPassword = async (email: string, password: string) => {
    try {
        await signInWithEmailAndPassword(auth, email, password);
        console.log('Email and password sign in success!!');
        return 'success';
    } catch (error) {
        console.error('Email and password sign in failed:', error);
        return 'failed';
    }
};

// createUser function
export const createUser = async (displayName: string, email: string, password: string) => {
    try {
        const db = getFirestore();
        const auth = getAuth();

        // If username is not taken, proceed to create user
        const result = await createUserWithEmailAndPassword(auth, email, password);
        const user = result.user;
        console.log('Email and password sign up success!!');

        // Save user info to Firestore
        const userRef = doc(db, 'users', user.uid);

        // Use a placeholder image URL as the default profile picture
        const defaultPhotoUrl = '../images/dokusho.png';
        await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: displayName,
            photoUrl: defaultPhotoUrl,  // set the default image URL here
            provider: "password",
        });

        return 'success';
    } catch (error: any) {
        console.error('Sign up failed:', error);
        return error.message || 'failed';
    }
};


export const updateUserProfile = async (uid: string, newDisplayName: any, newPhotoUrl: string) => {
    try {
        const userRef = doc(db, 'users', uid);
        await setDoc(userRef, {
            displayName: newDisplayName,
            photoUrl: newPhotoUrl
        }, { merge: true });
        console.log("User Profile Updated");
    } catch (error) {
        console.error("Error updating user profile: ", error);
    }
};
