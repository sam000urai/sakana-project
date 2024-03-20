import { useEffect, useState } from 'react';
import { db, auth } from '../../plugins/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';
import Layout from '@/components/Layout';

const BookListsPage = () => {
    const [booklists, setBooklists] = useState<{ status: string; id: string, name: string }[]>([]);
    const [currentUserUID, setCurrentUserUID] = useState<string | null>(null);
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectedBooklists, setSelectedBooklists] = useState<string[]>([]);

    useEffect(() => {
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
        const fetchBooklists = async () => {
            if (currentUserUID) {
                const booklistsRef = collection(db, 'booklists', currentUserUID, 'userBooklists');
                const booklistsData = await getDocs(booklistsRef);
                const fetchedBooklists = booklistsData.docs.map(doc => ({
                    id: doc.id,
                    name: doc.data().name,
                    status: doc.data().status
                }));
                console.log(fetchedBooklists);  // ここで出力
                setBooklists(fetchedBooklists);
            }
        };

        fetchBooklists();
    }, [currentUserUID]);


    const handleSelectClick = () => {
        setIsSelecting(!isSelecting);
        setSelectedBooklists([]); // 選択をリセット
    };

    const handleCheckboxChange = (id: string) => {
        if (selectedBooklists.includes(id)) {
            setSelectedBooklists(prev => prev.filter(item => item !== id));
        } else {
            setSelectedBooklists(prev => [...prev, id]);
        }
    };

    const handleMakePublic = async (id: string) => {
        if (currentUserUID) {  // この条件を追加
            const booklistRef = doc(db, 'booklists', currentUserUID, 'userBooklists', id);
            await updateDoc(booklistRef, { status: 'open' });
            alert("選択されたブックリストをホーム画面に公開しました！");
            setBooklists(prev => prev.map(booklist => booklist.id === id ? { ...booklist, status: 'open' } : booklist));
        }
    };

    const handleMakePrivate = async (id: string) => {
        if (currentUserUID) {  // この条件を追加
            const booklistRef = doc(db, 'booklists', currentUserUID, 'userBooklists', id);
            await updateDoc(booklistRef, { status: 'private' });
            alert("ブックリストを非公開にしました！");
            setBooklists(prev => prev.map(booklist => booklist.id === id ? { ...booklist, status: 'private' } : booklist));
        }
    };


    const handleDelete = async () => {
        if (currentUserUID) {
            // 選択されたブックリストを一つずつ削除する
            for (let id of selectedBooklists) {
                const booklistRef = doc(db, 'booklists', currentUserUID, 'userBooklists', id);
                await deleteDoc(booklistRef);
            }
            // ローカルの状態も更新する
            setBooklists(prev => prev.filter(booklist => !selectedBooklists.includes(booklist.id)));
            // 選択状態をリセット
            setSelectedBooklists([]);
            alert("選択されたブックリストを削除しました！");
        }
    };



    return (
        <Layout>
            <div className="flex flex-col items-center min-h-screen py-2">
                <div className="w-full max-w-4xl">
                    <h2 className="text-4xl font-bold mb-8 mt-10 text-center">MYブックリスト</h2>
                    <div className="flex justify-end mb-4 gap-4">
                        <button onClick={handleSelectClick} className="button-design">
                            {isSelecting ? 'キャンセル' : '選択'}
                        </button>
                        {/* 選択されたブックリストがある場合のみ削除ボタンを表示 */}
                        {isSelecting && selectedBooklists.length > 0 && (
                            <button onClick={handleDelete} className="button-design">
                                ブックリストを削除
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {booklists.map(booklist => (
                            <div
                                key={booklist.id}
                                className={`border rounded-xl p-4 transition ease-in-out duration-200 hover:shadow-lg ${booklist.status === 'open' ? 'bg-green-100' : 'bg-red-100'}`}
                            >
                                {/* ステータスの表示 */}
                                <div className="flex justify-between">
                                    <span className={`text-sm ${booklist.status === 'open' ? 'text-green-500' : 'text-red-500'}`}>
                                        {booklist.status}
                                    </span>

                                    {/* 公開・非公開ボタン */}
                                    {booklist.status === 'open' && (
                                        <button onClick={() => handleMakePrivate(booklist.id)} className="mt-2">
                                            非公開にする
                                        </button>
                                    )}
                                    {booklist.status === 'private' && (
                                        <button onClick={() => handleMakePublic(booklist.id)} className="mt-2">
                                            公開する
                                        </button>
                                    )}
                                </div>

                                {/* チェックボックスの表示 */}
                                {isSelecting && (
                                    <input
                                        type="checkbox"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                        }}
                                        onChange={() => handleCheckboxChange(booklist.id)}
                                        checked={selectedBooklists.includes(booklist.id)}
                                        style={{ width: '24px', height: '24px' }}
                                    />
                                )}
                                <Link href={`/booklists/${booklist.id}`}>
                                    <h3 className="text-xl font-semibold">{booklist.name}</h3>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default BookListsPage;
