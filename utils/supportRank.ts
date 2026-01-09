// 支援ランクの計算と表示

export interface SupportRank {
  rank: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  label: string;
  icon: string;
  color: string;
}

// 支援額からランクを計算
export function calculateSupportRank(amount: number): SupportRank {
  if (amount >= 10000) {
    return {
      rank: 'diamond',
      label: 'ダイヤモンド',
      icon: '💎',
      color: 'text-cyan-400',
    };
  } else if (amount >= 5000) {
    return {
      rank: 'platinum',
      label: 'プラチナ',
      icon: '💠',
      color: 'text-gray-300',
    };
  } else if (amount >= 2000) {
    return {
      rank: 'gold',
      label: 'ゴールド',
      icon: '🥇',
      color: 'text-yellow-400',
    };
  } else if (amount >= 1000) {
    return {
      rank: 'silver',
      label: 'シルバー',
      icon: '🥈',
      color: 'text-gray-400',
    };
  } else {
    return {
      rank: 'bronze',
      label: 'ブロンズ',
      icon: '🥉',
      color: 'text-orange-400',
    };
  }
}

// 複数の支援額から最上位ランクを取得
export function getHighestSupportRank(amounts: number[]): SupportRank {
  if (amounts.length === 0) {
    return calculateSupportRank(0);
  }
  
  const maxAmount = Math.max(...amounts);
  return calculateSupportRank(maxAmount);
}
