'use client';

import { useState, useEffect } from 'react';
import PostCard from '@/components/PostCard';
import SupporterRanking from '@/components/SupporterRanking';
import ImageUpload from '@/components/ImageUpload';

interface Post {
  id: string;
  imageUrl: string;
  authorName: string;
  authorAvatar?: string;
  title?: string;
  description?: string;
  totalSupport: number;
  supportCount: number;
}

interface Supporter {
  id: string;
  name: string;
  avatar?: string;
  totalAmount: number;
  isAnonymous: boolean;
  rank: number;
}

export default function GalleryPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 投稿一覧を取得
  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/posts');
      const data = await response.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error('投稿取得エラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // サポーターランキングを取得
  const fetchSupporters = async () => {
    try {
      const response = await fetch('/api/support?type=supporters');
      const data = await response.json();
      
      // APIから取得したサポーター情報を使用（プロフィール情報も含まれる）
      setSupporters(data.supporters || []);
    } catch (error) {
      console.error('ランキング取得エラー:', error);
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchSupporters();
  }, []);

  // 画像アップロード処理
  const handleImageProcessed = async (imageUrl: string) => {
    const userProfile = localStorage.getItem('userProfile');
    const profile = userProfile ? JSON.parse(userProfile) : null;

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl,
          authorId: `user_${Date.now()}`,
          authorName: profile?.name || '匿名アーティスト',
          authorAvatar: profile?.avatar,
          title: '新しい作品',
        }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchPosts();
        alert('投稿が完了しました！');
      }
    } catch (error) {
      console.error('投稿エラー:', error);
      alert('投稿に失敗しました');
    }
  };

  // 支援処理
  const handleSupport = async (postId: string, amount: number) => {
    const userProfile = localStorage.getItem('userProfile');
    const profile = userProfile ? JSON.parse(userProfile) : null;
    
    // ユーザーIDを生成（プロフィールにIDがない場合は作成）
    let supporterId = profile?.id;
    if (!supporterId) {
      // ローカルストレージから既存のIDを取得するか、新規作成
      let storedId = localStorage.getItem('userId');
      if (!storedId) {
        storedId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('userId', storedId);
      }
      supporterId = storedId;
    }

    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          supporterId,
          amount,
          supporterName: profile?.name,
          supporterAvatar: profile?.avatar,
          isAnonymous: profile?.isAnonymous || false,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // ランキングと投稿を更新
        await fetchSupporters();
        await fetchPosts();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('支援エラー:', error);
      throw error;
    }
  };

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
                AI-ART Gallery
              </h1>
            </div>
            <nav className="flex items-center space-x-6">
              <a href="/" className="text-gray-400 hover:text-white transition-colors">
                ホーム
              </a>
              <a href="/gallery" className="text-white font-semibold">
                ギャラリー
              </a>
              <a href="/profile" className="text-gray-400 hover:text-white transition-colors">
                プロフィール
              </a>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* メインコンテンツ */}
          <div className="lg:col-span-3">
            {/* アップロードセクション */}
            <div className="bg-gray-800 rounded-2xl p-6 mb-8 border border-gray-700">
              <h2 className="text-xl font-bold mb-4">新しい作品を投稿</h2>
              <ImageUpload onImageProcessed={handleImageProcessed} />
              <p className="text-sm text-gray-400 mt-4">
                ※ アップロードされた画像には自動的にAI防御用の透かしとノイズが追加されます
              </p>
            </div>

            {/* 投稿一覧 */}
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-gray-400">読み込み中...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12 bg-gray-800 rounded-2xl border border-gray-700">
                <p className="text-gray-400 mb-4">まだ投稿がありません</p>
                <p className="text-sm text-gray-500">最初の作品を投稿してみましょう！</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onSupport={handleSupport}
                  />
                ))}
              </div>
            )}
          </div>

          {/* サイドバー */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <SupporterRanking supporters={supporters} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
