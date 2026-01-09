-- ユーザープロフィールテーブル
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  avatar_url TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  show_ranking_public BOOLEAN DEFAULT true,
  show_rank_mode BOOLEAN DEFAULT false, -- true: ランク表示, false: 金額表示
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 投稿テーブル
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_avatar_url TEXT,
  image_url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  total_support INTEGER DEFAULT 0,
  support_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 支援記録テーブル
CREATE TABLE IF NOT EXISTS supports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  supporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  platform_fee INTEGER NOT NULL,
  author_earning INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 作者ごとの売上集計テーブル（高速化のため）
CREATE TABLE IF NOT EXISTS author_earnings (
  post_id UUID PRIMARY KEY REFERENCES posts(id) ON DELETE CASCADE,
  total_earning INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- サポーターごとの合計支援額（ランキング用）
CREATE TABLE IF NOT EXISTS supporter_totals (
  supporter_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_amount INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_supports_post_id ON supports(post_id);
CREATE INDEX IF NOT EXISTS idx_supports_supporter_id ON supports(supporter_id);
CREATE INDEX IF NOT EXISTS idx_supports_created_at ON supports(created_at DESC);

-- RLS (Row Level Security) ポリシー
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE supports ENABLE ROW LEVEL SECURITY;
ALTER TABLE author_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE supporter_totals ENABLE ROW LEVEL SECURITY;

-- プロフィールのRLSポリシー
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 投稿のRLSポリシー
CREATE POLICY "Anyone can view posts" ON posts
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own posts" ON posts
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own posts" ON posts
  FOR DELETE USING (auth.uid() = author_id);

-- 支援記録のRLSポリシー
CREATE POLICY "Anyone can view supports" ON supports
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create supports" ON supports
  FOR INSERT WITH CHECK (auth.uid() = supporter_id);

-- 作者売上のRLSポリシー
CREATE POLICY "Users can view author earnings for their own posts" ON author_earnings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = author_earnings.post_id
      AND (
        posts.author_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = posts.author_id
          AND profiles.show_ranking_public = true
        )
      )
    )
  );

-- サポーター合計のRLSポリシー
CREATE POLICY "Users can view supporter totals" ON supporter_totals
  FOR SELECT USING (true);

-- 関数: プロフィール作成時の自動作成
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガー: 新規ユーザー登録時にプロフィールを作成
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 関数: 支援記録作成時の売上更新
CREATE OR REPLACE FUNCTION public.update_earnings_on_support()
RETURNS TRIGGER AS $$
BEGIN
  -- 作者の売上を更新
  INSERT INTO author_earnings (post_id, total_earning, updated_at)
  VALUES (NEW.post_id, NEW.author_earning, NOW())
  ON CONFLICT (post_id) DO UPDATE
  SET total_earning = author_earnings.total_earning + NEW.author_earning,
      updated_at = NOW();

  -- 投稿の統計を更新
  UPDATE posts
  SET total_support = total_support + NEW.amount,
      support_count = support_count + 1,
      updated_at = NOW()
  WHERE id = NEW.post_id;

  -- サポーターの合計支援額を更新
  INSERT INTO supporter_totals (supporter_id, total_amount, updated_at)
  VALUES (NEW.supporter_id, NEW.amount, NOW())
  ON CONFLICT (supporter_id) DO UPDATE
  SET total_amount = supporter_totals.total_amount + NEW.amount,
      updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガー: 支援記録作成時に売上を更新
DROP TRIGGER IF EXISTS on_support_created ON supports;
CREATE TRIGGER on_support_created
  AFTER INSERT ON supports
  FOR EACH ROW EXECUTE FUNCTION public.update_earnings_on_support();
