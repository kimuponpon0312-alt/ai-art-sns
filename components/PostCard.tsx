'use client';

import { useState } from 'react';
import TiledImage from './TiledImage';

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

interface PostCardProps {
  post: Post;
  onSupport: (postId: string, amount: number) => Promise<void>;
}

export default function PostCard({ post, onSupport }: PostCardProps) {
  const [isSupporting, setIsSupporting] = useState(false);
  const [localTotalSupport, setLocalTotalSupport] = useState(post.totalSupport);
  const [localSupportCount, setLocalSupportCount] = useState(post.supportCount);

  const handleSupport = async (amount: number) => {
    setIsSupporting(true);
    try {
      await onSupport(post.id, amount);
      setLocalTotalSupport(prev => prev + amount);
      setLocalSupportCount(prev => prev + 1);
    } catch (error) {
      console.error('支援エラー:', error);
      alert('支援に失敗しました');
    } finally {
      setIsSupporting(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all border border-gray-700">
      {/* 画像（タイル表示・右クリック禁止） */}
      <div className="relative w-full aspect-square bg-gray-900" data-protected-image="true">
        <TiledImage
          imageUrl={post.imageUrl}
          alt={post.title || '作品'}
          tileSize={200}
        />
      </div>

      {/* 投稿情報 */}
      <div className="p-6">
        {/* 作者情報 */}
        <div className="flex items-center space-x-3 mb-4">
          {post.authorAvatar ? (
            <img
              src={post.authorAvatar}
              alt={post.authorName}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white font-semibold">
                {post.authorName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <p className="font-semibold text-white">{post.authorName}</p>
            {post.title && (
              <p className="text-sm text-gray-400">{post.title}</p>
            )}
          </div>
        </div>

        {/* 説明 */}
        {post.description && (
          <p className="text-gray-300 mb-4 line-clamp-2">{post.description}</p>
        )}

        {/* 支援統計 */}
        <div className="flex items-center justify-between mb-4 text-sm">
          <div className="text-gray-400">
            <span className="text-purple-400 font-semibold">
              ¥{localTotalSupport.toLocaleString()}
            </span>
            {' '}の支援
          </div>
          <div className="text-gray-400">
            {localSupportCount}人のサポーター
          </div>
        </div>

        {/* 支援ボタン */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleSupport(100)}
            disabled={isSupporting}
            className="px-4 py-3 bg-gray-700 hover:bg-purple-600 text-white rounded-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ¥100
          </button>
          <button
            onClick={() => handleSupport(500)}
            disabled={isSupporting}
            className="px-4 py-3 bg-gray-700 hover:bg-pink-600 text-white rounded-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ¥500
          </button>
          <button
            onClick={() => handleSupport(1000)}
            disabled={isSupporting}
            className="px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ¥1000
          </button>
        </div>
      </div>
    </div>
  );
}
