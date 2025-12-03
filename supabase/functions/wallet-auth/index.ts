// @ts-nocheck - Deno globals are available in Supabase Edge Runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import nacl from "https://esm.sh/tweetnacl@1.0.3"
import bs58 from "https://esm.sh/bs58@5.0.0"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { walletAddress, signature, message } = await req.json()

    console.log("[wallet-auth] Received:", { walletAddress, message, signatureLength: signature?.length })

    if (!walletAddress || !signature || !message) {
      console.log("[wallet-auth] Missing fields")
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    let isValid = false
    try {
      const messageBytes = new TextEncoder().encode(message)
      const signatureBytes = bs58.decode(signature)
      const publicKeyBytes = bs58.decode(walletAddress)

      console.log("[wallet-auth] Verifying signature...")
      isValid = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes)
      console.log("[wallet-auth] Signature valid:", isValid)
    } catch (verifyError) {
      console.log("[wallet-auth] Signature verification error:", verifyError.message)
      return new Response(JSON.stringify({ error: "Signature verification failed: " + verifyError.message }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    if (!isValid) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("wallet_address", walletAddress)
      .single()

    let userId: string

    if (existingProfile) {
      userId = existingProfile.id
    } else {
      const email = `${walletAddress.slice(0, 8)}@wallet.local`
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: crypto.randomUUID(),
        email_confirm: true,
        user_metadata: { wallet_address: walletAddress },
      })

      if (authError || !authUser.user) {
        console.log("[wallet-auth] Create user error:", authError)
        return new Response(JSON.stringify({ error: "Failed to create user: " + authError?.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }

      userId = authUser.user.id

      await supabase.from("profiles").upsert({
        id: userId,
        wallet_address: walletAddress,
        wallet_verified: true,
        updated_at: new Date().toISOString(),
      })
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.admin.getUserById(userId)

    if (sessionError) {
      console.log("[wallet-auth] Get user error:", sessionError)
      return new Response(JSON.stringify({ error: "Failed to get user session" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const { data: newSession } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: sessionData.user.email!,
      options: { redirectTo: "/" },
    })

    console.log("[wallet-auth] Success for user:", userId)

    return new Response(
      JSON.stringify({
        success: true,
        userId,
        walletAddress,
        token: newSession?.properties?.hashed_token,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  } catch (error) {
    console.log("[wallet-auth] Unexpected error:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
