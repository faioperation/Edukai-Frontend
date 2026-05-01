import { NextResponse } from "next/server";

function isHttpUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url || !isHttpUrl(url)) {
    return NextResponse.json(
      { success: false, message: "Invalid or missing url" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(url, {
      // Some file hosts block unknown user agents; keep it browser-like.
      headers: {
        Accept: "application/pdf,*/*",
        // ngrok free often shows a warning HTML page without this header
        "ngrok-skip-browser-warning": "true",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      },
      // Avoid caching stale PDFs.
      cache: "no-store",
      redirect: "follow",
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json(
        {
          success: false,
          message: `Upstream failed (${res.status})`,
          upstreamStatus: res.status,
          upstreamContentType: res.headers.get("content-type"),
          upstreamBodyPreview: text ? text.slice(0, 300) : "",
        },
        { status: 502 }
      );
    }

    const contentType = res.headers.get("content-type") || "application/pdf";
    const buf = await res.arrayBuffer();

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, message: e?.message || "Proxy failed" },
      { status: 502 }
    );
  }
}

