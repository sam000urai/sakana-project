import { db } from '../plugins/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from "firebase/firestore";

// ユーザーをフォローする
export const followUser = async (currentUserId: string, userIdToFollow: string) => {
    try {
        // Update the following list of the current user
        const currentUserRef = doc(db, 'users', currentUserId);
        await updateDoc(currentUserRef, {
            following: arrayUnion(userIdToFollow)
        });

        // Update the followers list of the user being followed
        const userToFollowRef = doc(db, 'users', userIdToFollow);
        await updateDoc(userToFollowRef, {
            followers: arrayUnion(currentUserId)
        });

        console.log("User followed");
    } catch (error) {
        console.error("Error following user: ", error);
    }
};


// ユーザーのフォロワーを取得する
export const getFollowers = async (userId: string) => {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            return userDoc.data().followers || []; // followersフィールドが存在しない場合は空の配列を返す
        } else {
            console.error("User does not exist");
            return [];
        }
    } catch (error) {
        console.error("Error getting followers: ", error);
        return [];
    }
};

// ユーザーのフォローを解除する
export const unfollowUser = async (currentUserId: string, userIdToUnfollow: string) => {
    try {
        const userRef = doc(db, 'users', currentUserId);

        await updateDoc(userRef, {
            following: arrayRemove(userIdToUnfollow) // フォローしているユーザーIDの配列からIDを削除
        });

        console.log("User unfollowed");
    } catch (error) {
        console.error("Error unfollowing user: ", error);
    }
};
