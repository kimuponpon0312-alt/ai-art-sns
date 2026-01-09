'use client';

import { calculateSupportRank } from '@/utils/supportRank';

interface Supporter {
  id: string;
  name: string;
  avatar?: string;
  totalAmount: number;
  isAnonymous: boolean;
  rank: number;
}

interface SupporterRankingProps {
  supporters: Supporter[];
  showRankMode?: boolean; // ランク表示モード（true: 称号表示, false: 金額表示）
  rankingDisplayMode?: 'public' | 'private' | 'hidden'; // ランキング表示モード
  isOwner?: boolean; // ページの所有者かどうか
}

export default function SupporterRanking({ 
  supporters, 
  showRankMode = false, 
  rankingDisplayMode = 'public',
  isOwner = false,
}: SupporterRankingProps) {
  // ランキング表示モードに応じた処理
  if (rankingDisplayMode === 'hidden') {
    // 非表示: ランキングを完全に非表示
    return null;
  }

  if (rankingDisplayMode === 'private' && !isOwner) {
    // 非公開: 所有者のみ閲覧可能
    return (
      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center">
          <span className="mr-2">🏆</span>
          月間サポーターランキング
        </h2>
        <p className="text-gray-400 text-center py-8">
          このランキングは非公開です
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center">
        <span className="mr-2">🏆</span>
        月間サポーターランキング
        {showRankMode && (
          <span className="ml-2 text-sm text-gray-400 font-normal">
            (ランク表示)
          </span>
        )}
      </h2>
      
      <div className="space-y-3">
        {supporters.length === 0 ? (
          <p className="text-gray-400 text-center py-8">まだサポーターがいません</p>
        ) : (
          supporters.map((supporter) => {
            const supportRank = calculateSupportRank(supporter.totalAmount);
            
            return (
              <div
                key={supporter.id}
                className="flex items-center space-x-3 p-3 rounded-lg bg-gray-700/50 hover:bg-gray-700 transition-colors"
              >
                {/* ランク表示 */}
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                  {supporter.rank <= 3 ? (
                    <span className="text-2xl">
                      {supporter.rank === 1 ? '🥇' : supporter.rank === 2 ? '🥈' : '🥉'}
                    </span>
                  ) : (
                    <span className="text-gray-400 font-bold">#{supporter.rank}</span>
                  )}
                </div>

                {/* アバター */}
                {supporter.avatar ? (
                  <img
                    src={supporter.avatar}
                    alt={supporter.name}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {supporter.isAnonymous ? '?' : supporter.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}

                {/* 名前と金額/ランク */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold truncate">
                    {supporter.isAnonymous ? '匿名サポーター' : supporter.name}
                  </p>
                  {showRankMode ? (
                    <div className="flex items-center space-x-1">
                      <span className={`${supportRank.color} text-sm font-semibold`}>
                        {supportRank.icon}
                      </span>
                      <span className={`${supportRank.color} text-sm font-semibold`}>
                        {supportRank.label}
                      </span>
                    </div>
                  ) : (
                    <p className="text-purple-400 text-sm font-semibold">
                      ¥{supporter.totalAmount.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
