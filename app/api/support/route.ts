import { NextRequest, NextResponse } from 'next/server';

// 仮のデータストア（実際の実装ではデータベースを使用）
interface SupportRecord {
  id: string;
  postId: string;
  supporterId: string;
  amount: number;
  timestamp: Date;
}

// メモリ内ストレージ（開発用）
const supportRecords: SupportRecord[] = [];
const authorEarnings: Record<string, number> = {};
// ユーザーIDごとの支援額を累積管理
const supporterTotals: Record<string, number> = {};
// サポーターのプロフィール情報（名前、アバター、匿名設定）
const supporterProfiles: Record<string, {
  name: string;
  avatar?: string;
  isAnonymous: boolean;
}> = {};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, supporterId, amount, supporterName, supporterAvatar, isAnonymous } = body;

    if (!postId || !supporterId || !amount) {
      return NextResponse.json(
        { error: '必要なパラメータが不足しています' },
        { status: 400 }
      );
    }

    // 支援額の検証
    const validAmounts = [100, 500, 1000];
    if (!validAmounts.includes(amount)) {
      return NextResponse.json(
        { error: '無効な支援額です' },
        { status: 400 }
      );
    }

    // 運営マージン（10%）を計算
    const platformFee = Math.floor(amount * 0.1);
    const authorEarning = amount - platformFee;

    // 支援記録を作成
    const supportRecord: SupportRecord = {
      id: `support_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      postId,
      supporterId,
      amount,
      timestamp: new Date(),
    };

    supportRecords.push(supportRecord);

    // 作者の売上を更新
    if (!authorEarnings[postId]) {
      authorEarnings[postId] = 0;
    }
    authorEarnings[postId] += authorEarning;

    // サポーターの合計支援額を累積加算（ユーザーIDごと）
    if (!supporterTotals[supporterId]) {
      supporterTotals[supporterId] = 0;
    }
    supporterTotals[supporterId] += amount; // 累積加算

    // サポーターのプロフィール情報を更新（初回または更新時）
    if (supporterName !== undefined || supporterAvatar !== undefined || isAnonymous !== undefined) {
      if (!supporterProfiles[supporterId]) {
        supporterProfiles[supporterId] = {
          name: supporterName || `ユーザー${supporterId.slice(-4)}`,
          avatar: supporterAvatar,
          isAnonymous: isAnonymous || false,
        };
      } else {
        // 既存のプロフィールを更新（提供された値のみ）
        if (supporterName !== undefined) {
          supporterProfiles[supporterId].name = supporterName;
        }
        if (supporterAvatar !== undefined) {
          supporterProfiles[supporterId].avatar = supporterAvatar;
        }
        if (isAnonymous !== undefined) {
          supporterProfiles[supporterId].isAnonymous = isAnonymous;
        }
      }
    }

    return NextResponse.json({
      success: true,
      supportId: supportRecord.id,
      amount,
      platformFee,
      authorEarning,
      totalSupport: supporterTotals[supporterId],
      message: '支援が完了しました',
    });
  } catch (error) {
    console.error('支援処理エラー:', error);
    return NextResponse.json(
      { error: '支援処理に失敗しました' },
      { status: 500 }
    );
  }
}

// 作者の売上を取得
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get('postId');
  const type = searchParams.get('type');

  if (type === 'author' && postId) {
    // 作者の売上を取得
    const earnings = authorEarnings[postId] || 0;
    return NextResponse.json({ earnings });
  }

  if (type === 'supporters') {
    // サポーターランキングを取得（ユーザーIDごとに統合）
    const supportersMap = new Map<string, {
      id: string;
      totalAmount: number;
      name: string;
      avatar?: string;
      isAnonymous: boolean;
    }>();

    // サポーターごとの合計金額を計算（既に累積されているが、念のため再集計）
    Object.entries(supporterTotals).forEach(([supporterId, totalAmount]) => {
      const profile = supporterProfiles[supporterId] || {
        name: `ユーザー${supporterId.slice(-4)}`,
        avatar: undefined,
        isAnonymous: false,
      };

      // 同じユーザーIDは1つのエントリに統合
      supportersMap.set(supporterId, {
        id: supporterId,
        totalAmount, // 既に累積された値
        name: profile.name,
        avatar: profile.avatar,
        isAnonymous: profile.isAnonymous,
      });
    });

    // 合計金額が高い順にソートしてトップ10を取得
    const supporters = Array.from(supportersMap.values())
      .sort((a, b) => b.totalAmount - a.totalAmount) // 降順ソート
      .slice(0, 10) // トップ10
      .map((supporter, index) => ({
        ...supporter,
        rank: index + 1,
      }));

    return NextResponse.json({ supporters });
  }

  return NextResponse.json({ error: '無効なリクエスト' }, { status: 400 });
}
