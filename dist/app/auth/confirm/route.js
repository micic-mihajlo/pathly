import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
export async function GET(request) {
    var _a;
    const { searchParams } = new URL(request.url);
    const token_hash = searchParams.get("token_hash");
    const type = searchParams.get("type");
    const next = (_a = searchParams.get("next")) !== null && _a !== void 0 ? _a : "/";
    if (token_hash && type) {
        const supabase = await createClient();
        const { error } = await supabase.auth.verifyOtp({
            type,
            token_hash,
        });
        if (!error) {
            // redirect user to specified redirect URL or root of app
            redirect(next);
        }
        else {
            // redirect the user to an error page with some instructions
            redirect(`/auth/error?error=${error === null || error === void 0 ? void 0 : error.message}`);
        }
    }
    // redirect the user to an error page with some instructions
    redirect(`/auth/error?error=No token hash or type`);
}
