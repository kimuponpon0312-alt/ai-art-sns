import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.user) {
      // プロフィールが存在するか確認し、存在しない場合は作成
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single();
      
      if (!profile && !profileError) {
        // プロフィールが存在しない場合は作成
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'ユーザー',
            ranking_display_mode: 'public',
          });
        
        if (insertError) {
          console.error('プロフィール作成エラー:', insertError);
        }
      }
    }
  }

  // ギャラリーページにリダイレクト
  return NextResponse.redirect(`${origin}/gallery`);
}
