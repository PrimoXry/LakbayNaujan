import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type UserInput = {
  email?: unknown;
  username?: unknown;
  display_name?: unknown;
  role?: unknown;
  password?: unknown;
};

type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  role: 'user' | 'admin';
  created_at: string;
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function validateUserInput(input: UserInput, requirePassword: boolean): { email: string; username: string; display_name: string; role: 'user' | 'admin'; password?: string } {
  const email = text(input.email).toLowerCase();
  const username = text(input.username);
  const display_name = text(input.display_name);
  const role = input.role === 'admin' ? 'admin' : input.role === 'user' ? 'user' : '';
  const password = text(input.password);

  if (!email || !/^\S+@\S+\.\S+$/.test(email) || email.length > 320) throw new Error('Enter a valid email address.');
  if (!/^[A-Za-z0-9_]{3,30}$/.test(username)) throw new Error('Username must be 3–30 letters, numbers, or underscores.');
  if (!display_name || display_name.length > 80) throw new Error('Display name must be between 1 and 80 characters.');
  if (!role) throw new Error('Select a valid user role.');
  if (requirePassword && password.length < 6) throw new Error('Password must be at least 6 characters.');
  if (!requirePassword && password && password.length < 6) throw new Error('Password must be at least 6 characters when provided.');
  return { email, username, display_name, role, ...(password ? { password } : {}) };
}

function userResponse(authUser: { id: string; email?: string; created_at: string; last_sign_in_at?: string | null; email_confirmed_at?: string | null }, profile: Profile): Record<string, unknown> {
  return {
    id: authUser.id,
    email: authUser.email ?? '',
    username: profile.username,
    display_name: profile.display_name,
    role: profile.role,
    created_at: authUser.created_at,
    last_sign_in_at: authUser.last_sign_in_at ?? null,
    email_confirmed_at: authUser.email_confirmed_at ?? null,
  };
}

async function listAllUsers(client: ReturnType<typeof createClient>) {
  const users = [];
  const perPage = 1000;
  for (let page = 1; ; page += 1) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < perPage) break;
  }
  return users;
}

async function requireAdmin(request: Request, client: ReturnType<typeof createClient>) {
  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) throw new Error('Authentication is required.');
  const { data, error } = await client.auth.getUser(authorization.slice('Bearer '.length));
  if (error || !data.user) throw new Error('Your session is invalid or expired.');
  const { data: profile, error: profileError } = await client.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
  if (profileError) throw profileError;
  if (profile?.role !== 'admin') throw new Error('Only an administrator can manage users.');
  return data.user;
}

async function profileFor(client: ReturnType<typeof createClient>, id: string): Promise<Profile> {
  const { data, error } = await client.from('profiles').select('id, username, display_name, role, created_at').eq('id', id).single();
  if (error || !data) throw error ?? new Error('The user profile could not be found.');
  return data as Profile;
}

async function handle(request: Request) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) throw new Error('User management is not configured on the server.');

  const client = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const currentUser = await requireAdmin(request, client);
  const body = await request.json().catch(() => ({})) as { action?: unknown; id?: unknown; user?: UserInput };
  const action = text(body.action);

  if (action === 'list') {
    const [authUsers, profilesResult] = await Promise.all([
      listAllUsers(client),
      client.from('profiles').select('id, username, display_name, role, created_at').order('created_at', { ascending: false }),
    ]);
    if (profilesResult.error) throw profilesResult.error;
    const profiles = new Map((profilesResult.data as Profile[]).map(profile => [profile.id, profile]));
    return json({ users: authUsers.flatMap(user => {
      const profile = profiles.get(user.id);
      return profile ? [userResponse(user, profile)] : [];
    }) });
  }

  if (action === 'create') {
    const input = validateUserInput(body.user ?? {}, true);
    const { data, error } = await client.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: { username: input.username, display_name: input.display_name },
    });
    if (error || !data.user) throw error ?? new Error('The user could not be created.');
    try {
      const { error: profileError } = await client.from('profiles').update({ username: input.username, display_name: input.display_name, role: input.role }).eq('id', data.user.id);
      if (profileError) throw profileError;
      return json({ user: userResponse(data.user, await profileFor(client, data.user.id)) });
    } catch (error) {
      await client.auth.admin.deleteUser(data.user.id);
      throw error;
    }
  }

  const id = text(body.id);
  if (!id) throw new Error('A user id is required.');
  if (action === 'delete') {
    if (id === currentUser.id) throw new Error('You cannot delete the account currently managing the dashboard.');
    const { error } = await client.auth.admin.deleteUser(id);
    if (error) throw error;
    return json({ ok: true });
  }

  if (action === 'update') {
    const input = validateUserInput(body.user ?? {}, false);
    if (id === currentUser.id && input.role !== 'admin') throw new Error('You cannot remove administrator access from the account currently managing the dashboard.');
    const authUpdates: Record<string, unknown> = {
      email: input.email,
      email_confirm: true,
      user_metadata: { username: input.username, display_name: input.display_name },
    };
    if (input.password) authUpdates.password = input.password;
    const { data, error } = await client.auth.admin.updateUserById(id, authUpdates);
    if (error || !data.user) throw error ?? new Error('The user could not be updated.');
    const { error: profileError } = await client.from('profiles').update({ username: input.username, display_name: input.display_name, role: input.role }).eq('id', id);
    if (profileError) throw profileError;
    return json({ user: userResponse(data.user, await profileFor(client, id)) });
  }

  throw new Error('Unknown user management action.');
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Only POST requests are supported.' }, 405);
  try {
    return await handle(request);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'The user management request failed.';
    const status = /administrator|authentication|session/i.test(message) ? 403 : 400;
    return json({ error: message }, status);
  }
});
