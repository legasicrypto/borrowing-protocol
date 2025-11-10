import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()

  const { stellar_address, kyc_status, kyc_provider, user_type } = body

  if (!stellar_address || !kyc_status) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("kyc_registry")
    .upsert(
      {
        stellar_address,
        kyc_status,
        kyc_provider,
        user_type,
        verified_at: kyc_status === "verified" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "stellar_address",
      },
    )
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Log audit event
  await supabase.from("audit_logs").insert({
    event_type: "kyc_updated",
    entity_type: "kyc_registry",
    entity_id: stellar_address,
    details: { kyc_status, kyc_provider, user_type },
  })

  return NextResponse.json({ data })
}
