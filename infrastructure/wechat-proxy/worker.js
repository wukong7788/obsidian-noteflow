/**
 * NoteFlow WeChat Proxy Worker
 * 
 * This Cloudflare Worker acts as a secure bridge between the NoteFlow Obsidian plugin
 * and the WeChat Official Account API.
 */

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // 1. Basic Auth / API Key Verification
        const clientSecret = request.headers.get("X-NoteFlow-Secret");
        if (!clientSecret || clientSecret !== env.NOTEFLOW_SECRET) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { "Content-Type": "application/json" }
            });
        }

        // 2. Routing
        if (url.pathname === "/wechat/draft/add") {
            return handleDraftAdd(request, env);
        }

        return new Response("NoteFlow Proxy is running.", { status: 200 });
    }
};

/**
 * Handle adding a draft to WeChat
 */
async function handleDraftAdd(request, env) {
    try {
        const body = await request.json();
        const accessToken = await getWeChatAccessToken(env);

        const wxUrl = `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${accessToken}`;

        const response = await fetch(wxUrl, {
            method: "POST",
            body: JSON.stringify(body),
            headers: { "Content-Type": "application/json" }
        });

        const result = await response.json();
        return new Response(JSON.stringify(result), {
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*" // Handle CORS
            }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

/**
 * Get and cache WeChat Access Token
 */
async function getWeChatAccessToken(env) {
    // Check KV cache if available (implementation simplified for template)
    const appId = env.WECHAT_APP_ID;
    const appSecret = env.WECHAT_APP_SECRET;

    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.access_token) {
        return data.access_token;
    }
    throw new Error(data.errmsg || "Failed to get WeChat access token");
}
