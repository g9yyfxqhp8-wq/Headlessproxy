import chromium from "chrome-aws-lambda";
import { sanitizeJSWithKimi } from "./aiHelper";

export default async function handler(req, res) {
  const url = req.query.url;
  if (!url) return res.status(400).send("Missing URL");

  try {
    const browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: true,
    });

    const page = await browser.newPage();

    // Block ads/trackers
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      const blocked = ["google-analytics", "ads", "doubleclick", "tracker"];
      if (blocked.some((b) => request.url().includes(b))) request.abort();
      else request.continue();
    });

    await page.goto(url, { waitUntil: "networkidle2" });
    let html = await page.content();

    // Extract all <script> tags and sanitize with AI
    const scripts = [...html.matchAll(/<script.*?>([\s\S]*?)<\/script>/gi)];
    for (let s of scripts) {
      const originalCode = s[1];
      const cleanedCode = await sanitizeJSWithKimi(originalCode);
      html = html.replace(originalCode, cleanedCode);
    }

    await browser.close();

    res.setHeader("Content-Type", "text/html");
    res.status(200).send(html);

  } catch (err) {
    console.error(err);
    res.status(500).send("Proxy Error: Unable to fetch page");
  }
}