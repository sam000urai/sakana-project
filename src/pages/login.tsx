import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { auth } from '../plugins/firebase';
import { signInWithGoogle, signInWithEmailPassword, createUser } from '../plugins/firebase';
import Link from 'next/link';
import Layout from '@/components/Layout';

const LoginPage = () => {
    const router = useRouter();
    const [error, setError] = useState('');
    const [showSignUp, setShowSignUp] = useState(false); // 新しい状態変数を追加
    const [name, setName] = useState(''); // nameステート変数を定義
    const [email, setEmail] = useState(''); // emailステート変数を定義
    const [password, setPassword] = useState(''); // passwordステート変数を定義
    const [username, setUsername] = useState(''); // usernameステート変数を定義

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                // ログイン成功後にUserProfileページにリダイレクトします
                router.push('/main');
            }
        });

        // アンマウント時にリスナーをクリーンアップします
        return () => unsubscribe();
    }, [router]);


    const handleGoogleLogin = async () => {
        const result = await signInWithGoogle();
        if (result === "success") {
            router.push('/main');
        } else {
            setError("Googleログインに失敗しました。");
        }
    };


    const handleSignUp = async (e: any) => {
        e.preventDefault(); // Prevent the default form submission behavior
        try {
            // Create a new user account using createUserWithEmailAndPassword function
            const resultMessage = await createUser(name, email, password);

            // Check the result message
            if (resultMessage === 'success') {
                // Success message
                setError("登録に成功しました。");
                console.log("登録成功！");
            } else {
                setError(resultMessage); // Set the error message returned from createUser function
            }
        } catch (error) {
            console.error("新規登録エラー:", error);
            setError("新規登録に失敗しました。");
        }
    };



    const handleSignIn = async (e: any) => {
        try {
            // Use signInWithEmailPassword function to sign in the user
            const result = await signInWithEmailPassword(email, password);

            // Check the result of sign-in attempt
            if (result === "success") {
                console.log("ログイン成功！")
            } else {
                setError("メールアドレスとパスワードによるサインインに失敗しました。");
            }
        } catch (error) {
            setError("メールアドレスとパスワードによるサインインに失敗しました。");
        }
    };


    return (
        <Layout>
            <div>
                {/* <button onClick={handleLineLogin}>LINEでログイン</button> */}
                <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden">
                    <div className="w-full p-6 bg-white rounded-md shadow-md lg:max-w-xl">
                        {showSignUp && ( // Show name field only if showSignUp is true
                            <div className="mb-4">
                                <h1 className="text-3xl font-bold text-center text-gray-700">新規登録</h1>
                                <label htmlFor="name" className="block text-sm font-semibold text-gray-800">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border rounded-md focus:border-gray-400 focus:ring-gray-300 focus:outline-none focus:ring focus:ring-opacity-40"
                                />
                            </div>
                        )}
                        <div className="mb-4">
                            <label
                                htmlFor="email"
                                className="block text-sm font-semibold text-gray-800"
                            >
                                Email
                            </label>
                            <input
                                type="email"
                                onChange={(e) => setEmail(e.target.value)}
                                name="email" // name属性を設定
                                className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border rounded-md focus:border-gray-400 focus:ring-gray-300 focus:outline-none focus:ring focus:ring-opacity-40"
                            />
                        </div>
                        <div className="mb-2">
                            <label
                                htmlFor="password"
                                className="block text-sm font-semibold text-gray-800"
                            >
                                Password
                            </label>
                            <input
                                type="password"
                                onChange={(e) => setPassword(e.target.value)}
                                name="password" // name属性を設定
                                className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border rounded-md focus:border-gray-400 focus:ring-gray-300 focus:outline-none focus:ring focus:ring-opacity-40"
                            />
                        </div>
                        <Link
                            href="/resetPassword"
                            className="text-xs text-blue-600 hover:underline"
                        >
                            Forget Password?
                        </Link>
                        <div className="mt-2">
                            <button
                                onClick={showSignUp ? handleSignUp : handleSignIn}
                                className="w-full px-4 py-2 tracking-wide text-white transition-colors duration-200 transform bg-gray-700 rounded-md hover:bg-gray-600 focus:outline-none focus:bg-gray-600">

                                {showSignUp ? "sign up" : "sign in"}
                            </button>
                        </div>
                        <div className="relative flex items-center justify-center w-full mt-6 border border-t">
                            <div className="absolute px-5 bg-white">Or</div>
                        </div>
                        <div className="flex mt-4 gap-x-2">
                            <button onClick={handleGoogleLogin}
                                type="button"
                                className="flex items-center justify-center w-full p-2 border border-gray-600 rounded-md focus:ring-2 focus:ring-offset-1 focus:ring-violet-600"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 32 32"
                                    className="w-5 h-5 fill-current"
                                >
                                    <path d="M16.318 13.714v5.484h9.078c-0.37 2.354-2.745 6.901-9.078 6.901-5.458 0-9.917-4.521-9.917-10.099s4.458-10.099 9.917-10.099c3.109 0 5.193 1.318 6.38 2.464l4.339-4.182c-2.786-2.599-6.396-4.182-10.719-4.182-8.844 0-16 7.151-16 16s7.156 16 16 16c9.234 0 15.365-6.49 15.365-15.635 0-1.052-0.115-1.854-0.255-2.651z"></path>
                                </svg>

                            </button>

                        </div>

                        <p className="mt-4 text-sm text-center text-gray-700">
                            Don't have an account?{" "}
                            <button
                                className="font-medium text-blue-600 hover:underline"
                                onClick={() => setShowSignUp(!showSignUp)}
                            >
                                {showSignUp ? "sign in" : "sign up"}
                            </button>
                        </p>

                    </div>
                </div>
            </div >
        </Layout>
    );
};


export default LoginPage;
