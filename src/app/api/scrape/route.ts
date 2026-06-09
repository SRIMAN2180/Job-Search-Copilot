import { NextRequest, NextResponse } from "next/server";

const EXTRACT_PROMPT = `Given the following raw text extracted from a job listing webpage, extract the job details.

Return valid JSON with these exact keys:
- "title": The job title
- "company": The company name
- "description": The full job description text

Raw text:
{text}`;

const PRIVATE_IPS = /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|127\.|169\.254\.|0\.|::1|localhost)/i;

function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    if (PRIVATE_IPS.test(u.hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url, apiKey, model: inputModel } = await request.json();

    if (!url || !isValidUrl(url)) {
      return NextResponse.json({ error: "Invalid or disallowed URL" }, { status: 400 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch URL" },
        { status: 502 }
      );
    }

    const reader = response.body?.getReader();
    const chunks: Uint8Array[] = [];
    let totalSize = 0;
    const MAX_RESPONSE = 5 * 1024 * 1024; // 5 MB

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        totalSize += value.length;
        if (totalSize > MAX_RESPONSE) {
          reader.cancel();
          break;
        }
        chunks.push(value);
      }
    }

    const decoder = new TextDecoder();
    const html = chunks.length ? chunks.map((c) => decoder.decode(c, { stream: true })).join("") : await response.text();

    const cleaned = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&[^;]+;/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 8000);

    if (!cleaned) {
      return NextResponse.json(
        { error: "No text content extracted" },
        { status: 422 }
      );
    }

    const model = inputModel || "openai/gpt-4o-mini";

    if (apiKey) {
      try {
        const prompt = EXTRACT_PROMPT.replace("{text}", cleaned);
        const aiRes = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
              "HTTP-Referer": "http://localhost:3000",
              "X-Title": "Pipeline",
            },
            body: JSON.stringify({
              model,
              messages: [{ role: "user", content: prompt }],
            }),
          }
        );

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const content = aiData.choices?.[0]?.message?.content;
          if (content) {
            let parsed: Record<string, unknown>;
            try {
              parsed = JSON.parse(content);
            } catch {
              const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
              parsed = match ? JSON.parse(match[1]) : {};
            }
            return NextResponse.json({
              title: typeof parsed.title === "string" ? parsed.title : "",
              company: typeof parsed.company === "string" ? parsed.company : "",
              description: typeof parsed.description === "string" ? parsed.description : cleaned,
              text: cleaned,
            });
          }
        }
      } catch {
        // fallback to returning raw text
      }
    }

    return NextResponse.json({
      title: "",
      company: "",
      description: cleaned,
      text: cleaned,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch URL" }, { status: 500 });
  }
}
