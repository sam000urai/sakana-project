import { AuthRepository } from './authRepository';

export const googleLogin = async () => {
    try {
        const repo = new AuthRepository();
        const user = await repo.googleLogin();
        return user;
    } catch (err) {
        console.error('Googleログインエラー:', err);
        throw err;
    }
};

export const addToShelf = async (books: any, uid: string) => {
    try {
        const repo = new AuthRepository();
        const added = await repo.addToShelf(books, uid);
        return added;
    } catch (err) {
        console.error('本棚への追加エラー:', err);
        throw err;
    }
};

export const removeFromShelfByISBN = async (isbn: string, uid: string) => {
    try {
        const repo = new AuthRepository();
        await repo.removeFromShelfByISBN(isbn, uid);
    } catch (err) {
        console.error('本棚からの削除エラー:', err);
        throw err;
    }
};

export const moveToTsundoku = async (selectedBookIds: any, uid: string) => {
    try {
        const repo = new AuthRepository();
        await repo.moveToTsundoku(selectedBookIds, uid);
    } catch (err) {
        console.error('積読に移動エラー:', err);
        throw err;
    }
};

export const addToBooklist = async (selectedBookIds: any, uid: string, booklistName: string) => {
    try {
        const repo = new AuthRepository();
        await repo.addToBooklist(selectedBookIds, uid, booklistName);
    } catch (err) {
        console.error('ブックリストへの追加エラー:', err);
        throw err;
    }
};


export const moveToReading = async (selectedBookIds: any, uid: string) => {
    try {
        const repo = new AuthRepository();
        await repo.moveToReading(selectedBookIds, uid);
    } catch (err) {
        console.error('本棚に戻すエラー:', err);
        throw err;
    }
};

export const resetPassword = async (email: string) => {
    try {
        const repo = new AuthRepository();
        await repo.resetPassword(email)
    } catch (err) {
        console.log("🚀 ~ file: userApplicationService.ts:46 ~ resetPassword ~ err", err)
        return err
    }
};

export const followUser = async (currentUserId: string, targetUserId: string) => {
    try {
        const repo = new AuthRepository();
        await repo.followUser(currentUserId, targetUserId);
    } catch (err) {
        console.error('Follow user error:', err);
        throw err;
    }
};

export const unfollowUser = async (currentUserId: string, targetUserId: string) => {
    try {
        const repo = new AuthRepository();
        await repo.unfollowUser(currentUserId, targetUserId);
    } catch (err) {
        console.error('Unfollow user error:', err);
        throw err;
    }
};