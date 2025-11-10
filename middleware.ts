import { NextResponse, type NextRequest } from "next/server"

// Middleware no longer depends on Supabase. It simply passes requests through.
export async function middleware(request: NextRequest) {
  // If you need to implement cookie rewriting or auth refresh without Supabase,
  // add the logic here. For now we return the default next response.
  return NextResponse.next({ request })
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
