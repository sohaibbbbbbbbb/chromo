import { createAnthropic } from "@ai-sdk/anthropic";
import { streamText, stepCountIs } from "ai";
import { supabaseServer } from "@/lib/supabase-server";
import { CHAT_SYSTEM_PROMPT } from "@/constants/prompts";
import { generatePaletteTool } from "@/lib/tools/generatePalette";

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return new Response("Unauthorized", { status: 401 });

  const { projectId } = await req.json();

  const { data: messages, error: messagesError } = await supabase
    .from("messages")
    .select("content, role")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (messagesError || !messages)
    return new Response("Failed to fetch messages", { status: 500 });

  const anthropic = createAnthropic({
    apiKey:
      "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",
    // "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",
    //   "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",
  });

  const result = streamText({
    model: anthropic("claude-sonnet-4-5-20250929"),
    system: CHAT_SYSTEM_PROMPT,
    tools: { generatePaletteTool },
    messages,
    experimental_context: { projectId },
  });

  return result.toTextStreamResponse();
}
