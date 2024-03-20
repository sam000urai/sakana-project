import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { addToShelf } from '../models/authApplicationService';
import Layout from '@/components/Layout';

interface User {
    name: string;
    email: string;
    // 他のユーザー情報を必要に応じて追加します
}

interface Book {
    // 書籍データのインターフェースを定義
    title: string;
    imageUrl: string;
    // 他の書籍情報を必要に応じて追加
}

const SearchPage = () => {
    const router = useRouter();
    const [user] = useState<User | null>(null);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [searchResults, setSearchResults] = useState<Book[]>([]);
    const [isSearchClicked, setIsSearchClicked] = useState(false);
    const [UID, setUID] = useState<string>('');
    const [isbn] = useState<string>('');

    // Firebase Auth オブジェクトを取得
    const auth = getAuth();

    // 認証状態の変更を監視
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                // ユーザーがログインしている場合
                setUID(user.uid);
            }
        });

        return () => {
            // コンポーネントがアンマウントされるときに監視を解除
            unsubscribe();
        };
    }, []);

    const handleLogout = async () => {
        try {
            // authオブジェクトを使用してユーザーをログアウトします
            await signOut(auth);
            // ログアウト成功後にログインページにリダイレクトします
            router.push('/login');
        } catch (error) {
            // ログアウト中にエラーが発生した場合の処理を行います
            console.error('ログアウトエラー:', error);
        }
    };

    const API_KEY = '1076469919053008956';
    const BASE_URL = 'https://app.rakuten.co.jp/services/api/BooksTotal/Search/20170404';


    const handleSearch = async () => {
        try {
            const encodedKeyword = encodeURIComponent(searchKeyword);
            const response = await fetch(`${BASE_URL}?format=json&keyword=${encodedKeyword}&applicationId=${API_KEY}`);
            if (!response.ok) {
                console.error('APIリクエストエラー:', response.status, response.statusText);
                return;
            }
            const data = await response.json();
            const books = data?.Items ?? [];
            setSearchResults(books);
            setIsSearchClicked(true);
        } catch (error) {
            console.error('書籍検索エラー:', error);
        }
    };


    return (
        <Layout>

            <div>
                <div className="px-4 py-8 max-w-3xl mx-auto">
                    <div className="mb-8">
                        <input
                            type="text"
                            placeholder="本のタイトル、著者名"
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

                    <div>
                        {isSearchClicked && searchResults.length > 0 ? (
                            <div className="flex flex-col gap-4">
                                {searchResults.map((book: any) => (
                                    <div key={book.Item?.title} className="w-full">
                                        <div className="flex items-start gap-4 p-4 border rounded-lg overflow-hidden" style={{ height: '150px' }}>
                                            <img
                                                src={book.Item?.mediumImageUrl}
                                                alt={book.Item?.title}
                                                className="object-cover w-20 h-25" // ここでobject-coverを適用。w-32とh-32で幅と高さを設定
                                            />
                                            <div className="w-3/5">
                                                <h3 className="text-lg font-semibold mb-2">{book.Item?.title}</h3>
                                                <p className="mb-0.2">{book.Item?.author}</p> {/* Replace with actual property name for author */}
                                                <p className="mb-0.2">{book.Item?.publisherName}</p>
                                                <p className="mb-0.2">{book.Item?.salesDate}</p>
                                            </div>
                                            <div className="w-1/5">
                                                <button
                                                    onClick={() => addToShelf(book, UID)}
                                                    className="px-4 py-2 font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring focus:ring-blue-200"
                                                >
                                                    本棚に追加
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                        ) : isSearchClicked && searchResults.length === 0 ? (
                            <p>検索結果はありません</p>
                        ) : null}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default SearchPage;