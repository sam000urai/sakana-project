import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { db, auth } from '../../plugins/firebase';
import { collectionGroup, deleteDoc, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth'; // onAuthStateChangedをインポート
import Layout from '@/components/Layout';


const BookListDetailPage = () => {
    const router = useRouter();
    const { uid } = router.query;
    const booklistId = router.query.booklistId;
    const [books, setBooks] = useState<Book[]>([]);
    const [currentUserUID, setCurrentUserUID] = useState<string | null>(null); // currentUserUIDステートの追加
    const [booklistTitle, setBooklistTitle] = useState<string>("");
    const [editingBookId, setEditingBookId] = useState<string | null>(null); // 編集中の本のIDを保持するステート
    const [tempItemUrl, setTempItemUrl] = useState<string>(""); // 一時的なitemUrlを保持するステート
    const isMobileDevice = () => {
        if (typeof window !== 'undefined') {
            return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        }
        return false;
    };
    const displayedBooks = isMobileDevice() ? books.slice(0, 5) : books; // モバイルの場合、最初の5冊のみをスライスします

    type Book = {
        largeImageUrl: string | undefined;
        id: string;
        title: string;
        itemUrl: string;
        // 他のプロパティもここに追加する
    };

    useEffect(() => {
        console.log("router.query:", router.query);
        if (router.isReady && uid && booklistId) {
            fetchBooks();
        }
    }, [router.isReady, currentUserUID, booklistId, uid]);


    useEffect(() => {
        // ユーザーの認証状態を監視
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUserUID(user.uid);
            }
        });

        return () => {
            unsubscribe();
        };
    }, []);


    useEffect(() => {
        fetchBooks();
    }, [currentUserUID, booklistId, uid]);

    const fetchBooks = async () => {
        console.log("currentUserUID:", currentUserUID);

        if (typeof booklistId === 'string') {
            try {
                // collectionGroupを使用してすべてのuserBooklistsドキュメントを取得
                const booklistsRef = collectionGroup(db, 'userBooklists');
                const booklistQuerySnapshot = await getDocs(booklistsRef);

                if (booklistQuerySnapshot.empty) {
                    console.log("No booklists found.");
                    return;
                }

                // フィルタリングをクライアント側で行う
                const booklistData = booklistQuerySnapshot.docs.find(doc => doc.id === booklistId);

                if (!booklistData) {
                    console.log("No matching booklist found.");
                    return;
                }

                const booklistOwnerUID = booklistData.data().uid;
                const booklistStatus = booklistData.data().status;

                // ログインしているユーザーがブックリストのオーナーである場合、またはブックリストのstatusがopenである場合
                if (currentUserUID === booklistOwnerUID || booklistStatus === 'open') {
                    setBooks(booklistData.data().books);
                    setBooklistTitle(booklistData.data().name);
                }
            } catch (error) {
                console.error("Error fetching the booklist:", error);
            }
        }
    };



    const handleEdit = (bookId: string, currentItemUrl: string) => {
        setEditingBookId(bookId);
        setTempItemUrl(currentItemUrl || ""); // 現在のitemUrlを一時的なステートにセット
    };

    const handleSave = async (bookId: string) => {
        if (currentUserUID) {
            if (typeof currentUserUID === 'string' && typeof booklistId === 'string') {

                const bookRef = doc(db, 'booklists', currentUserUID, 'userBooklists', bookId);
                await setDoc(bookRef, { itemUrl: tempItemUrl }, { merge: true });

                setBooks(prevBooks =>
                    prevBooks.map(book =>
                        book.id === bookId ? { ...book, itemUrl: tempItemUrl } : book
                    )
                );
                setEditingBookId(null);
            }
        }
    };

    const ShareButton = ({ onShare }: { onShare: () => void }) => {
        return (
            <button
                onClick={onShare}
                className="button-design">
                シェアする
            </button >
        );
    };

    const handleShare = () => {
        if (navigator.share && isMobileDevice()) {
            // Web Share APIをサポートしており、モバイルデバイスの場合
            navigator.share({
                title: booklistTitle + 'の本一覧',
                text: 'Check out this booklist!',
                url: window.location.href
            })
                .then(() => {
                    console.log('Successfully shared');
                })
                .catch(err => {
                    console.error('Error sharing:', err);
                });
        } else {
            // PCやWeb Share APIをサポートしていないデバイスの場合
            navigator.clipboard.writeText(window.location.href)
                .then(() => {
                    alert('ブックリストのURLがコピーされました!');
                })
                .catch(err => {
                    console.error('Failed to copy URL:', err);
                });
        }
    };

    const [isFavorited, setIsFavorited] = useState<boolean>(false);

    useEffect(() => {
        const checkFavorite = async () => {
            if (typeof currentUserUID === 'string' && typeof booklistId === 'string') {
                const favRef = doc(db, 'booklists', currentUserUID, 'favorites', booklistId);
                const favData = await getDoc(favRef);
                setIsFavorited(favData.exists());
            }
        };
        checkFavorite();
    }, [currentUserUID, booklistId]);



    const handleFavorite = async () => {
        if (typeof currentUserUID === 'string' && typeof booklistId === 'string') {
            // お気に入り用の参照を取得
            const favRef = doc(db, 'booklists', currentUserUID, 'favorites', booklistId);

            try {
                if (isFavorited) {
                    // すでにお気に入りに追加されていた場合は削除
                    await deleteDoc(favRef);
                    setIsFavorited(false);
                    console.log("Document deleted");
                    alert("お気に入りから削除されました！");
                } else {
                    // お気に入りに追加する前にオリジナルのブックリストのデータを取得
                    const booklistDocRef = doc(db, 'booklists', currentUserUID, 'userBooklists', booklistId);
                    const booklistSnapshot = await getDoc(booklistDocRef);
                    const booklistData = booklistSnapshot.data();

                    console.log("Booklist data:", booklistData);

                    if (booklistData) {
                        // オリジナルのブックリストのデータをお気に入りにセット
                        await setDoc(favRef, {
                            addedAt: new Date(), // 追加日時
                            name: booklistData.name, // ブックリストのタイトル
                            status: booklistData.status, // ステータス（あれば）
                            ownerUserUID: booklistData.uid // ブックリストの所有者のUID
                        });
                        setIsFavorited(true);
                        console.log("Document added");
                        alert("お気に入りに追加されました！");
                    } else {
                        // ブックリストのデータが取得できなかった場合のエラー処理
                        console.error("Failed to retrieve booklist data");
                        alert("ブックリストのデータの取得に失敗しました。");
                    }
                }
            } catch (error) {
                console.error("Error in handleFavorite:", error);
            }
        } else {
            console.log("currentUserUID or booklistId is missing or invalid");
        }
    };


    return (
        <Layout>
            <div className="flex flex-col items-center min-h-screen py-2 relative">
                <h2 className="text-4xl font-bold mb-8 mt-10">{booklistTitle}の本一覧</h2>
                <div className="grid grid-cols-4 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4">
                    {displayedBooks.map(book => (
                        <div key={book.id} className="m-4">
                            <img
                                alt={book.title}
                                src={book.largeImageUrl}
                                className="h-auto sm:max-h-32 md:max-h-48"
                            />
                        </div>
                    ))}
                </div>
                <div className="flex gap-4 mt-4"> {/* flex コンテナを追加し、ボタンの間隔を設定 */}
                    <ShareButton onShare={handleShare} />
                    <button onClick={handleFavorite} className="button-design">
                        {isFavorited ? 'お気に入りから削除' : 'お気に入りに追加'}
                    </button>
                </div>
            </div>
        </Layout>
    );
};

export default BookListDetailPage;
