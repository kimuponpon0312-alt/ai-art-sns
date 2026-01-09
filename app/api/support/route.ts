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

    // サポーターの合計支援額を取得
    const { data: supporterTotal } = await supabase
      .from('supporter_totals')
      .select('total_amount')
      .eq('supporter_id', user.id)
      .single();

    return NextResponse.json({
      success: true,
      donationId: donationRecord.id,
      amount,
      platformFee,
      authorEarning,
      totalSupport: supporterTotal?.total_amount || amount,
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
    const type = searchParams.get('type');
    const authorId = searchParams.get('authorId'); // 作者ID（ランキング公開設定用）

    if (type === 'author' && postId) {
      // 作者の売上を取得
      const { data: earnings } = await supabase
        .from('author_earnings')
        .select('total_earning')
        .eq('post_id', postId)
        .single();

      return NextResponse.json({ earnings: earnings?.total_earning || 0 });
    }

  if (type === 'supporters') {
    // サポーターランキングを取得
    // 作者IDが指定されている場合、ranking_display_modeを確認
    if (authorId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('ranking_display_mode, show_rank_mode')
        .eq('id', authorId)
        .single();

      // ranking_display_modeがhiddenの場合、空の配列を返す
      // privateの場合は、リクエストしたユーザーが所有者かどうかをフロントエンドで判断
      if (profile && profile.ranking_display_mode === 'hidden') {
        return NextResponse.json({ supporters: [], rankingDisplayMode: 'hidden' });
      }
    }

      // サポーター合計を取得してランキングを作成
      const { data: supporterTotals, error } = await supabase
        .from('supporter_totals')
        .select(`
          supporter_id,
          total_amount,
          profiles!supporter_totals_supporter_id_fkey (
            name,
            avatar_url,
            is_anonymous
          )
        `)
        .order('total_amount', { ascending: false })
        .limit(10);

      if (error) {
        console.error('ランキング取得エラー:', error);
        return NextResponse.json(
          { error: 'ランキングの取得に失敗しました' },
          { status: 500 }
        );
      }

      const supporters = (supporterTotals || []).map((item, index) => {
        const profile = item.profiles as any;
        return {
          id: item.supporter_id,
          totalAmount: item.total_amount,
          name: profile?.name || `ユーザー${item.supporter_id.slice(-4)}`,
          avatar: profile?.avatar_url,
          isAnonymous: profile?.is_anonymous || false,
          rank: index + 1,
        };
      });

      return NextResponse.json({ supporters });
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
