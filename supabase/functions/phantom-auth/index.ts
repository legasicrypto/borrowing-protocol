import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nacl from "https://esm.sh/tweetnacl@1.0.3";
import bs58 from "https://esm.sh/bs58@5.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { walletAddress, signature, message } = await req.json();

    if (!walletAddress || !signature || !message) {
      throw new Error("Missing required fields: walletAddress, signature, message");
    }

    // Verify the signature
    const messageBytes = new TextEncoder().encode(message);
    // Decode signature from base64 (sent by frontend with btoa)
    const signatureBytes = Uint8Array.from(atob(signature), c => c.charCodeAt(0));
    // Decode wallet address from base58 (Solana public key format)
    const publicKeyBytes = bs58.decode(walletAddress);

    const isValid = nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKeyBytes
    );

    if (!isValid) {
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if message is not too old (5 minutes)
    const timestamp = parseInt(message.split("Timestamp: ")[1]);
    const now = Date.now();
    if (now - timestamp > 5 * 60 * 1000) {
      return new Response(
        JSON.stringify({ error: "Message expired" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check if user exists with this wallet address
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("wallet_address", walletAddress)
      .single();

    let userId: string;

    if (existingProfile) {
      // User exists, get their ID
      userId = existingProfile.id;
    } else {
      // Create new user with wallet address as identifier
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: `${walletAddress}@wallet.phantom`,
        email_confirm: true,
        user_metadata: {
          wallet_address: walletAddress,
          wallet_verified: true,
        },
      });

      if (authError) {
        console.error("Auth error:", authError);
        throw authError;
      }

      userId = authData.user.id;

      // Create profile
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: userId,
          wallet_address: walletAddress,
          wallet_verified: true,
        });

      if (profileError) {
        console.error("Profile error:", profileError);
      }
    }

    // Generate session for the user
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: `${walletAddress}@wallet.phantom`,
    });

    if (sessionError) {
      console.error("Session error:", sessionError);
      throw sessionError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        userId,
        walletAddress,
        accessToken: sessionData.properties.action_link,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
