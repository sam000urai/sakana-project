import { GoogleAuthProvider, getAuth, sendPasswordResetEmail, signInWithPopup, signOut } from 'firebase/auth';
import { auth, provider, db } from '../plugins/firebase';
import { getDocs, getDoc, collection, query, where, addDoc, doc, deleteDoc, updateDoc, runTransaction, setDoc } from 'firebase/firestore';

export class AuthRepository {
    async googleLogin() {
        try {
            const auth = getAuth();
            const result = await signInWithPopup(auth, provider);
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const user = result.user;
            return user; // ユーザーオブジェクトを返す
        } catch (error) {
            console.error('Googleログインエラー:', error);
            throw error;
        }
    }

    async logout() {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('ログアウトエラー:', error);
            throw error;
        }
    }

    async resetPassword(email: string) {
        return new Promise(async (resolve, reject) => {
            try {
                const res = await sendPasswordResetEmail(auth, email)
                resolve(res)
            } catch (error: any) {
                console.log("🚀 ~ file: userRepository.ts:81 ~ UserRepository ~ resetPassword ~ error", error.code)
                reject(error.code)
            }
        });
    }



}