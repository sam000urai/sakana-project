import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { siteConfig } from '../../site.config';
import { auth, db } from '../plugins/firebase';
import { signOut, getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from 'firebase/firestore';

const CustomNavbar = () => {
    const router = useRouter();
    const [currentUserDisplayName, setCurrentUserDisplayName] = useState<string | null>(null);
    const [photoURL, setPhotoURL] = useState<string | null>(null);
    const [isLogin, setIsLogin] = useState<boolean>(false)
    const [isOpen, setIsOpen] = useState(false);
    const [uid, setUid] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                // 現在の認証ユーザーを取得
                const currentUser = auth.currentUser;

                if (currentUser) {
                    // Firestoreからユーザーデータを取得
                    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));

                    if (userDoc.exists()) {
                        // ユーザーデータからdisplayNameとphotoURLを取得してステートをセット
                        const userData = userDoc.data();
                        setUid(userData.uid);
                        setCurrentUserDisplayName(userData.displayName);
                        setPhotoURL(userData.photoUrl); // photoURLをステートにセット
                    } else {
                        console.error('No user found in Firestore with UID:', currentUser.uid);
                    }
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };

        fetchUserData();
    }, []);


    // 認証状態の変更を監視
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            console.log("User Data: ", user, "user.photoURL"); // ログを出力
            if (user) {
                setIsLogin(true)
                setCurrentUserDisplayName(currentUserDisplayName === "" ? user.displayName : currentUserDisplayName);
                setPhotoURL(user.photoURL);
            }
        });

        return () => {
            unsubscribe();
        };
    }, []);


    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push('/login');
        } catch (error) {
            console.error('ログアウトエラー:', error);
        }
    };

    const handleBlur = (event: any) => {
        // currentTarget はイベントハンドラがアタッチされている要素 (ここでは div)
        // relatedTarget はフォーカスが移動した先の要素
        if (!event.currentTarget.contains(event.relatedTarget)) {
            setIsOpen(false); // フォーカスが外れたらメニューを閉じる
        }
    };

    return (
        <nav className="relative flex flex-col sm:flex-row items-center justify-between py-3 text-white bg-blue-500 focus:text-gray-700 navbar navbar-expand-lg navbar-light w-screen">
            <div className="w-full container-fluid flex items-center justify-between px-6">
                {/* 左上の要素 */}
                <div>
                    <Link href="/" className="text-black-500 hover:text-gray-600">
                        <span className="text-lg sm:text-xl">{siteConfig.title}</span>
                    </Link>
                </div>
                {/* 右上の要素 */}
                <div className="hidden sm:flex items-center space-x-4">
                    <div className="bg-grey-light rounded-md flex items-center space-x-4">

                        {/* ナビゲーションリンク */}
                        <ul className="flex space-x-4 sm:space-x-8 mt-4 sm:mt-0">
                            <li>
                                <Link href="/main" className="ml-2">
                                    <span className="text-sm sm:text-base">本棚</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/search" className="ml-2">
                                    <span className="text-sm sm:text-base">本の検索</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/usersearch" className="ml-2">
                                    <span className="text-sm sm:text-base">ユーザー検索</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/ranking" className="ml-2">
                                    <span className="text-sm sm:text-base">本のランキング</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="http://sakuttodokusho.com/" className="ml-2">
                                    <span className="text-sm sm:text-base">Sakudokuブログ</span>
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* モバイルビュー用ドロップダウン */}
                <div className="relative">
                    <button onClick={() => setIsOpen(!isOpen)}>
                        {/* ユーザー情報 */}
                        <div className="flex items-center ml-2 mt-4 sm:mt-0">
                            {photoURL && (
                                <img
                                    className="w-10 h-10 rounded-full"
                                    src={photoURL || "/images/sakudoku.png"}
                                    alt="Rounded avatar"
                                />
                            )}
                            <span className="ml-2">
                                {currentUserDisplayName && (
                                    <p className="text-sm sm:text-base">{currentUserDisplayName}</p>
                                )}
                            </span>
                        </div>
                    </button>
                    {isOpen && (
                        <div className="dropdown-menu absolute right-0 top-full mt-2">

                            {/* ドロップダウンメニューアイテム */}
                            <ul className="flex flex-col space-y-1 mt-4 sm:mt-0">
                                <li>
                                    <button
                                        onClick={() => router.push(`/${uid}`)}
                                        className="block w-full text-left py-2 px-4 hover:bg-gray-200"
                                    >
                                        <span className="text-sm sm:text-base">ホーム</span>
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => router.push('/main')}
                                        className="block w-full text-left py-2 px-4 hover:bg-gray-200"
                                    >
                                        <span className="text-sm sm:text-base">MY本棚</span>
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => router.push('/booklists/booklists')}
                                        className="block w-full text-left py-2 px-4 hover:bg-gray-200"
                                    >
                                        <span className="text-sm sm:text-base">MYブックリスト</span>
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => router.push('/booklists/favoritebooklists')}
                                        className="block w-full text-left py-2 px-4 hover:bg-gray-200"
                                    >
                                        <span className="text-sm sm:text-base">お気に入りブックリスト</span>
                                    </button>
                                </li>

                                <li>
                                    <button
                                        onClick={() => router.push('/search')}
                                        className="block w-full text-left py-2 px-4 hover:bg-gray-200"
                                    >
                                        <span className="text-sm sm:text-base">本の検索</span>
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => router.push('/usersearch')}
                                        className="block w-full text-left py-2 px-4 hover:bg-gray-200"
                                    >
                                        <span className="text-sm sm:text-base">ユーザー検索</span>
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => router.push('/ranking')}
                                        className="block w-full text-left py-2 px-4 hover:bg-gray-200"
                                    >
                                        <span className="text-sm sm:text-base">本のランキング</span>
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => router.push("http://sakuttodokusho.com")}
                                        className="w-full text-left px-4 py-2 hover:bg-gray-200 whitespace-nowrap"
                                    >
                                        <span className="text-sm sm:text-base">Sakudokuブログ</span>
                                    </button>
                                </li>
                                <li>
                                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 whitespace-nowrap">
                                        <span className="text-sm sm:text-base">{isLogin ? "ログアウト" : "ログイン"}</span>
                                    </button>
                                </li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </nav >
    );

};

export default CustomNavbar;