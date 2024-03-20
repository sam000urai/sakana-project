import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../plugins/firebase';
import Layout from '@/components/Layout';
import Link from 'next/link';
import { moveToReading } from '../models/authApplicationService'; // あなたのパスに適したものに変更してください

const TsundokuPage = () => {
    const [tsundokuBooks, setTsundokuBooks] = useState<any[]>([]);
    const [currentUserUID, setCurrentUserUID] = useState<string | null>(null);
    const [selectedBooks, setSelectedBooks] = useState<Record<string, boolean>>({});
    const [showCheckboxes, setShowCheckboxes] = useState(false);

    useEffect(() => {
        // ユーザーの認証状態を監視
        const unsubscribe = onAuthStateChanged(auth, user => {
            setCurrentUserUID(user?.uid || null);
        });

        // クリーンアップ関数
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (currentUserUID) {
            // Firestoreからstatusが'tsundoku'の本のみを取得
            const tsundokuBooksRef = collection(db, 'shelves', currentUserUID, 'books');
            const tsundokuBooksQuery = query(tsundokuBooksRef, where('status', '==', 'tsundoku'));

            getDocs(tsundokuBooksQuery).then(querySnapshot => {
                const booksData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
                setTsundokuBooks(booksData);
            });
        }
    }, [currentUserUID]); // currentUserUIDが変更されたら、このuseEffectを再実行

    const handleMoveToReading = async () => {
        try {
            const selectedBookIds = Object.keys(selectedBooks).filter(bookId => selectedBooks[bookId]);
            if (currentUserUID) {
                await moveToReading(selectedBookIds, currentUserUID);
                setTsundokuBooks(prevBooks =>
                    prevBooks.filter(book => !selectedBookIds.includes(book.id))
                );
                setSelectedBooks({});
            } else {
                console.error("currentUserUID is null.");
            }
        } catch (error) {
            console.error('Error moving books to Reading:', error);
        }
    };

    return (
        <Layout>
            <div>
                <div className="flex items-center">
                    <h2 className="text-lg font-semibold mt-8 mb-8">積読本</h2>
                    <Link href="/main" className="button-design">
                        <h2 className="text-lg font-semibold">MY本棚</h2>
                    </Link>
                </div>
                <div className="button-container mb-4">
                    <button
                        onClick={() => setShowCheckboxes(!showCheckboxes)}
                        className="button-design"
                    >
                        {showCheckboxes ? 'キャンセル' : '選択'}
                    </button>
                    {showCheckboxes && (
                        <button
                            onClick={handleMoveToReading}
                            className="button-design"
                        >
                            本棚に戻す
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-10 xl:grid-cols-10 gap-4">
                    {tsundokuBooks.map((book) => (
                        <div key={book.id} className="book-container centered-content-container">
                            <input
                                type="checkbox"
                                checked={!!selectedBooks[book.id]}
                                onChange={(e) => {
                                    setSelectedBooks({ ...selectedBooks, [book.id]: e.target.checked });
                                }}
                                style={{ display: showCheckboxes ? 'inline' : 'none' }}
                            />
                            <img src={book.largeImageUrl} alt={book.title} />
                        </div>
                    ))}
                </div>
            </div>
        </Layout>
    );
};

export default TsundokuPage;