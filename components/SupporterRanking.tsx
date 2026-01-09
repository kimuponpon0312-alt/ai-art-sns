'use client';

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
}

export default function SupporterRanking({ supporters }: SupporterRankingProps) {
  return (
    <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center">
        <span className="mr-2">🏆</span>
        月間サポーターランキング
      </h2>
      
      <div className="space-y-3">
        {supporters.length === 0 ? (
          <p className="text-gray-400 text-center py-8">まだサポーターがいません</p>
        ) : (
          supporters.map((supporter) => (
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

              {/* 名前と金額 */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold truncate">
                  {supporter.isAnonymous ? '匿名サポーター' : supporter.name}
                </p>
                <p className="text-purple-400 text-sm font-semibold">
                  ¥{supporter.totalAmount.toLocaleString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
