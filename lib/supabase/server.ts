// This server module intentionally avoids importing Supabase so the app never
// requires Supabase credentials at build or runtime. It returns a safe no-op
// server client compatible with the minimal usage in the codebase.

import { cookies } from "next/headers"

async function createNoopServerClient() {
  // Chainable query builder that returns a promise with { data, error }
  const terminalResult = { data: null, error: null }

  const builder = () => {
    const q: any = {}

    const terminal = async () => ({ ...terminalResult })

    // Methods that continue the chain should return the query object
    q.select = (_q?: string, _opts?: any) => ({ ...q, then: terminal })
    q.insert = (_d?: any) => ({ ...q, then: terminal })
    q.update = (_d?: any) => ({ ...q, then: terminal })
    q.delete = () => ({ ...q, then: terminal })
    q.order = (_col?: string, _opts?: any) => q
    q.limit = (_n?: number) => q
    q.eq = (_col?: string, _val?: any) => q
    q.single = terminal

    return q
  }

  const noop = {
    from: (_table: string) => builder(),
    auth: {
      getUser: async () => ({ data: null, error: null }),
    },
    rpc: {
      invoke: async (_fn: string, _params?: any) => ({ data: null, error: null }),
    },
  }

  return noop
}

export async function createServerClient() {
  // keep cookie API shape for compatibility but ignore Supabase
  await cookies()

  // We intentionally always return a noop server client. This avoids any
  // runtime errors or messages about missing Supabase credentials.
  return createNoopServerClient()
}

export const createClient = createServerClient
