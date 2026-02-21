# NoteFlow WeChat Proxy (Cloudflare Worker)

This worker acts as a secure bridge between NoteFlow and the WeChat API.

## Setup Instructions

1.  **Create a Cloudflare Worker**:
    *   Log in to your Cloudflare dashboard.
    *   Go to **Workers & Pages** -> **Create application** -> **Create Worker**.
    *   Name it (e.g., `noteflow-proxy`).

2.  **Configure Environment Variables**:
    *   In the Worker's **Settings** -> **Variables**, add the following:
    *   `WECHAT_APP_ID`: Your WeChat MP AppID.
    *   `WECHAT_APP_SECRET`: Your WeChat MP AppSecret.
    *   `NOTEFLOW_SECRET`: A random long string (this is your API Key for the plugin).

3.  **Deploy Code**:
    *   Copy the contents of `worker.js` into the Cloudflare Worker editor and click **Save and Deploy**.

4.  **Update NoteFlow Settings**:
    *   Copy your Worker's URL (e.g., `https://noteflow-proxy.yourname.workers.dev`).
    *   Enter the URL and your `NOTEFLOW_SECRET` in the NoteFlow plugin settings (v0.2.0 feature).
