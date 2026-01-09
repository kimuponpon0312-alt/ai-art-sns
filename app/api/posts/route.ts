import { NextRequest, NextResponse } from 'next/server';

// 仮の投稿データ（実際の実装ではデータベースを使用）
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
  createdAt: Date;
}

const posts: Post[] = [
  // サンプルデータ（開発用）
];

export async function GET() {
  // 投稿一覧を取得（実際の実装ではデータベースから取得）
  return NextResponse.json({ posts });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl, authorId, authorName, authorAvatar, title, description } = body;

    if (!imageUrl || !authorId || !authorName) {
      return NextResponse.json(
        { error: '必要なパラメータが不足しています' },
        { status: 400 }
      );
    }

    const newPost: Post = {
      id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      imageUrl,
      authorId,
      authorName,
      authorAvatar,
      title,
      description,
      totalSupport: 0,
      supportCount: 0,
      createdAt: new Date(),
    };

    posts.push(newPost);

    return NextResponse.json({
      success: true,
      post: newPost,
    });
  } catch (error) {
    console.error('投稿作成エラー:', error);
    return NextResponse.json(
      { error: '投稿の作成に失敗しました' },
      { status: 500 }
    );
  }
}
