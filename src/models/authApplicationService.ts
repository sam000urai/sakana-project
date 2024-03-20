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