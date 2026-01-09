'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface DashboardData {
  totalEarnings: number;
  totalDonations: number;
  postsCount: number;
  donations: Array<{
    id: string;
    amount: number;
    platform_fee: number;
    author_earning: number;
    created_at: string;
    post: {
      id: string;
      title: string;
      image_url: string;
    };
    supporter: {
      id: string;
      name: string;
      avatar_url?: string;
    };
  }>;
  posts: Array<{
    id: string;
    title: string;
    image_url: string;
    total_support: number;
    support_count: number;
    earnings: number;
  }>;
}

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        // ユーザー認証チェック
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          router.push('/login');
          return;
        }
        setUser(user);

        // プロフィール情報を取得
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('プロフィール取得エラー:', profileError);
        } else {
          setProfile(profileData);
        }

        // 自分の投稿を取得
        const { data: posts, error: postsError } = await supabase
          .from('posts')
          .select('id, title, image_url, total_support, support_count')
          .eq('author_id', user.id)
          .order('created_at', { ascending: false });

        if (postsError) {
          console.error('投稿取得エラー:', postsError);
          return;
        }

        // 各投稿の売上を取得
        const postsWithEarnings = await Promise.all(
          (posts || []).map(async (post) => {
            const { data: earnings } = await supabase
              .from('author_earnings')
              .select('total_earning')
              .eq('post_id', post.id)
              .single();

            return {
              ...post,
              earnings: earnings?.total_earning || 0,
            };
          })
        );

        // 自分の投稿への投げ銭を取得
        const postIds = (posts || []).map(p => p.id);
        let donations: any[] = [];
        
        if (postIds.length > 0) {
          const { data: donationsData, error: donationsError } = await supabase
            .from('donations')
            .select(`
              id,
              amount,
              platform_fee,
              author_earning,
              created_at,
              post_id,
              supporter_id
            `)
            .in('post_id', postIds)
            .order('created_at', { ascending: false })
            .limit(50);

          if (!donationsError && donationsData) {
            // サポーター情報を取得
            donations = await Promise.all(
              donationsData.map(async (donation) => {
                const { data: supporter } = await supabase
                  .from('profiles')
                  .select('name, avatar_url')
                  .eq('id', donation.supporter_id)
                  .single();

                const post = postsWithEarnings.find(p => p.id === donation.post_id);

                return {
                  ...donation,
                  post: post ? {
                    id: post.id,
                    title: post.title,
                    image_url: post.image_url,
                  } : null,
                  supporter: supporter ? {
                    id: donation.supporter_id,
                    name: supporter.name,
                    avatar_url: supporter.avatar_url,
                  } : {
                    id: donation.supporter_id,
                    name: '匿名ユーザー',
                  },
                };
              })
            );
          }
        }

        // 合計を計算
        const totalEarnings = postsWithEarnings.reduce((sum, post) => sum + post.earnings, 0);
        const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);

        setDashboardData({
          totalEarnings,
          totalDonations,
          postsCount: posts?.length || 0,
          donations,
          posts: postsWithEarnings,
        });
      } catch (error) {
        console.error('ダッシュボード読み込みエラー:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [router, supabase]);

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
      {/* ヘッダー */}
      <header className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                AI-ART Dashboard
              </h1>
            </div>
            <nav className="flex items-center space-x-6">
              <Link href="/gallery" className="text-gray-400 hover:text-white transition-colors">
                ギャラリー
              </Link>
              <Link href="/profile" className="text-gray-400 hover:text-white transition-colors">
                プロフィール
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-3xl font-bold mb-8">
          {profile?.name || user.email} のダッシュボード
        </h2>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <h3 className="text-gray-400 text-sm mb-2">総売上</h3>
            <p className="text-3xl font-bold text-green-400">
              ¥{dashboardData?.totalEarnings.toLocaleString() || 0}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              （手数料10%を差し引き済み）
            </p>
          </div>

          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <h3 className="text-gray-400 text-sm mb-2">総投げ銭額</h3>
            <p className="text-3xl font-bold text-purple-400">
              ¥{dashboardData?.totalDonations.toLocaleString() || 0}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              （手数料含む）
            </p>
          </div>

          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <h3 className="text-gray-400 text-sm mb-2">投稿数</h3>
            <p className="text-3xl font-bold text-blue-400">
              {dashboardData?.postsCount || 0}
            </p>
          </div>
        </div>

        {/* 投稿一覧と売上 */}
        <div className="bg-gray-800 rounded-2xl p-6 mb-8 border border-gray-700">
          <h3 className="text-xl font-bold mb-4">投稿別売上</h3>
          {dashboardData?.posts.length === 0 ? (
            <p className="text-gray-400 text-center py-8">まだ投稿がありません</p>
          ) : (
            <div className="space-y-4">
              {dashboardData?.posts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center space-x-4 p-4 bg-gray-700/50 rounded-lg"
                >
                  <img
                    src={post.image_url}
                    alt={post.title || '投稿'}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-white">{post.title || '無題'}</h4>
                    <p className="text-sm text-gray-400">
                      支援: {post.support_count}件 / ¥{post.total_support.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-400">
                      ¥{post.earnings.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">売上</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 投げ銭履歴 */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <h3 className="text-xl font-bold mb-4">投げ銭履歴</h3>
          {dashboardData?.donations.length === 0 ? (
            <p className="text-gray-400 text-center py-8">まだ投げ銭がありません</p>
          ) : (
            <div className="space-y-3">
              {dashboardData?.donations.map((donation) => (
                <div
                  key={donation.id}
                  className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    {donation.supporter?.avatar_url ? (
                      <img
                        src={donation.supporter.avatar_url}
                        alt={donation.supporter.name}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {donation.supporter?.name?.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-white">
                        {donation.supporter?.name || '匿名ユーザー'}
                      </p>
                      <p className="text-sm text-gray-400">
                        {donation.post?.title || '投稿'} への投げ銭
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(donation.created_at).toLocaleString('ja-JP')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-purple-400">
                      ¥{donation.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      手数料: ¥{donation.platform_fee.toLocaleString()}
                    </p>
                    <p className="text-xs text-green-400">
                      受取: ¥{donation.author_earning.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
