import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get("wallet")

    let query = supabase.from("fireblocks_vaults").select("*").order("created_at", { ascending: false })

    if (walletAddress) {
      query = query.eq("stellar_address", walletAddress)
    }

    const { data: vaults, error } = await query

    if (error) throw error

    return NextResponse.json({ vaults: vaults || [] })
  } catch (error) {
    console.error("Error fetching vaults:", error)
    return NextResponse.json({ error: "Failed to fetch vaults", vaults: [] }, { status: 500 })
  }
}
