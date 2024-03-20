import { GoogleAuthProvider, getAuth, sendPasswordResetEmail, signInWithPopup, signOut } from 'firebase/auth';
import { auth, provider, db } from '../plugins/firebase';
import { getDocs, getDoc, collection, query, where, addDoc, doc, deleteDoc, updateDoc, runTransaction, setDoc } from 'firebase/firestore';

export class AuthRepository {
    async googleLogin() {
        try {
            const auth = getAuth();
            const result = await signInWithPopup(auth, provider);
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const user = result.user;
            return user; // ユーザーオブジェクトを返す
        } catch (error) {
            console.error('Googleログインエラー:', error);
            throw error;
        }
    }

    async logout() {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('ログアウトエラー:', error);
            throw error;
        }
    }

    async addToShelf(book: any, uid: string) {
        try {
            // Firestoreの"shelves"コレクションにユーザーごとの本棚データを追加
            // ここでは"shelves"コレクションの中に"user.uid"のサブコレクションを作成して書籍データを格納します
            const bookRef = collection(db, 'shelves', uid, 'books');

            // 本棚内の書籍を取得
            const shelfSnapshot = await getDocs(bookRef);

            // 新しい書籍のISBNを取得
            const newBookIsbn = book.Item.isbn;

            // 本棚内のISBNと比較し、重複がない場合のみ追加
            let bookAlreadyExists = false;
            shelfSnapshot.forEach((doc) => {
                const bookData = doc.data();
                if (bookData && bookData.isbn === newBookIsbn) {
                    bookAlreadyExists = true;
                    return; // 一致するものが見つかったらループを終了
                }
            });

            if (!bookAlreadyExists) {
                // Firestoreに新しい書籍を追加
                await addDoc(bookRef, {
                    isbn: book.Item.isbn,
                    title: book.Item.title,
                    itemCaption: book.Item.itemCaption,
                    author: book.Item.author,
                    booksGenreId: book.Item.booksGenreId,
                    largeImageUrl: book.Item.largeImageUrl,
                    mediumImageUrl: book.Item.mediumImageUrl,
                    smallImageUrl: book.Item.smallImageUrl,
                    publisherName: book.Item.publisherName,
                    salesDate: book.Item.salesDate,
                    itemUrl: book.Item.itemUrl,
                    memo: "", // 新しいメモフィールド
                    status: 'reading', // 初めて本棚に追加された時点でのデフォルトステータス
                    // 他の情報を必要に応じて追加
                });

                console.log('書籍を本棚に追加しました');

                const alertDiv = document.createElement('div');
                alertDiv.className = 'centered-alert';
                alertDiv.textContent = '書籍を本棚に追加しました';
                document.body.appendChild(alertDiv);

                // 3秒後にアラートを非表示にする
                setTimeout(() => {
                    document.body.removeChild(alertDiv);
                }, 1500);
            } else {
                console.log('書籍は既に本棚に存在します');

                // 既に本棚に存在する場合のアラートを作成
                const alertDiv = document.createElement('div');
                alertDiv.className = 'centered-alert-add';
                alertDiv.textContent = '書籍は既に本棚に存在します';
                document.body.appendChild(alertDiv);

                // 3秒後にアラートを非表示にする
                setTimeout(() => {
                    document.body.removeChild(alertDiv);
                }, 1500);
            }
        } catch (error) {
            console.error('本棚への追加エラー:', error);
        }
    }


    async removeFromShelfByISBN(isbn: any, uid: string) {
        try {
            // Firestoreのコレクションを参照します（'shelves' -> UID -> 'books'）
            const bookCollectionRef = collection(db, 'shelves', uid, 'books');

            // ISBNを使用して削除対象の本を特定します
            const bookQuery = query(bookCollectionRef, where('isbn', '==', isbn));

            const querySnapshot = await getDocs(bookQuery);

            // ISBNが一致する本が存在する場合、それを削除します
            querySnapshot.forEach(async (doc) => {
                await deleteDoc(doc.ref);
                console.log('書籍を本棚から削除しました');
            });

            // 削除アラートを表示
            const alertDiv = document.createElement('div');
            alertDiv.className = 'remove-alert';
            alertDiv.textContent = '書籍を本棚から削除しました';
            document.body.appendChild(alertDiv);

            // 2秒後にアラートを非表示にする
            setTimeout(() => {
                document.body.removeChild(alertDiv);
            }, 2000);

        } catch (error) {
            console.error('本棚からの削除エラー:', error);
            throw error;
        }
    }

    async moveToTsundoku(selectedBookIds: any, uid: string) {
        try {
            console.log('moveToTsundoku function called with:', selectedBookIds, uid);

            // 選択された各本のstatusを'tsundoku'に更新
            const updatePromises = selectedBookIds.map((bookId: string) => {
                console.log('Updating status for bookId:', bookId);
                const bookRef = doc(db, 'shelves', uid, 'books', bookId);
                return updateDoc(bookRef, { status: 'tsundoku' });
            });

            // 全ての更新処理を同時に実行
            await Promise.all(updatePromises);
            console.log('積読に移動しました。');

            // アラートを表示
            const alertDiv = document.createElement('div');
            alertDiv.className = 'centered-alert';
            alertDiv.textContent = '積読に移動しました。';
            document.body.appendChild(alertDiv);

            // 3秒後にアラートを非表示にする
            setTimeout(() => {
                document.body.removeChild(alertDiv);
            }, 3000);
        } catch (error) {
            console.error('Failed to update status:', error);
            throw error;
        }
    }

    async addToBooklist(selectedBookIds: any, uid: string, booklistName: string) {
        try {
            console.log('addToBooklist function called with:', selectedBookIds, uid, booklistName);

            // ユーザーのブックリストのコレクション参照を取得
            const userBooklistsCollectionRef = collection(db, 'booklists', uid, 'userBooklists');
            const newBooklistRef = doc(userBooklistsCollectionRef); // これにより、ランダムなIDが生成されます

            // 選択された各本の情報を取得して、ブックリストに追加
            const bookDataArray = [];
            for (const bookId of selectedBookIds) {
                const bookRef = doc(db, 'shelves', uid, 'books', bookId);
                const bookDoc = await getDoc(bookRef);
                if (bookDoc.exists()) {
                    bookDataArray.push(bookDoc.data());
                }
            }

            // ブックリストドキュメントを作成または更新
            const booklistData = {
                name: booklistName,
                uid: uid,
                status: 'private',
                books: bookDataArray
            };
            await setDoc(newBooklistRef, booklistData);

            console.log('ブックリストに追加しました。');
            window.alert('ブックリストに追加しました！');  // アラートを表示

        } catch (error) {
            console.error('Failed to add to booklist:', error);
            throw error;
        }
    }


    async moveToReading(selectedBookIds: any, uid: string) {
        try {
            console.log('moveToReading function called with:', selectedBookIds, uid);

            // 選択された各本のstatusを'reading'に更新
            const updatePromises = selectedBookIds.map((bookId: string) => {
                console.log('Updating status for bookId:', bookId);
                const bookRef = doc(db, 'shelves', uid, 'books', bookId);
                return updateDoc(bookRef, { status: 'reading' });
            });

            // 全ての更新処理を同時に実行
            await Promise.all(updatePromises);
            console.log('本棚に戻しました。');

            // アラートを表示
            const alertDiv = document.createElement('div');
            alertDiv.className = 'centered-alert';
            alertDiv.textContent = '本棚に戻しました。';
            document.body.appendChild(alertDiv);

            // 3秒後にアラートを非表示にする
            setTimeout(() => {
                document.body.removeChild(alertDiv);
            }, 3000);
        } catch (error) {
            console.error('Failed to update status:', error);
            throw error;
        }
    }

    async resetPassword(email: string) {
        return new Promise(async (resolve, reject) => {
            try {
                const res = await sendPasswordResetEmail(auth, email)
                resolve(res)
            } catch (error: any) {
                console.log("🚀 ~ file: userRepository.ts:81 ~ UserRepository ~ resetPassword ~ error", error.code)
                reject(error.code)
            }
        });
    }

    async followUser(currentUserId: string, targetUserId: string) {
        try {
            await runTransaction(db, async (transaction) => {
                const followingRef = doc(db, 'users', currentUserId, 'following', targetUserId);
                const followersRef = doc(db, 'users', targetUserId, 'followers', currentUserId);

                transaction.set(followingRef, { userId: targetUserId });
                transaction.set(followersRef, { userId: currentUserId });
            });
            console.log(`User ${currentUserId} is now following ${targetUserId}`);
        } catch (error) {
            console.error('Follow error:', error);
            throw error;
        }
    }

    async unfollowUser(currentUserId: string, targetUserId: string) {
        try {
            await runTransaction(db, async (transaction) => {
                const followingRef = doc(db, 'users', currentUserId, 'following', targetUserId);
                const followersRef = doc(db, 'users', targetUserId, 'followers', currentUserId);

                transaction.delete(followingRef);
                transaction.delete(followersRef);
            });
            console.log(`User ${currentUserId} has unfollowed ${targetUserId}`);
        } catch (error) {
            console.error('Unfollow error:', error);
            throw error;
        }
    }

}