'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import PostCard from '@/components/PostCard';
import ImageUpload from '@/components/ImageUpload';

interface Post {
  id: string;
  imageUrl: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  title?: string;
  description?: string;
  totalSupport: number;
  supportCount: number;
}

export default function GalleryPage() {
  const router = useRouter();
  const supabase = createClient();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .single();

        if (profile) {
          setUserProfile(profile);
        }
      }
    };

    checkUser();
    fetchPosts();
  }, [router, supabase]);

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

  const handleImageProcessed = async (imageUrl: string) => {
    if (!user) {
      alert('ログインが必要です');
      router.push('/');
      return;
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', user.id)
        .single();

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl,
          authorId: user.id,
          authorName: profile?.name || user.email || '匿名アーティスト',
          authorAvatar: profile?.avatar_url,
          title: '新しい作品',
        }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchPosts();
        alert('投稿が完了しました！');
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('投稿エラー:', error);
      alert('投稿に失敗しました: ' + (error.message || 'エラーが発生しました'));
    }
  };

  const handleSupport = async (postId: string, amount: number) => {
    if (!user) {
      alert('ログインが必要です');
      router.push('/');
      return;
    }

    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          amount,
        }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchPosts();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('支援エラー:', error);
      alert('支援に失敗しました: ' + (error.message || 'エラーが発生しました'));
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
              <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                ホーム
              </Link>
              <Link href="/gallery" className="text-white font-semibold">
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
              {userProfile && (
                <span className="text-sm text-gray-300">
                  {userProfile.name || user?.email}
                </span>
              )}
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {user && (
          <div className="bg-gray-800 rounded-2xl p-6 mb-8 border border-gray-700">
            <h2 className="text-xl font-bold mb-4">新しい作品を投稿</h2>
            <ImageUpload onImageProcessed={handleImageProcessed} />
            <p className="text-sm text-gray-400 mt-4">
              ※ アップロードされた画像には自動的にAI防御用の透かしとノイズが追加されます
            </p>
          </div>
        )}

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
    </div>
  );
}
