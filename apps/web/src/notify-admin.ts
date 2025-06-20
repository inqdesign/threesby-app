import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export async function notifyAdmin(request: Request) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!
  );
  const resend = new Resend(Deno.env.get('RESEND_API_KEY')!);

  const { profile_id } = await request.json();

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', profile_id)
    .single();

  await resend.emails.send({
    from: 'OnShelf <noreply@onshelf.app>',
    to: 'admin@onshelf.app',
    subject: 'New Curator Submission',
    html: `
      <p>New submission from ${profile.full_name} (${profile.email}).</p>
      <p>Review at: <a href="https://app.onshelf.app/admin/submissions">Admin Dashboard</a></p>
    `,
  });

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}