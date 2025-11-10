import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    const { data: events, error } = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) throw error

    return NextResponse.json({ events: events || [] })
  } catch (error) {
    console.error("[v0] Error fetching events:", error)
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
  }
}
