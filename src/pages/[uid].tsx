import Layout from '@/components/Layout';
import { onAuthStateChanged } from 'firebase/auth';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    query,
    where,
} from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { useRouter } from 'next/router';
import React, { FC, useEffect, useState } from 'react';
import { auth, db, updateUserProfile } from '../plugins/firebase';
import { followUser, unfollowUser } from '@/models/authApplicationService';
import Link from 'next/link';

interface User {
    uid: string;
    displayName: string;
    photoUrl: string;
    username: string;
    email: string;
}

const useFollowData = (userUID: string) => {
    const [following, setFollowing] = useState<string[]>([]);
    const [followers, setFollowers] = useState<string[]>([]);


    useEffect(() => {
        const fetchFollowData = async () => {
            try {
                const followingDocs = await getDocs(
                    collection(db, 'users', userUID, 'following')
                );
                const followersDocs = await getDocs(
                    collection(db, 'users', userUID, 'followers')
                );
                setFollowing(followingDocs.docs.map((doc) => doc.id));
                setFollowers(followersDocs.docs.map((doc) => doc.id));
            } catch (error) {
                console.error('Error fetching follow data: ', error);
            }
        };

        fetchFollowData();
    }, [userUID]);

    return { following, followers };
};

const useUserData = (userUID: string[]) => {
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const userDocs = await Promise.all(
                    userUID.map((id) => getDoc(doc(db, 'users', id)))
                );
                setUsers(
                    userDocs.map(
                        (doc) => ({ id: doc.id, ...doc.data() } as unknown as User)
                    )
                );
            } catch (error) {
                console.error('Error fetching user data: ', error);
            }
        };

        fetchUsers();
    }, [userUID]);

    return users;
};

