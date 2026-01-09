import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 認証チェック
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { postId, amount } = body;

    if (!postId || !amount) {
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

    // 投げ銭記録をdonationsテーブルに保存
    const { data: donationRecord, error: donationError } = await supabase
      .from('donations')
      .insert({
        post_id: postId,
        supporter_id: user.id,
        amount,
        platform_fee: platformFee,
        author_earning: authorEarning,
      })
      .select()
      .single();

    if (donationError) {
      console.error('投げ銭記録保存エラー:', donationError);
      return NextResponse.json(
        { error: '投げ銭記録の保存に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      donationId: donationRecord.id,
      amount,
      platformFee,
      authorEarning,
      message: '投げ銭が完了しました',
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
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (postId) {
      // 作者の売上を取得
      const { data: earnings } = await supabase
        .from('author_earnings')
        .select('total_earning')
        .eq('post_id', postId)
        .single();

      return NextResponse.json({ earnings: earnings?.total_earning || 0 });
    }

    return NextResponse.json({ error: '無効なリクエスト' }, { status: 400 });
  } catch (error) {
    console.error('GETエラー:', error);
    return NextResponse.json(
      { error: 'リクエスト処理に失敗しました' },
      { status: 500 }
    );
  }
}
