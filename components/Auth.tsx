'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // 現在のユーザーを取得
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        // プロフィール情報を取得
        const { data: profileData } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .single();
        setProfile(profileData);
      }
    };

    fetchUser();

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // プロフィール情報を取得
        const { data: profileData } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', session.user.id)
          .single();
        setProfile(profileData);
        router.refresh();
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [router, supabase.auth, supabase]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        // サインアップ
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              name: email.split('@')[0], // デフォルト名をメールアドレスの@より前の部分に設定
            },
          },
        });
        if (error) throw error;
        
        // プロフィールが自動作成される（トリガーにより）
        // ただし、即座にログインする場合はプロフィールを確認
        if (data.user) {
          // プロフィール作成を確認（トリガーで作成されるが、念のため確認）
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              name: email.split('@')[0],
              ranking_display_mode: 'public', // デフォルトは公開
            }, {
              onConflict: 'id',
            });
          
          if (profileError) {
            console.error('プロフィール作成エラー:', profileError);
          }
        }
        
        alert('確認メールを送信しました。メールを確認してください。');
      } else {
        // サインイン
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        // ログイン成功後、ギャラリーページにリダイレクト
        router.push('/gallery');
      }
    } catch (error: any) {
      setError(error.message || 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      setError(error.message || 'Google認証に失敗しました');
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push('/');
    } catch (error: any) {
      setError(error.message || 'ログアウトに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <div className="flex items-center space-x-4">
        <div className="text-sm text-gray-300">
          {profile?.name || user.email}
        </div>
        <button
          onClick={handleSignOut}
          disabled={loading}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? '処理中...' : 'ログアウト'}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">
        {isSignUp ? 'アカウント作成' : 'ログイン'}
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-200 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleEmailAuth} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            メールアドレス
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="example@email.com"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            パスワード
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="6文字以上"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '処理中...' : isSignUp ? 'アカウント作成' : 'ログイン'}
        </button>
      </form>

      <div className="mt-4">
        <button
          onClick={handleGoogleAuth}
          disabled={loading}
          className="w-full px-6 py-3 bg-white hover:bg-gray-100 text-gray-800 rounded-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span>Googleでログイン</span>
        </button>
      </div>

      <div className="mt-4 text-center">
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          {isSignUp
            ? 'すでにアカウントをお持ちですか？ログイン'
            : 'アカウントをお持ちでない方はこちら'}
        </button>
      </div>
    </div>
  );
}