const UserProfilePage: FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [displayName, setDisplayName] = useState<string>('');
    const [photoUrl, setPhotoUrl] = useState<string>('');
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [shelfBooks, setShelfBooks] = useState<any[]>([]); // 本のデータを保持するステート
    const [selectedBooks, setSelectedBooks] = useState<{ [key: string]: boolean; }>({});
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [showCheckboxes, setShowCheckboxes] = useState(false);
    const [isUserListModalOpen, setIsUserListModalOpen] = useState(false);
    const [usersToShowInModal, setUsersToShowInModal] = useState<User[]>([]);
    const [followingUsersData, setFollowingUsersData] = useState<User[]>([]);
    const [followersUsersData, setFollowersUsersData] = useState<User[]>([]);
    const [modalHeaderText, setModalHeaderText] = useState(''); // モーダルのヘッダーテキストを保持するステート
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isFollowing, setIsFollowing] = useState<boolean>(false);
    const [openBookLists, setOpenBookLists] = useState<any[]>([]);
    const [visibleBooksCount, setVisibleBooksCount] = useState<number>(16);


    const router = useRouter();
    // パスパラメータから値を取得
    const { uid } = router.query;

    const currentUserId = auth.currentUser?.uid || '';
    const isEditable = uid === currentUserId;

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const userQuerySnapshot = await getDoc(
                    doc(db, 'users', String(uid))
                );
                // If a user is found, update the state
                console.log('User data:', userQuerySnapshot.data()); // dataを直接確認

                if (userQuerySnapshot.exists()) {
                    setUser({
                        uid: String(uid),
                        ...userQuerySnapshot.data(),
                    } as User);
                } else {
                }
            } catch (error) {
                // Handle error (e.g., show error message to user or log error)
                console.error('Error fetching user:', error);
            }
        };

        if (uid) {
            fetchUser();
        }
    }, [uid]);

    useEffect(() => {
        const checkFollowingStatus = async () => {
            try {
                // Check if a document for the current user exists in the followers subcollection
                const followerRef = doc(db, 'users', String(uid), 'followers', currentUserId);
                const followerDoc = await getDoc(followerRef);

                // Set isFollowing based on the existence of the document
                setIsFollowing(followerDoc.exists());
            } catch (error) {
                console.error('Error checking following status:', error);
                setIsFollowing(false);
            }
        };

        if (uid && currentUserId) {
            checkFollowingStatus();
        }
    }, [uid, currentUserId]);


    const fetchUser = async () => {
        const currentUser = auth.currentUser;
        if (currentUser) {
            try {
                const userRef = doc(db, 'users', String(uid));
                const userDoc = await getDoc(userRef);

                if (userDoc.exists()) {
                    const userData = {
                        uid: userDoc.id,
                        ...userDoc.data(),
                    } as User;
                    console.log("userData: ", userData); // Add this line

                    setUser(userData);
                    setDisplayName(userData.displayName || '');
                    setPhotoUrl(userData.photoUrl || '');

                    console.log('Updated state:', userData, displayName, photoUrl);
                }
            } catch (error) {
                console.error('Error fetching user: ', error);
            }
        }
    };

    const fetchShelfBooks = () => {
        try {
            // userがnullでなければ本棚のデータを取得
            if (user && uid) {
                const shelfBooksRef = collection(db, 'shelves', String(uid), 'books');
                const shelfBooksQuery = query(
                    shelfBooksRef,
                    where('status', '==', 'reading')
                ); // statusが'reading'の本だけを取得

                // データが変更されるたびにこのコールバックが実行されます
                const unsubscribe = onSnapshot(shelfBooksQuery, (querySnapshot) => {
                    const booksData = querySnapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    }));
                    setShelfBooks(booksData); // 取得したデータをステートにセット
                });

                // クリーンアップ関数を返すことで、コンポーネントのアンマウント時にリッスンを停止します
                return unsubscribe;
            }
        } catch (error) {
            console.error('Error fetching books: ', error);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                fetchUser();
            } else {
                setUser(null);
            }
        });

        // クリーンアップ関数
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        // ユーザーデータと一緒に本のデータもフェッチします。
        const unsubscribeBooks = fetchShelfBooks();

        // クリーンアップ関数を返すことで、コンポーネントのアンマウント時にリッスンを停止します
        return () => {
            if (unsubscribeBooks) {
                unsubscribeBooks();
            }
        };
    }, [user]); // userを依存配列に追加して、userが変更されたときにフェッチを再実行します

    useEffect(() => {
        fetchUser();
        fetchShelfBooks(); // ユーザーデータと一緒に本のデータもフェッチします。
    }, []); // Dependency array is empty to run only on mount

    const handleUpdateProfile = async () => {
        if (user) {
            try {
                await updateUserProfile(user.uid, displayName, photoUrl);
                alert('Profile updated!');
                setIsEditing(false);
                fetchUser();
            } catch (error) {
                console.error('Error updating profile:', error);
                alert('Failed to update profile. Please try again later.');
            }
        }
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        try {
            // 1. Fileをimg要素として読み込む
            const image = new Image();
            image.src = URL.createObjectURL(file);
            image.onload = () => {
                // 2. 画像をcanvas要素を使用してリサイズ
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 500; // ここで最大の幅を指定します
                const MAX_HEIGHT = 500; // ここで最大の高さを指定します
                let width = image.width;
                let height = image.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(image, 0, 0, width, height);

                // 3. リサイズした画像をBlobとして取得し、それをアップロードする
                canvas.toBlob(async (blob) => {
                    if (blob && user) {
                        // Get a reference to the storage service
                        const storage = getStorage();
                        const storageRef = ref(
                            storage,
                            `profilePics/${user.uid}/profilePic`
                        );

                        // Upload the blob to Firebase Storage
                        await uploadBytes(storageRef, blob);

                        // 画像のURLを取得し、状態を更新することでUIを更新します
                        const downloadURL = await getDownloadURL(storageRef);
                        setPhotoUrl(downloadURL);
                    }
                }, 'image/jpeg');
            };
        } catch (error) {
            console.error('Error resizing/uploading image: ', error);
            alert('Failed to upload image. Please try again later.');
        }
    };

    const [isModalOpen, setIsModalOpen] = useState(false);

    const toggleModal = () => {
        setIsModalOpen(!isModalOpen);
    };

    const { following, followers } = useFollowData(user?.uid || '');
    const followingUsers = useUserData(following);
    const followerUsers = useUserData(followers);

    const handleFollowingClick = () => {
        setIsUserListModalOpen(true); // モーダルをオープン
        setUsersToShowInModal(followingUsers); // フォロー中のユーザーデータをモーダルにセット
        setModalHeaderText('フォロー中'); // モーダルのヘッダーテキストをセット
    };

    const handleFollowersClick = () => {
        setIsUserListModalOpen(true); // モーダルをオープン
        setUsersToShowInModal(followerUsers); // フォロワーのユーザーデータをモーダルにセット
        setModalHeaderText('フォロワー'); // モーダルのヘッダーテキストをセット
    };

    useEffect(() => {
        const fetchFollowingAndFollowers = async () => {
            try {
                let followingData: any[] = [];
                let followersData: any[] = [];

                // following および followers が空でないことを確認
                if (following.length > 0) {
                    const followingQuerySnapshot = await getDocs(
                        query(collection(db, 'users'), where('uid', 'in', following))
                    );
                    followingData = followingQuerySnapshot.docs.map((doc) => ({
                        uid: doc.id,
                        ...doc.data(),
                    }));
                }

                if (followers.length > 0) {
                    const followersQuerySnapshot = await getDocs(
                        query(collection(db, 'users'), where('uid', 'in', followers))
                    );
                    followersData = followersQuerySnapshot.docs.map((doc) => ({
                        uid: doc.id,
                        ...doc.data(),
                    }));
                }

                setFollowingUsersData(followingData);
                setFollowersUsersData(followersData);
            } catch (error) {
                console.error('Error fetching following and followers data:', error);
            }
        };

        fetchFollowingAndFollowers();
    }, [following, followers]);

    const handleFollow = async () => {
        try {
            await followUser(currentUserId, String(uid)); // uidをStringにキャストしています。
            setIsFollowing(true);
        } catch (error) {
            console.error("Error following user:", error);
        }
    };

    const handleUnfollow = async () => {
        try {
            await unfollowUser(currentUserId, String(uid));
            setIsFollowing(false);
        } catch (error) {
            console.error("Error unfollowing user:", error);
        }
    };

    //ブックリストを取得する関数を作成
    const fetchOpenBookLists = async (currentUserId: string) => {
        try {
            const bookListsRef = collection(db, 'booklists', String(uid), 'userBooklists');

            const openBookListsQuery = query(
                bookListsRef,
                where('status', '==', 'open'),
            ); // statusが'open'のブックリストだけを取得
            const bookListsSnapshot = await getDocs(openBookListsQuery);
            console.log("Number of documents:", bookListsSnapshot.size);
            return bookListsSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
        } catch (error) {
            console.error('Error fetching open book lists: ', error);
            return [];
        }
    };

    useEffect(() => {
        if (user?.uid) {
            fetchOpenBookLists(user.uid).then((bookLists) => setOpenBookLists(bookLists));
        }
    }, [user]);


    return (
        <Layout>
            {user ? (
                <div className="profile-container">
                    <div className="profile-header">
                        {!isEditing ? (
                            <>
                                <div className="profile-info">
                                    {user.photoUrl && (
                                        <img
                                            src={user.photoUrl}
                                            alt={`${user.displayName}'s profile`}
                                            className="profile-image"
                                        />
                                    )}
                                    <h2 className="display-name">{user.displayName}</h2>
                                    {/* 編集ボタンは isEditable が true の時だけ表示 */}
                                    {isEditable && (
                                        <button onClick={toggleModal} className="edit-button">
                                            プロフィールを編集
                                        </button>
                                    )}
                                    {/* フォローボタンは isEditable が false かつフォローしていない時だけ表示 */}
                                    {!isEditable && !isFollowing && (
                                        <button onClick={handleFollow} className="edit-button">
                                            フォロー
                                        </button>
                                    )}
                                    {/* フォロー解除ボタンは isEditable が false かつフォローしている時だけ表示 */}
                                    {!isEditable && isFollowing && (
                                        <button onClick={handleUnfollow} className="edit-button">
                                            フォロー解除
                                        </button>
                                    )}
                                </div>

                                <div className="follow-info">
                                    <div
                                        className="following"
                                        onClick={handleFollowingClick}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <h3>フォロー中: {following.length}</h3>{' '}
                                        {/* Followingの数を表示 */}
                                    </div>
                                    <div
                                        className="followers"
                                        onClick={handleFollowersClick}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <h3>フォロワー: {followers.length}</h3>{' '}
                                        {/* Followersの数を表示 */}
                                    </div>
                                </div>
                            </>
                        ) : null}
                    </div>

                    {isModalOpen && (
                        <div className="modal">
                            <div className="modal-content">
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    className="display-name-input"
                                />
                                {photoUrl && (
                                    <img
                                        src={photoUrl}
                                        alt={`${displayName}'s profile`}
                                        onClick={() =>
                                            document.getElementById('fileInput')?.click()
                                        }
                                    />
                                )}
                                <input
                                    type="file"
                                    id="fileInput"
                                    style={{ display: 'none' }}
                                    onChange={handleImageChange}
                                />
                                <button onClick={toggleModal} className="cancel-button">
                                    キャンセル
                                </button>
                                <button
                                    onClick={() => {
                                        handleUpdateProfile();
                                        toggleModal();
                                    }}
                                    className="save-button"
                                >
                                    保存する
                                </button>
                            </div>
                        </div>
                    )}

                    {isUserListModalOpen && (
                        <div className="modal">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h2>{modalHeaderText}</h2>
                                    <button onClick={() => setIsUserListModalOpen(false)}>Close</button>
                                </div>

                                <ul>
                                    {usersToShowInModal.map((u) => (
                                        <Link key={u.uid} href={`/${u.uid}`} legacyBehavior>
                                            <a
                                                onClick={() => setIsUserListModalOpen(false)}
                                                style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}
                                            >
                                                <img
                                                    src={u.photoUrl}
                                                    alt={`${u.displayName}'s profile`}
                                                    className="profile-image-modal"
                                                />
                                                {u.displayName}
                                            </a>
                                        </Link>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    <h2 className="shelf-title">{user.displayName}の本棚</h2>
                    <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-10 xl:grid-cols-5 gap-4">
                        {shelfBooks
                            .slice(0, visibleBooksCount) // sliceを使用して表示する本の数を制限
                            .filter((book) => {
                                if (selectedCategory === null) {
                                    return true;
                                } else {
                                    return book.booksGenreId.startsWith(selectedCategory);
                                }
                            })
                            .map((book, index) => (
                                <div
                                    key={index}
                                    className="book-container centered-content-container"
                                >
                                    <input
                                        checked={!!selectedBooks[book.id]}
                                        onChange={(e) => {
                                            setSelectedBooks({
                                                ...selectedBooks,
                                                [book.id]: e.target.checked,
                                            });
                                        }}
                                        style={{ display: showCheckboxes ? 'inline' : 'none' }}
                                    />
                                    <div
                                        className={`text-lg font-semibold cursor-pointer ${selectedCategory === book.booksGenreId
                                            ? 'text-blue-500'
                                            : 'text-black'
                                            }`}
                                        onClick={() => book}
                                    >
                                        <a href={book.itemUrl} target="_blank" rel="noopener noreferrer">
                                            <img
                                                alt={book.title}
                                                src={book.largeImageUrl}
                                                className="h-auto max-h-48"
                                            />
                                        </a>
                                    </div>
                                </div>
                            ))}
                    </div>


                    {shelfBooks.length > visibleBooksCount && (
                        <div className="text-center mt-4"> {/* ボタンを中央に配置し、上部にマージンを追加 */}
                            <button onClick={() => setVisibleBooksCount(prevCount => prevCount + 100)} className="edit-button">
                                更に表示
                            </button>
                        </div>
                    )}

                    <div>
                        <h2 className="booklist-title mb-4">{user?.displayName}の公開ブックリスト</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {openBookLists.map((bookList) => (
                                <Link href={`/booklists/${bookList.id}`} key={bookList.id}>
                                    <div className="border rounded-xl p-4 bg-white shadow-md hover:bg-gray-100 transition ease-in-out duration-200">
                                        <h3 className="text-xl font-semibold">{bookList.name}</h3>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>


                </div>
            ) : (
                <p>Loading...</p>
            )}
        </Layout>
    );
};

export default UserProfilePage;