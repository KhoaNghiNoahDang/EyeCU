const fs = require('fs');
require('dotenv').config();

async function run() {
    const TOKEN = process.env.VNPT_SMARTBOT_ACCESS_TOKEN;
    const TOKEN_ID = process.env.VNPT_SMARTBOT_TOKEN_ID;
    const TOKEN_KEY = process.env.VNPT_SMARTBOT_TOKEN_KEY;
    const BOT_ID = process.env.VNPT_SMARTBOT_ID || "1caedbb0-760d-11f1-8ff8-dfa790a1e2db";

    let payload = {
        "bot_id": BOT_ID,
        "sender_id": "test_patient",
        "text": "Xin chào",
        "input_channel": "livechat",
        "session_id": "test_patient",
        "metadata": {
            "button_variables": [
                {"key": "patient_id", "value": "123"},
                {"key": "patient_name", "value": "test"}
            ]
        }
    };
    
    let auth_header = TOKEN.toLowerCase().startsWith("bearer") ? TOKEN : `Bearer ${TOKEN}`;
    let headers = {
        "Token-id": TOKEN_ID,
        "Token-key": TOKEN_KEY,
        "Authorization": auth_header,
        "Content-Type": "application/json",
    };
    
    console.log("Testing with LIST DICT metadata...");
    try {
        let res = await fetch("https://assistant-stream.vnpt.vn/v1/conversation", {
            method: "POST",
            headers,
            body: JSON.stringify(payload)
        });
        console.log("Status:", res.status);
        let text = await res.text();
        console.log("Response length:", text.length);
        console.log("Response:", text);
    } catch (e) {
        console.log("Error:", e);
    }
}

run();
