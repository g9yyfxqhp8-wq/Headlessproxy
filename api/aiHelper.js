import axios from "axios";

export async function sanitizeJSWithKimi(scriptCode) {
  try {
    const response = await axios.post(
      "https://api.kimia.io/v1/sanitize",
      { code: scriptCode },
      {
        headers: {
          "Authorization": `Bearer ${process.env.KIMI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.cleanedCode;
  } catch (err) {
    console.error("AI Sanitizer Error:", err);
    // Max security: remove script if AI fails
    return "";
  }
}
