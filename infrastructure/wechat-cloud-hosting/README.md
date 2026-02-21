# NoteFlow WeChat Proxy (Docker / Cloud Hosting)

This proxy server provides a fixed outbound IP address for WeChat Official Account API. It can be deployed to **WeChat Cloud Hosting** or a **self-hosted VPS (Docker)**.

## Option 1: Self-Hosted VPS (Docker) - **Recommended**

Best for users who want full control and a permanent fixed IP (e.g., Tencent Cloud Ubuntu 22.04 + Docker).

1.  **Preparation**:
    *   Find the `infrastructure/wechat-cloud-hosting` folder.
    *   Upload the contents of this folder to your server (via `scp`, `sftp`, or `git`).

2.  **Configure**:
    *   Open `docker-compose.yml` on your server.
    *   Fill in your `WECHAT_APP_ID`, `WECHAT_APP_SECRET`, and `NOTEFLOW_SECRET`.

3.  **Deploy**:
    ```bash
    cd infrastructure/wechat-cloud-hosting
    docker compose up -d
    ```

4.  **Networking**:
    *   Firewall: Allow incoming traffic on port **3000** (or change the mapping in `docker-compose.yml`).
    *   WeChat: Add your server's **Public IP** to the WeChat MP **IP Whitelist**.

5.  **NoteFlow Settings**:
    *   URL: `http://your-server-ip:3000`
    *   Secret: Your `NOTEFLOW_SECRET`.

---

## Option 2: WeChat Cloud Hosting (微信云托管)

1.  **Preparation**: 
    *   Compress `index.js`, `package.json`, and `Dockerfile` into a `.zip` file.

2.  **Deploy**:
    *   In WeChat Cloud Hosting Console, click **Publish** -> **Upload ZIP**.

3.  **Environment Variables**:
    *   Add `WECHAT_APP_ID`, `WECHAT_APP_SECRET`, and `NOTEFLOW_SECRET` in **Environment Settings**.

4.  **Networking**:
    *   Enable **Fixed Outbound IP** in Network Settings.
    *   Whitelist that IP in WeChat MP Basic Settings.

5.  **NoteFlow Settings**:
    *   URL: The public domain provided by Cloud Hosting.
    *   Secret: Your `NOTEFLOW_SECRET`.
