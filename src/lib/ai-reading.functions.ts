import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { requirePremium } from "./premium-guard";

const Input = z.object({
  system: z.string().min(1).max(2000),
  prompt: z.string().min(1).max(4000),
});

export const aiReading = createServerFn({ method: "POST" })
  .middleware([requirePremium])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(key);
    const { text } = await generateText({
      model: gateway("openai/gpt-5.5"),
      system: data.system,
      prompt: data.prompt,
    });
    return { text };
  });
