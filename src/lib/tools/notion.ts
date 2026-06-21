export interface NotionResult {
  success: boolean;
  pageUrl?: string;
  pageId?: string;
  error?: string;
}

function markdownToNotionBlocks(markdown: string) {
  const blocks: object[] = [];
  const lines = markdown.split("\n");

  for (const line of lines) {
    if (!line.trim()) {
      blocks.push({ object: "block", type: "paragraph", paragraph: { rich_text: [] } });
      continue;
    }

    if (line.startsWith("## ")) {
      blocks.push({
        object: "block", type: "heading_2",
        heading_2: { rich_text: [{ type: "text", text: { content: line.slice(3) } }] },
      });
    } else if (line.startsWith("### ")) {
      blocks.push({
        object: "block", type: "heading_3",
        heading_3: { rich_text: [{ type: "text", text: { content: line.slice(4) } }] },
      });
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      blocks.push({
        object: "block", type: "bulleted_list_item",
        bulleted_list_item: { rich_text: [{ type: "text", text: { content: line.slice(2) } }] },
      });
    } else if (/^\d+\. /.test(line)) {
      blocks.push({
        object: "block", type: "numbered_list_item",
        numbered_list_item: { rich_text: [{ type: "text", text: { content: line.replace(/^\d+\. /, "") } }] },
      });
    } else {
      // Strip markdown bold for plain text
      const text = line.replace(/\*\*(.+?)\*\*/g, "$1");
      blocks.push({
        object: "block", type: "paragraph",
        paragraph: { rich_text: [{ type: "text", text: { content: text } }] },
      });
    }
  }

  return blocks.slice(0, 100); // Notion API limit per request
}

export async function publishToNotion(
  title: string,
  content: string
): Promise<NotionResult> {
  const token = process.env.NOTION_API_KEY;
  const dbId = process.env.NOTION_DATABASE_ID;

  if (!token || token === "secret_your-key-here") {
    return { success: false, error: "No NOTION_API_KEY configured in .env.local" };
  }
  if (!dbId || dbId === "your-database-id") {
    return { success: false, error: "No NOTION_DATABASE_ID configured in .env.local" };
  }

  try {
    const res = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({
        parent: { database_id: dbId },
        properties: {
          title: { title: [{ text: { content: title } }] },
        },
        children: markdownToNotionBlocks(content),
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      return { success: false, error: err.message ?? "Notion API error" };
    }

    const data = await res.json();
    return {
      success: true,
      pageId: data.id,
      pageUrl: data.url,
    };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}
