'use client';

import { useState, useEffect } from 'react';

export default function ProfilePage() {
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');

  // 既存のプロフィールを読み込み
  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      try {
        const profile = JSON.parse(savedProfile);
        setName(profile.name || '');
        setAvatar(profile.avatar || '');
        setIsAnonymous(profile.isAnonymous || false);
      } catch (error) {
        console.error('プロフィール読み込みエラー:', error);
      }
    }
  }, []);

  const handleSave = async () => {
    // ユーザーIDを取得または生成
    let userId = localStorage.getItem('userId');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('userId', userId);
    }

    // プロフィール設定を保存（実際の実装ではAPIを呼び出す）
    const profile = {
      id: userId,
      name,
      avatar,
      isAnonymous,
    };

    // ローカルストレージに保存（開発用）
    localStorage.setItem('userProfile', JSON.stringify(profile));
    
    alert('プロフィール設定を保存しました');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold mb-8">プロフィール設定</h1>

        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 space-y-6">
          {/* 名前設定 */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              表示名
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="あなたの名前"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* アバターURL */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              アバター画像URL（オプション）
            </label>
            <input
              type="url"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* 匿名設定 */}
          <div className="bg-gray-700/50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-white mb-1">
                  ランキングでの匿名表示
                </h3>
                <p className="text-sm text-gray-400">
                  有効にすると、サポーターランキングで「匿名サポーター」として表示されます
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
            {isAnonymous && (
              <div className="mt-4 p-4 bg-yellow-900/30 border border-yellow-700 rounded-lg">
                <p className="text-sm text-yellow-200">
                  ⚠️ 匿名モードが有効です。ランキングでは「匿名サポーター」として表示されますが、支援額は集計されます。
                </p>
              </div>
            )}
          </div>

          {/* 保存ボタン */}
          <button
            onClick={handleSave}
            className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl font-semibold"
          >
            設定を保存
          </button>
        </div>
      </div>
    </div>
  );
}
