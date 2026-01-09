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
const supporterTotals: Record<string, number> = {};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, supporterId, amount } = body;

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

    // サポーターの合計支援額を更新
    if (!supporterTotals[supporterId]) {
      supporterTotals[supporterId] = 0;
    }
    supporterTotals[supporterId] += amount;

    return NextResponse.json({
      success: true,
      supportId: supportRecord.id,
      amount,
      platformFee,
      authorEarning,
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
    // サポーターランキングを取得
    const supporters = Object.entries(supporterTotals)
      .map(([supporterId, totalAmount]) => ({
        id: supporterId,
        totalAmount,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10)
      .map((supporter, index) => ({
        ...supporter,
        rank: index + 1,
      }));

    return NextResponse.json({ supporters });
  }

  return NextResponse.json({ error: '無効なリクエスト' }, { status: 400 });
}
