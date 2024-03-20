import { useEffect, useState } from 'react';
import { db, auth } from '../../plugins/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';
import Layout from '@/components/Layout';

const FavoriteBookListsPage = () => {
    const [favorites, setFavorites] = useState<{ status: string; id: string, name: string }[]>([]);
    const [currentUserUID, setCurrentUserUID] = useState<string | null>(null);

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
        const fetchFavorites = async () => {
            if (currentUserUID) {
                const favoritesRef = collection(db, 'booklists', currentUserUID, 'favorites');
                const favoritesSnapshot = await getDocs(favoritesRef);

                const fetchedFavorites = [];
                for (let favorite of favoritesSnapshot.docs) {
                    const favoriteData = favorite.data();
                    const booklistID = favorite.id;
                    const ownerUID = favoriteData.ownerUserUID; // お気に入りに保存されている所有者のUID

                    // オリジナルのブックリストの参照を取得
                    const booklistRef = ownerUID
                        ? doc(db, 'booklists', ownerUID, 'userBooklists', booklistID)
                        : null;

                    // オリジナルのブックリストから情報を取得
                    if (booklistRef) {
                        const booklistSnapshot = await getDoc(booklistRef);
                        if (booklistSnapshot.exists()) {
                            const booklistData = booklistSnapshot.data();
                            fetchedFavorites.push({
                                id: booklistID,
                                name: booklistData.name, // オリジナルのブックリストから名前を取得
                                status: booklistData.status,
                                addedAt: favoriteData.addedAt
                            });
                        }
                    } else {
                        // オリジナルのブックリストのUIDがない場合は、お気に入りからの情報を使用
                        fetchedFavorites.push({
                            id: booklistID,
                            name: favoriteData.name ?? 'Unknown', // タイトルがない場合は 'Unknown' と表示
                            status: favoriteData.status ?? 'Unknown',
                            addedAt: favoriteData.addedAt
                        });
                    }
                }
                setFavorites(fetchedFavorites);
            }
        };

        fetchFavorites();
    }, [currentUserUID]);


    return (
        <Layout>
            <div className="flex flex-col items-center min-h-screen py-2">
                <div className="w-full max-w-4xl">
                    <h2 className="text-4xl font-bold mb-8 mt-10 text-center">MYお気に入りブックリスト</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {favorites.map(favorite => (
                            <div
                                key={favorite.id}
                                className={`border rounded-xl p-4 transition ease-in-out duration-200 hover:shadow-lg ${favorite.status === 'open' ? 'bg-green-100' : 'bg-red-100'}`}
                            >
                                <Link href={`/booklists/${favorite.id}`}>
                                    <h3 className="text-xl font-semibold">{favorite.name}</h3>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Layout >
    );
};

export default FavoriteBookListsPage;
