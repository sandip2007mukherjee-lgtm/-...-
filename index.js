const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");

exports.generateNote = onRequest(
  { cors: true, secrets: [OPENAI_API_KEY], region: "asia-south1" },
  async (req, res) => {
    if (req.method !== "POST") return res.status(405).json({error:"POST only"});
    try {
      const {name, emotionLabel} = req.body || {};
      if (!name || !emotionLabel) return res.status(400).json({error:"name and emotionLabel required"});

      const prompt = `Write a short original Bengali note for a person named "${name}" who currently feels "${emotionLabel}".
Use elegant literary Bengali, warm and comforting, 70-120 words, natural and emotionally sincere.
Do not quote or imitate any copyrighted book/poem. Do not mention being an AI. Avoid clichés and repeated wording.
Return only the note text.`;

      const r = await fetch("https://api.openai.com/v1/responses", {
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":`Bearer ${OPENAI_API_KEY.value()}`},
        body:JSON.stringify({
          model:"gpt-5-mini",
          input:prompt
        })
      });
      const data=await r.json();
      if(!r.ok) return res.status(500).json({error:data.error?.message||"AI request failed"});
      const note=(data.output_text||"").trim();
      return res.json({note});
    } catch(e) {
      console.error(e);
      return res.status(500).json({error:"Server error"});
    }
  }
);
