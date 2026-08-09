import { createClient } from "@supabase/supabase-js";

function getAdminCredentials() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !secretKey) {
    throw new Error(
      "Missing VITE_SUPABASE_URL and SUPABASE_SECRET_KEY — run tests via `npm run test:e2e` so BWS secrets are injected.",
    );
  }

  return { supabaseUrl, secretKey };
}

function createAdminClient() {
  const { supabaseUrl, secretKey } = getAdminCredentials();
  return createClient(supabaseUrl, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

export function hasSupabaseAdminCredentials() {
  return Boolean(process.env.VITE_SUPABASE_URL && (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY));
}

export async function deleteSupabaseUser(userId: string) {
  const adminClient = createAdminClient();
  const { error } = await adminClient.auth.admin.deleteUser(userId);
  if (error) {
    throw new Error(`Failed to delete test user ${userId}: ${error.message}`);
  }
}

export async function deleteSupabaseUserByEmail(email: string) {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) {
    throw new Error(`Failed to find test user ${email}: ${error.message}`);
  }

  const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email.toLowerCase());
  if (user) {
    await deleteSupabaseUser(user.id);
  }
}
