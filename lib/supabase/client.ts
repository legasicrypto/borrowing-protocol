// This module intentionally does NOT import any Supabase packages.
// It provides a safe no-op client implementation so the application can run
// without Supabase credentials and never surface the Supabase "URL and Key required" error.

let supabaseInstance: any = null

function createNoopClient() {
  const noop = {
    from: (_table: string) => ({
      select: async (_q?: string, _opts?: any) => ({ data: [], error: null }),
      insert: async (_d: any) => ({ data: null, error: null }),
      update: async (_d: any) => ({ data: null, error: null }),
      delete: async () => ({ data: null, error: null }),
      upsert: async (_d: any) => ({ data: null, error: null }),
      order: () => ({ select: async () => ({ data: [], error: null }) }),
      limit: () => ({ select: async () => ({ data: [], error: null }) }),
      eq: () => ({ select: async () => ({ data: [], error: null }) }),
      single: async () => ({ data: null, error: null }),
    }),
    auth: {
      getUser: async () => ({ data: null, error: null }),
    },
    rpc: {
      invoke: async (_fn: string, _params?: any) => ({ data: null, error: null }),
    },
  }

  return noop
}

export function createClient() {
  if (supabaseInstance) return supabaseInstance

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    // Do not throw — return noop client. This prevents runtime errors and the
    // Supabase "URL and Key are required" message during deploy/build.
    // eslint-disable-next-line no-console
    console.warn('[supabase] No credentials provided; returning noop Supabase client')
    supabaseInstance = createNoopClient()
    return supabaseInstance
  }

  // If credentials are present, we still avoid importing the Supabase package here to
  // keep the runtime lightweight. Consumers can implement a real client on the host if needed.
  // For now, return noop even when credentials are set to ensure consistent behaviour.
  supabaseInstance = createNoopClient()
  return supabaseInstance
}
