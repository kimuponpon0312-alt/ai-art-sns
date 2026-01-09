'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AuthModal from '@/components/AuthModal';

export default function Home() {
  const router = useRouter();
  const supabase = createClient();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ユーザー認証状態を確認
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // プロフィール情報を取得
        const { data: profileData } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .single();
        setProfile(profileData);
      }

      setLoading(false);
    };

    checkAuth();

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', session.user.id)
          .single();
        setProfile(profileData);
      } else {
        setProfile(null);
      }
      router.refresh();
    });

    return () => subscription.unsubscribe();
  }, [router, supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* 認証モーダル */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* ヘッダー */}
      <header className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                AI-ART
              </h1>
            </Link>
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                ホーム
              </Link>
              <Link href="/gallery" className="text-gray-400 hover:text-white transition-colors">
                ギャラリー
              </Link>
              {user && (
                <>
                  <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
                    ダッシュボード
                  </Link>
                  <Link href="/profile" className="text-gray-400 hover:text-white transition-colors">
                    プロフィール
                  </Link>
                </>
              )}
            </nav>
            <div className="flex items-center space-x-4">
              {!loading && (
                <>
                  {user ? (
                    <>
                      <Link
                        href="/gallery"
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl font-semibold"
                      >
                        投稿する
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-semibold"
                      >
                        ログアウト
                      </button>
                      {profile?.name && (
                        <span className="text-sm text-gray-300 hidden md:inline">
                          {profile.name}
                        </span>
                      )}
                    </>
                  ) : (
                    <Link href="/gallery" className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
                      ギャラリーを見る
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* ヒーローセクション */}
        <section className="text-center py-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              絵描きをAIから守る
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
              あなたの作品を保護し、AIによる無断使用から守る<br />
              アーティストのためのSNSプラットフォーム
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Link href="/gallery" className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-2xl text-lg font-semibold text-center">
                  投稿する
                </Link>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-2xl text-lg font-semibold"
                >
                  今すぐ始める
                </button>
              )}
              <Link href="/gallery" className="px-8 py-4 bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition-all shadow-lg border-2 border-gray-700 text-lg font-semibold text-center">
                ギャラリーを見る
              </Link>
            </div>
          </div>
        </section>

        {/* 特徴セクション */}
        <section className="py-16">
          <h3 className="text-3xl font-bold text-center mb-12 text-white">
            主な機能
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-shadow border border-gray-700">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h4 className="text-xl font-bold mb-4 text-white">AI防御アップロード</h4>
              <p className="text-gray-400">
                Canvasを使った透かし技術と微細なノイズ処理により、あなたの作品をAI学習データから保護します。
              </p>
            </div>

            <div className="bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-shadow border border-gray-700">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-xl font-bold mb-4 text-white">直接収益化</h4>
              <p className="text-gray-400">
                投げ銭機能（100円/500円/1000円）で作品への直接支援が可能。月間サポーターランキングで競い合えます。
              </p>
            </div>

            <div className="bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-shadow border border-gray-700">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-red-500 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h4 className="text-xl font-bold mb-4 text-white">匿名/公開選択</h4>
              <p className="text-gray-400">
                プロフィール設定でランキングでの匿名表示を選択可能。支援額は集計され、ランキング争いを加速させます。
              </p>
            </div>
          </div>
        </section>

        {/* CTAセクション */}
        <section className="py-16 text-center">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-12 shadow-2xl">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
              あなたの作品を守り、収益化しましょう
            </h3>
            <p className="text-xl text-purple-100 mb-8">
              AI防御機能と投げ銭システムで、作品を保護しながら直接収益化
            </p>
            {user ? (
              <Link href="/gallery" className="inline-block px-8 py-4 bg-white text-purple-600 rounded-xl hover:bg-gray-100 transition-all shadow-lg hover:shadow-2xl text-lg font-semibold">
                投稿する
              </Link>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-8 py-4 bg-white text-purple-600 rounded-xl hover:bg-gray-100 transition-all shadow-lg hover:shadow-2xl text-lg font-semibold"
              >
                今すぐ始める
              </button>
            )}
          </div>
        </section>
      </main>

      {/* フッター */}
      <footer className="bg-gray-950 text-gray-400 py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">A</span>
                </div>
                <span className="text-white font-bold text-lg">AI-ART</span>
              </div>
              <p className="text-sm">
                アーティストの作品を保護し、AIによる無断使用から守るプラットフォーム
              </p>
            </div>
            <div>
              <h5 className="text-white font-semibold mb-4">製品</h5>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">機能</a></li>
                <li><a href="#" className="hover:text-white transition-colors">価格</a></li>
                <li><a href="#" className="hover:text-white transition-colors">セキュリティ</a></li>
              </ul>
            </div>
            <div>
              <h5 className="text-white font-semibold mb-4">会社</h5>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">私たちについて</a></li>
                <li><a href="#" className="hover:text-white transition-colors">ブログ</a></li>
                <li><a href="#" className="hover:text-white transition-colors">お問い合わせ</a></li>
              </ul>
            </div>
            <div>
              <h5 className="text-white font-semibold mb-4">サポート</h5>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">ヘルプセンター</a></li>
                <li><a href="#" className="hover:text-white transition-colors">利用規約</a></li>
                <li><a href="#" className="hover:text-white transition-colors">プライバシーポリシー</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2024 AI-ART. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
