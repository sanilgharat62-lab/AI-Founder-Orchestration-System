export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export async function searchWeb(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey || apiKey === "tvly-your-real-key-here") {
    throw new Error(
      "TAVILY_API_KEY is missing or still set to the placeholder value. Add a real key to .env.local."
    );
  }

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      max_results: 5,
      search_depth: "basic",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Tavily API error (${res.status}): ${text}`);
  }

  const data = await res.json();

  const results: SearchResult[] = (data.results || []).map((r: { title?: string; url?: string; content?: string }) => ({
    title: r.title || "",
    url: r.url || "",
    snippet: r.content || "",
  }));

  return results;
}
