import React, { useEffect, useRef, useState } from 'react';
import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../plugins/firebase'; // db の正確なパスを指定してください。

interface EditorComponentProps {
    book: any;
    onClose: () => void;
    currentUserUID: any;
    show: boolean; // この行を追加
}

const EditorComponent: React.FC<EditorComponentProps> = ({ book, onClose, currentUserUID, show }) => {
    const editorContainer = useRef<HTMLDivElement>(null);
    const [editorInstance, setEditorInstance] = useState<EditorJS | null>(null);

    useEffect(() => {
        console.log("Editor Mounted with book: ", book);

        // 既存のEditorJSインスタンスがあれば破棄し、ステートをnullに設定
        if (editorInstance) {
            console.log('Editor instance:', editorInstance); // インスタンスをログに出力
            try {
                editorInstance.destroy();  // ここでエラーが発生している
            } catch (error) {
                console.error('Error destroying editor instance:', error); // エラー情報をログに出力
            }
            setEditorInstance(null);
        }

        // 既存のeditorInstanceが破棄された後で新しいインスタンスを作成
        if (editorContainer.current) {
            const editor = new EditorJS({
                holder: editorContainer.current,
                data: book.memo || {}, // book.memoがundefinedの場合、空オブジェクトを設定
                tools: {
                    header: {
                        class: Header,
                        inlineToolbar: ['link']
                    },
                    list: {
                        class: List,
                        inlineToolbar: true
                    }
                }
            });
            setEditorInstance(editor);
        }

        return () => {
            if (editorInstance) {
                editorInstance.destroy();
            }
        };
    }, []); // 依存配列は空にしておく


    // エディタの保存ボタンがクリックされたときのハンドラ
    const handleSave = async () => {
        if (!editorInstance) {
            console.error('Editor instance is not available');
            return;
        }

        console.log('book.id: ', book.id); // book.idの値を確認
        console.log('currentUserUID: ', currentUserUID); // currentUserUIDの値を確認

        try {
            const data = await editorInstance.save(); // エディタのインスタンスからデータを保存
            console.log('Saved data: ', data);

            // book.idがその本のドキュメントIDであると仮定
            if (book.id && currentUserUID) {
                const bookRef = doc(db, 'shelves', currentUserUID, 'books', book.id); // 適切なパスを指定
                await setDoc(bookRef, { memo: data }, { merge: true }); // merge: trueでmemoフィールドだけをアップデート
                window.alert('保存しました！'); // アラートを表示
                console.log('Book memo updated successfully.');
            } else {
                console.error('book.id or currentUserUID is undefined');
            }
        } catch (e) {
            console.error('Saving failed: ', e);
        }
    }

    const handleClose = () => {
        onClose();
    };

    return (
        <div className={show ? "visibleClassName" : "hiddenClassName"}>
            <div className="textbox">
                {/* 1. 本のタイトルを表示 */}
                <h2 className="text-2xl font-bold mb-4">{book.title}</h2>
                <div ref={editorContainer} className="mb-5">
                    {/* 2. プレースホルダのテキストを表示するための要素 */}
                    {!book.memo && <span className="text-gray-900 italic"></span>}
                </div>
                <div className="button-container"> {/* ボタンを囲むコンテナを追加 */}
                    <button
                        onClick={handleClose}
                        className="bg-red-500 text-white py-2 px-4 rounded-full mr-3 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-200"
                    >
                        閉じる
                    </button>
                    <button
                        onClick={handleSave}
                        className="bg-green-500 text-white py-2 px-4 rounded-full hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-200"
                    >
                        保存する
                    </button>
                </div>
            </div>
        </div>
    );


};

export default EditorComponent;