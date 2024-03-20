import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../plugins/firebase'; // firebaseのauthオブジェクトをインポート
import { addToShelf } from '../models/authApplicationService';
import { db } from '../plugins/firebase'; // Firestoreのdbオブジェクトをインポート
import Layout from '@/components/Layout';


const Ranking = () => {
    const [rankingData, setRankingData] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const applicationId = '1076469919053008956';
                const genreId = '200162'; // 本のジャンルID

                const response = await fetch(
                    `https://app.rakuten.co.jp/services/api/IchibaItem/Ranking/20220601?applicationId=${applicationId}&genreId=${genreId}`
                );


                if (response.ok) {
                    const data = await response.json();

                    // ランキングデータに画像情報を追加
                    const rankingWithImages = data.Items.map((item: any) => {
                        return {
                            itemName: item.Item.itemName,
                            itemCode: item.Item.itemCode,

                            affiliateUrl: item.Item.affiliateUrl,

                            imageUrl: item.Item.mediumImageUrls[0].imageUrl, // 画像のURLを指定
                        };
                    });

                    setRankingData(rankingWithImages);
                } else {
                    console.error('ランキング情報の取得に失敗しました');
                }
            } catch (error) {
                console.error('ランキング情報の取得に失敗しました:', error);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        // rankingDataが更新された際に、各ランキングアイテムのデータをコンソールに出力
        console.log(rankingData);
    }, [rankingData]);

    return (
        <Layout>
            <div className="container mx-auto p-4">
                <h2 className="text-2xl font-semibold mb-4">本の総合ランキング</h2>
                <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    {rankingData.map((item: any, index) => (
                        <li key={index} className="bg-white rounded-lg shadow-md p-4">
                            <img src={item.imageUrl} alt={item.itemName} className="w-full border rounded-lg overflow-hidden" />
                            <p className="text-lg font-semibold mt-2">{item.itemName}</p>
                        </li>
                    ))}
                </ul>
            </div>
        </Layout>
    );
};

export default Ranking;
