// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // Get Supabase credentials from environment
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseServiceRoleKey = Deno.env.get(
            "SUPABASE_SERVICE_ROLE_KEY",
        );

        if (!supabaseUrl || !supabaseServiceRoleKey) {
            throw new Error("Missing Supabase environment variables");
        }

        // Create Supabase client with service role key for admin access
        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

        // Query the waitlist table to get the count
        const { count, error } = await supabase
            .from("waitlist")
            .select("*", { count: "exact", head: true });

        if (error) {
            console.error("Database error:", error);
            return new Response(
                JSON.stringify({ error: "Failed to fetch waitlist count" }),
                {
                    status: 500,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                },
            );
        }

        console.log(`Waitlist count: ${count}`);

        return new Response(
            JSON.stringify({ count: count || 0 }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
    } catch (error: unknown) {
        console.error("Error in get-waitlist-count:", error);
        const errorMessage = error instanceof Error
            ? error.message
            : "Unknown error";
        return new Response(
            JSON.stringify({ error: errorMessage }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
        );
    }
});
