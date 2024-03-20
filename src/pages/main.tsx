import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '../plugins/firebase';
import Layout from '@/components/Layout';
import { collection, query, getDocs, getDoc, deleteDoc, doc, where, updateDoc, setDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { removeFromShelfByISBN, moveToTsundoku, addToBooklist } from '../models/authApplicationService';
import EditorComponent from '../components/editor'; // このパスは、EditorComponentの正しいパスに変更してください。
import dynamic from 'next/dynamic';
import Link from 'next/link';

const MainPage = () => {
    const router = useRouter();
    const [currentUserUID, setCurrentUserUID] = useState<string | null>(null);
    const [currentUserDisplayName, setCurrentUserDisplayName] = useState<string | null>(null);
    const [shelfBooks, setShelfBooks] = useState<any[]>([]);
    const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedBook, setSelectedBook] = useState(null); // selectedBook stateの追加
    const [showEditor, setShowEditor] = useState(false);
    const [selectedBooks, setSelectedBooks] = useState<{ [key: string]: boolean }>({});
    const [showCheckboxes, setShowCheckboxes] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [bookListName, setBookListName] = useState('');

    const auth = getAuth();

    // サーバーサイドではロードしない
    const EditorComponent = dynamic(
        () => import('../components/editor'), // このパスは、EditorComponentの正しいパスに変更してください。
        { ssr: false } // これにより、コンポーネントはクライアントサイドでのみロードされます。
    );

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userUID = user.uid;
                setCurrentUserUID(userUID);
                setCurrentUserDisplayName(user.displayName);

                const shelfBooksRef = collection(db, 'shelves', userUID, 'books');
                const shelfBooksQuery = query(shelfBooksRef, where('status', '==', 'reading'));  // ここを追加

                try {
                    const querySnapshot = await getDocs(shelfBooksQuery);
                    const booksData = querySnapshot.docs.map((doc) => {
                        return {
                            ...doc.data(),
                            id: doc.id // ドキュメントIDを追加
                        };
                    });

                    setShelfBooks(booksData);

                    const booksGenreRef = collection(db, 'booksGenre');

                    getDocs(booksGenreRef)
                        .then((querySnapshot) => {
                            const categoriesData = querySnapshot.docs.map((doc) => ({
                                id: doc.id,
                                name: doc.data().name,
                            }));
                            setCategories(categoriesData);
                        })
                        .catch((error) => {
                            console.error('データ取得エラー:', error);
                        });
                } catch (error) {
                    console.error('Firestoreデータ取得エラー:', error);
                }
            }
        });
        return () => {
            unsubscribe();
        };
    }, []);

    const handleCategoryClick = (category: any) => {
        setSelectedCategory(category);
    };

    const handleBookClick = (book: any) => {
        console.log("Clicked Book: ", book);
        setSelectedBook(book);
        setShowEditor(true);
    };

    const handleCloseEditor = () => {
        setSelectedBook(null);
        setShowEditor(false); // Editorの閉じるボタンがクリックされたときにEditorを非表示
    };

    const handleMoveToTsundoku = async () => {
        try {
            // 選択された本のIDを取得
            const selectedBookIds = Object.keys(selectedBooks).filter(bookId => selectedBooks[bookId]);

            if (currentUserUID) {
                // 選択された本を"積読"ステータスに更新
                await moveToTsundoku(selectedBookIds, currentUserUID);

                // UIを更新: 積読に移動した本をローカルステートから削除
                setShelfBooks(prevBooks =>
                    prevBooks.filter(book => !selectedBookIds.includes(book.id))
                );

                // 選択状態をリセット
                setSelectedBooks({});
            } else {
                console.error("currentUserUID is null.");
            }
        } catch (error) {
            console.error('Error moving books to Tsundoku:', error);
        }
    };

    // モーダルを開くための関数
    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    // モーダルを閉じるための関数
    const handleCloseModal = () => {
        setIsModalOpen(false);
    };


    const handleSaveBookList = async () => {
        if (currentUserUID && bookListName) {
            // 選択された本のIDを取得
            const selectedBookIds = Object.keys(selectedBooks).filter(bookId => selectedBooks[bookId]);

            // Firestoreにブックリストを保存
            try {
                await addToBooklist(selectedBookIds, currentUserUID, bookListName);
                console.log("ブックリストが保存されました！");
                setBookListName(""); // 入力フィールドをクリア
                setSelectedBooks({}); // 選択された本をクリア
                handleCloseModal();
            } catch (error) {
                console.error("ブックリストの保存中にエラーが発生しました:", error);
            }
        } else {
            console.error("currentUserUIDがnullまたはブックリスト名が空です。");
        }
    };



    return (
        <Layout>
            <div>
                <div className="flex items-center">
                    <h2 className="text-lg font-semibold mt-8 mb-8">MY本棚</h2>
                    <Link href="/tsundoku" className="button-design">
                        <h2 className="text-lg font-semibold">積読本</h2>
                    </Link>
                    <Link href="/booklists/booklists" className="button-design">
                        <h2 className="text-lg font-semibold">MYブックリスト</h2>
                    </Link>
                </div>
                <div className="button-container">
                    <button
                        onClick={() => setShowCheckboxes(!showCheckboxes)}
                        className="button-design"
                    >
                        {showCheckboxes ? 'キャンセル' : '選択'}
                    </button>
                    {Object.values(selectedBooks).some(Boolean) && (
                        <>
                            <button
                                onClick={handleMoveToTsundoku}
                                className="button-design"
                            >
                                積読に移動
                            </button>
                            <button
                                onClick={handleOpenModal}
                                className="button-design"
                            >
                                ブックリストを作成
                            </button>
                            {isModalOpen && (
                                <div className="modal fixed inset-0 flex items-center justify-center z-50">
                                    <div className="modal-overlay fixed inset-0 bg-black opacity-50"></div>
                                    <div className="modal-content bg-white rounded-lg p-6 max-w-md mx-auto relative z-10 shadow-lg">
                                        <span className="close cursor-pointer absolute top-2 right-2 text-xl" onClick={handleCloseModal}>&times;</span>
                                        <h2 className="text-2xl font-semibold mb-4">新しいブックリストを作成</h2>
                                        <input
                                            type="text"
                                            value={bookListName}
                                            onChange={(e) => setBookListName(e.target.value)}
                                            placeholder="ブックリスト名"
                                            className="border p-2 w-full rounded mb-4"
                                        />
                                        <button
                                            onClick={handleSaveBookList}
                                            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 focus:outline-none"
                                        >
                                            保存
                                        </button>
                                    </div>
                                </div>
                            )}
                            <button
                                className="button-design"
                                onClick={() => {
                                    if (currentUserUID) {
                                        // 選択された本を抽出
                                        const selectedIsbns = shelfBooks
                                            .filter(book => selectedBooks[book.id])
                                            .map(book => book.isbn);

                                        // 選択された各本を削除
                                        selectedIsbns.forEach((isbn) => {
                                            removeFromShelfByISBN(isbn, currentUserUID);
                                        });

                                        // 選択状態をリセット
                                        setSelectedBooks({});

                                        // UIを更新: 削除された本をステートから除外
                                        setShelfBooks(prevBooks =>
                                            prevBooks.filter(book => !selectedIsbns.includes(book.isbn))
                                        );
                                    }
                                }}
                            >
                                本を削除
                            </button>

                        </>
                    )}
                </div>

                <div className="mt-4">
                    <div>
                        <div className="category-container mb-4">
                            <span
                                key="all"
                                className={`category-tab text-lx0.5 ${selectedCategory === null ? 'text-blue-500' : 'text-black'}`}
                                onClick={() => handleCategoryClick(null)}
                            >
                                全ての本
                            </span>
                            {categories
                                .filter(category =>
                                    shelfBooks.some(book =>
                                        book.booksGenreId.startsWith(category.id)
                                    )
                                )
                                .map((category) => (
                                    <span
                                        key={category.id}
                                        className={`category-tab text-lx0.5 ${selectedCategory === category.id ? 'text-blue-500' : 'text-black'}`}
                                        onClick={() => handleCategoryClick(category.id)}
                                    >
                                        {category.name}
                                    </span>
                                ))}
                        </div>

                        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-10 xl:grid-cols-10 gap-4">
                            {/* ... 本のリスト */}
                            {shelfBooks
                                .filter((book) => {
                                    if (selectedCategory === null) {
                                        return true;
                                    } else {
                                        return book.booksGenreId.startsWith(selectedCategory);
                                    }
                                })
                                .map((book, index) => (
                                    <div key={index} className="book-container centered-content-container">
                                        <input
                                            type="checkbox"
                                            checked={!!selectedBooks[book.id]}
                                            onChange={(e) => {
                                                setSelectedBooks({ ...selectedBooks, [book.id]: e.target.checked });
                                            }}
                                            style={{ display: showCheckboxes ? 'inline' : 'none' }}
                                        />
                                        <h4
                                            className={`text-lg font-semibold cursor-pointer ${selectedCategory === book.booksGenreId ? 'text-blue-500' : 'text-black'}`}
                                            onClick={() => handleBookClick(book)}
                                        >
                                            <img
                                                alt={book.title}
                                                src={book.largeImageUrl}
                                                className="h-auto max-h-48"
                                            />
                                        </h4>
                                    </div>
                                ))}
                            {selectedBook && <EditorComponent book={selectedBook} onClose={handleCloseEditor} currentUserUID={currentUserUID} show={showEditor} />}
                        </div>
                    </div>
                </div>
            </div>
        </Layout >
    );
};

export default MainPage;