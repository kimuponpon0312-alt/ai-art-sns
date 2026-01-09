import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // 投稿一覧を取得
    const { data: posts, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('投稿取得エラー:', error);
      return NextResponse.json(
        { error: '投稿の取得に失敗しました' },
        { status: 500 }
      );
    }

    // データ形式を変換
    const formattedPosts = (posts || []).map(post => ({
      id: post.id,
      imageUrl: post.image_url,
      authorId: post.author_id,
      authorName: post.author_name,
      authorAvatar: post.author_avatar_url,
      title: post.title,
      description: post.description,
      totalSupport: post.total_support || 0,
      supportCount: post.support_count || 0,
      createdAt: post.created_at,
    }));

    return NextResponse.json({ posts: formattedPosts });
  } catch (error) {
    console.error('投稿取得エラー:', error);
    return NextResponse.json(
      { error: '投稿の取得に失敗しました' },
      { status: 500 }
    );
  }
}

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
    const { imageUrl, authorId, authorName, authorAvatar, title, description } = body;

    if (!imageUrl || !authorId || !authorName) {
      return NextResponse.json(
        { error: '必要なパラメータが不足しています' },
        { status: 400 }
      );
    }

    // 投稿者本人かチェック
    if (user.id !== authorId) {
      return NextResponse.json(
        { error: '不正なリクエストです' },
        { status: 403 }
      );
    }

    // 投稿をデータベースに保存
    const { data: newPost, error } = await supabase
      .from('posts')
      .insert({
        author_id: authorId,
        author_name: authorName,
        author_avatar_url: authorAvatar,
        image_url: imageUrl,
        title: title || '新しい作品',
        description: description,
        total_support: 0,
        support_count: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('投稿作成エラー:', error);
      return NextResponse.json(
        { error: '投稿の作成に失敗しました' },
        { status: 500 }
      );
    }

    // データ形式を変換
    const formattedPost = {
      id: newPost.id,
      imageUrl: newPost.image_url,
      authorId: newPost.author_id,
      authorName: newPost.author_name,
      authorAvatar: newPost.author_avatar_url,
      title: newPost.title,
      description: newPost.description,
      totalSupport: newPost.total_support || 0,
      supportCount: newPost.support_count || 0,
      createdAt: newPost.created_at,
    };

    return NextResponse.json({
      success: true,
      post: formattedPost,
    });
  } catch (error) {
    console.error('投稿作成エラー:', error);
    return NextResponse.json(
      { error: '投稿の作成に失敗しました' },
      { status: 500 }
    );
  }
}
