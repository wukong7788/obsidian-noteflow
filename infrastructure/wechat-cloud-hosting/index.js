require('dotenv').config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const multer = require("multer");
const FormData = require("form-data");

const app = express();
app.use(cors()); // Allow all origins for the proxy
app.use(express.json({ limit: "10mb" })); // Increased limit for content
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Simple logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// 1. Auth MiddleWare (NoteFlow Secret)
const authMiddleware = (req, res, next) => {
    const clientSecret = req.headers["x-noteflow-secret"];
    // WeChat Cloud Hosting uses environment variables for config
    const serverSecret = process.env.NOTEFLOW_SECRET;

    if (!clientSecret || clientSecret !== serverSecret) {
        console.warn(`[Auth] Rejected request to ${req.url}`);
        return res.status(401).json({ error: "Unauthorized" });
    }
    next();
};

// 2. Draft Add Handler
app.post("/wechat/draft/add", authMiddleware, async (req, res) => {
    try {
        const body = req.body;
        const title = body?.articles?.[0]?.title || "Unknown";
        console.log(`Sending draft to WeChat: "${title}"...`);

        const accessToken = await getAccessToken();
        const wxUrl = `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${accessToken}`;

        const response = await axios.post(wxUrl, body);

        console.log(`WeChat response: ${JSON.stringify(response.data)}`);
        res.json(response.data);
    } catch (err) {
        const errorDetail = err.response ? JSON.stringify(err.response.data) : err.message;
        console.error("Draft add error:", errorDetail);
        res.status(500).json({ error: errorDetail });
    }
});

/**
 * 3. Cover Image Upload Handler (permanent material, returns media_id)
 * WeChat API: /cgi-bin/material/add_material?type=image
 * Supports up to 10MB images. The returned media_id is used as thumb_media_id in drafts.
 */
app.post("/wechat/media/upload", authMiddleware, upload.single("media"), async (req, res) => {
    try {
        if (!req.file) throw new Error("No file uploaded");

        const accessToken = await getAccessToken();
        const wxUrl = `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${accessToken}&type=image`;

        const form = new FormData();
        form.append("media", req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype
        });

        const response = await axios.post(wxUrl, form, {
            headers: form.getHeaders()
        });

        console.log(`Cover upload response: ${JSON.stringify(response.data)}`);
        res.json(response.data);
    } catch (err) {
        const errorDetail = err.response ? JSON.stringify(err.response.data) : err.message;
        console.error("Cover upload error:", errorDetail);
        res.status(500).json({ error: errorDetail });
    }
});

/**
 * 4. Content Image Upload Handler (For images inside article, returns permanent URL)
 * WeChat API: /cgi-bin/media/uploadimg?access_token=ACCESS_TOKEN
 */
app.post("/wechat/media/uploadimg", authMiddleware, upload.single("media"), async (req, res) => {
    try {
        if (!req.file) throw new Error("No file uploaded");

        const accessToken = await getAccessToken();
        const wxUrl = `https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token=${accessToken}`;

        const form = new FormData();
        form.append("media", req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype
        });

        const response = await axios.post(wxUrl, form, {
            headers: form.getHeaders()
        });

        console.log(`Content image upload response: ${JSON.stringify(response.data)}`);
        res.json(response.data);
    } catch (err) {
        const errorDetail = err.response ? JSON.stringify(err.response.data) : err.message;
        console.error("Content img upload error:", errorDetail);
        res.status(500).json({ error: errorDetail });
    }
});

// 3. Health Check
app.get("/", (req, res) => {
    res.json({
        status: "online",
        version: "0.2.1-v2",
        timestamp: new Date().toISOString()
    });
});

// 4. Fallback 404 Logger
app.use((req, res) => {
    console.warn(`[404] Not Found: ${req.method} ${req.url}`);
    res.status(404).json({ error: `Path ${req.url} not found on proxy server.` });
});

// Helper: Get WeChat Access Token
let tokenCache = {
    token: "",
    expires: 0
};

async function getAccessToken() {
    const now = Date.now();
    if (tokenCache.token && tokenCache.expires > now) {
        return tokenCache.token;
    }

    const appId = process.env.WECHAT_APP_ID;
    const appSecret = process.env.WECHAT_APP_SECRET;

    if (!appId || !appSecret) {
        throw new Error("Missing WECHAT_APP_ID or WECHAT_APP_SECRET environment variables.");
    }

    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;
    const response = await axios.get(url);
    const data = response.data;

    if (data.access_token) {
        tokenCache.token = data.access_token;
        tokenCache.expires = now + (data.expires_in - 200) * 1000; // Cache with buffer
        return data.access_token;
    }
    throw new Error(data.errmsg || "Failed to get access token");
}

const port = process.env.PORT || 80;
app.listen(port, () => {
    console.log(`Proxy listening on port ${port}`);
});
