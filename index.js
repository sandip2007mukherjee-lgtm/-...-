const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");

const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");

exports.generateNote = onRequest(
  { region: "asia-south1", cors: true, secrets: [OPENAI_API_KEY] },
  async (req, res) => {
    try {
      if (req.method !== "POST")
        return res.status(405).json({ error: "POST method required" });

      const { name, emotion, emotionLabel } = req.body || {};

      if (!name || !emotionLabel)
        return res.status(400).json({ error: "name and emotionLabel are required" });

      const prompt = `
তুমি একটি সুন্দর Bengali emotion-note writer।

ব্যক্তির নাম: ${name}
অনুভূতি: ${emotionLabel}
Emotion ID: ${emotion}

তার জন্য একটি সম্পূর্ণ নতুন, original বাংলা ছোট্ট চিঠি/নোট লেখো।
নিয়ম:
- সুন্দর, স্বাভাবিক ও সাহিত্যিক বাংলা ব্যবহার করবে।
- লেখাটা human এবং heartfelt হবে।
- 70 থেকে 120 শব্দের মধ্যে রাখবে।
- ব্যক্তির নাম স্বাভাবিকভাবে ব্যবহার করবে।
- প্রতিবার নতুন wording ব্যবহার করবে।
- একই ধরনের বাক্য বারবার ব্যবহার করবে না।
- কোনো বই, কবিতা বা গানের আসল লাইন copy করবে না।
- কোনো লেখকের style হুবহু imitate করবে না।
- AI বা system-এর কথা বলবে না।
- শুধু note-এর text দেবে।
`;

      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY.value()}`
        },
        body: JSON.stringify({ model: "gpt-5-mini", input: prompt })
      });

      const data = await response.json();

      if (!response.ok)
        return res.status(500).json({ error: "OpenAI request failed" });

      const note =
        data.output_text ||
        data.output?.[0]?.content?.[0]?.text ||
        "";

      if (!note)
        return res.status(500).json({ error: "AI returned an empty note" });

      return res.status(200).json({ note: note.trim() });
    } catch (error) {
      console.error("generateNote error:", error);
      return res.status(500).json({ error: "Server error" });
    }
  }
);
