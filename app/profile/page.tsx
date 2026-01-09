'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [rankingDisplayMode, setRankingDisplayMode] = useState<'public' | 'private' | 'hidden'>('public');
  const [showRankMode, setShowRankMode] = useState(false);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 既存のプロフィールを読み込み
  useEffect(() => {
    const loadProfile = async () => {
      try {
        // ユーザー情報を取得
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          router.push('/login');
          return;
        }
        setUser(user);

        // プロフィール情報を取得
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          setName(profile.name || user.email || '');
          setAvatar(profile.avatar_url || '');
          setIsAnonymous(profile.is_anonymous || false);
          setRankingDisplayMode(profile.ranking_display_mode || 'public');
          setShowRankMode(profile.show_rank_mode || false);
        } else {
          // プロフィールが存在しない場合、初期値を設定
          setName(user.email || '');
          setAvatar(user.user_metadata?.avatar_url || '');
          setRankingDisplayMode('public');
        }
      } catch (error) {
        console.error('プロフィール読み込みエラー:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router, supabase]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // プロフィールを更新
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          name,
          avatar_url: avatar,
          is_anonymous: isAnonymous,
          ranking_display_mode: rankingDisplayMode,
          show_rank_mode: showRankMode,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id',
        });

      if (error) throw error;

      alert('プロフィール設定を保存しました');
      router.refresh();
    } catch (error: any) {
      console.error('プロフィール保存エラー:', error);
      alert('プロフィール設定の保存に失敗しました: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="text-gray-400">読み込み中...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

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

          {/* ランキング表示モード設定（メンタル保護） */}
          <div className="bg-gray-700/50 rounded-lg p-6">
            <div>
              <h3 className="font-semibold text-white mb-2">
                ランキング表示モード（メンタル保護）
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                あなたの作品ページでの支援ランキングの表示方法を設定できます
              </p>
              <div className="space-y-3">
                <label className="flex items-center space-x-3 p-3 rounded-lg bg-gray-600/50 hover:bg-gray-600 cursor-pointer">
                  <input
                    type="radio"
                    name="rankingDisplayMode"
                    value="public"
                    checked={rankingDisplayMode === 'public'}
                    onChange={(e) => setRankingDisplayMode(e.target.value as 'public' | 'private' | 'hidden')}
                    className="w-4 h-4 text-purple-600"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-white">公開 (public)</p>
                    <p className="text-xs text-gray-400">誰でもランキングを閲覧できます</p>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-3 rounded-lg bg-gray-600/50 hover:bg-gray-600 cursor-pointer">
                  <input
                    type="radio"
                    name="rankingDisplayMode"
                    value="private"
                    checked={rankingDisplayMode === 'private'}
                    onChange={(e) => setRankingDisplayMode(e.target.value as 'public' | 'private' | 'hidden')}
                    className="w-4 h-4 text-purple-600"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-white">非公開 (private)</p>
                    <p className="text-xs text-gray-400">あなただけがランキングを閲覧できます</p>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-3 rounded-lg bg-gray-600/50 hover:bg-gray-600 cursor-pointer">
                  <input
                    type="radio"
                    name="rankingDisplayMode"
                    value="hidden"
                    checked={rankingDisplayMode === 'hidden'}
                    onChange={(e) => setRankingDisplayMode(e.target.value as 'public' | 'private' | 'hidden')}
                    className="w-4 h-4 text-purple-600"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-white">非表示 (hidden)</p>
                    <p className="text-xs text-gray-400">ランキングを完全に非表示にします</p>
                  </div>
                </label>
              </div>
            </div>
            {rankingDisplayMode !== 'public' && (
              <div className="mt-4 p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
                <p className="text-sm text-blue-200">
                  ℹ️ ランキング表示モードが「{rankingDisplayMode === 'private' ? '非公開' : '非表示'}」です。
                  {rankingDisplayMode === 'private' ? 'あなただけが自分のページの支援ランキングを閲覧できます。' : 'ランキングは完全に非表示になります。'}
                </p>
              </div>
            )}
          </div>

          {/* ランク表示モード設定 */}
          <div className="bg-gray-700/50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-white mb-1">
                  支援ランク表示モード
                </h3>
                <p className="text-sm text-gray-400">
                  有効にすると、金額の代わりにブロンズ/シルバー/ゴールドなどの称号で表示されます
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showRankMode}
                  onChange={(e) => setShowRankMode(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
            {showRankMode && (
              <div className="mt-4 p-4 bg-green-900/30 border border-green-700 rounded-lg">
                <p className="text-sm text-green-200 mb-2">
                  ✓ ランク表示モードが有効です。支援ランキングは以下の称号で表示されます：
                </p>
                <ul className="text-sm text-green-200 space-y-1 list-disc list-inside">
                  <li>🥉 ブロンズ: ¥500未満</li>
                  <li>🥈 シルバー: ¥1,000以上</li>
                  <li>🥇 ゴールド: ¥2,000以上</li>
                  <li>💠 プラチナ: ¥5,000以上</li>
                  <li>💎 ダイヤモンド: ¥10,000以上</li>
                </ul>
              </div>
            )}
          </div>

          {/* 保存ボタン */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? '保存中...' : '設定を保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
