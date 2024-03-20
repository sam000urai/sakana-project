import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { db, auth } from '../plugins/firebase';
import { doc, getDoc, query, where, getDocs, collection } from 'firebase/firestore';
import { followUser, unfollowUser } from '@/models/authApplicationService';
import Link from 'next/link';

interface User {
    uid: string;
    displayName: string;
    email: string;
    photoUrl: string;
}

const UserSearchPage = () => {
    const [searchKeyword, setSearchKeyword] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [isFollowingMap, setIsFollowingMap] = useState<Record<string, boolean>>({});

    const currentUserId = auth.currentUser?.uid || '';

    const handleFollow = async (uid: string) => {
        try {
            await followUser(currentUserId, uid);
            setIsFollowingMap((prevMap) => ({ ...prevMap, [uid]: true }));
        } catch (error) {
            console.error("Error following user:", error);
        }
    };

    const handleUnfollow = async (uid: string) => {
        try {
            await unfollowUser(currentUserId, uid);
            setIsFollowingMap((prevMap) => ({ ...prevMap, [uid]: false }));
        } catch (error) {
            console.error("Error unfollowing user:", error);
        }
    };

    const handleSearch = async () => {
        try {
            const userRef = collection(db, 'users');

            // 1. キーワードの開始と終了の範囲を定義
            const startAtKeyword = searchKeyword;
            const endAtKeyword = searchKeyword + '\uf8ff';

            // 2. クエリを更新
            const q = query(userRef, where('displayName', '>=', startAtKeyword), where('displayName', '<=', endAtKeyword));
            const querySnapshot = await getDocs(q);
            const users: User[] = [];
            const newIsFollowingMap: Record<string, boolean> = {};

            for (const docSnapshot of querySnapshot.docs) {
                const user = docSnapshot.data() as User;
                users.push(user);

                // Check if the user is followed by the current user
                const followerRef = doc(db, 'users', user.uid, 'followers', currentUserId);
                const followerDoc = await getDoc(followerRef);
                newIsFollowingMap[user.uid] = followerDoc.exists();
            }

            setSearchResults(users);
            setIsFollowingMap(newIsFollowingMap); // Update the isFollowingMap state
        } catch (error) {
            console.error('ユーザー検索エラー:', error);
        }
    };

    return (
        <Layout>
            <div className="px-4 py-8 max-w-3xl mx-auto">
                <div className="mb-8">
                    <input
                        type="text"
                        placeholder="ユーザー名"
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring focus:ring-blue-200"
                    />
                    <button
                        onClick={handleSearch}
                        className="px-4 py-2 ml-2 mt-1 font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring focus:ring-blue-200"
                    >
                        検索
                    </button>
                </div>

                <div className="flex flex-col gap-4">
                    {searchResults.map((user) => {
                        const isFollowing = isFollowingMap[user.uid] || false;
                        return (
                            <div key={user.uid} className="w-full">
                                <Link href={`/${user.uid}`} className="block hover:bg-gray-100 p-2 rounded">
                                    <div className="flex items-center justify-between gap-4 p-4 border rounded-lg">
                                        {/* ユーザーの情報部分 */}
                                        <div className="flex items-center gap-4">
                                            {/* ユーザーの写真 */}
                                            <div className="flex-none">
                                                <img src={user.photoUrl} alt={user.displayName} className="w-12 h-12 rounded-full" />
                                            </div>

                                            {/* ユーザー名 */}
                                            <div className="flex-grow">
                                                <h3 className="text-lg mb-2">{user.displayName}</h3>
                                            </div>
                                        </div>

                                        {/* フォロー/フォロー解除ボタン */}
                                        <div>
                                            {currentUserId !== user.uid && !isFollowing && (
                                                <button onClick={() => handleFollow(user.uid)} className="edit-button">
                                                    フォロー
                                                </button>
                                            )}
                                            {currentUserId !== user.uid && isFollowing && (
                                                <button onClick={() => handleUnfollow(user.uid)} className="edit-button">
                                                    フォロー解除
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        );
                    })}
                </div>
            </div >
        </Layout >
    );
};

export default UserSearchPage;
