import { ColorScheme, StartScreenPrompt, ThemeOption } from "@openai/chatkit";

export const WORKFLOW_ID =
  process.env.NEXT_PUBLIC_CHATKIT_WORKFLOW_ID?.trim() ?? "";

export const CREATE_SESSION_ENDPOINT = "/api/create-session";

export const STARTER_PROMPTS: StartScreenPrompt[] = [
  {
    label: "Revenue leakage sweep",
    prompt: "Run a high-level revenue leakage investigation across all billing plans for the last quarter.",
    icon: "analytics",
  },
  {
    label: "Plan vs invoice audit",
    prompt: "Compare billing plan PLAN-ACME-2024 against all issued invoices and summarize any deltas.",
    icon: "chart",
  },
  {
    label: "Missing invoices",
    prompt: "Identify any missing invoices for customer CUST-ACME in 2024 and quantify the revenue impact.",
    icon: "calendar",
  },
];

export const PLACEHOLDER_INPUT = "Describe an investigation or follow-up task...";

export const GREETING = "Ready to investigate revenue leakage. How should we focus the next mission?";

export const getThemeConfig = (theme: ColorScheme): ThemeOption => ({
  color: {
    grayscale: {
      hue: 220,
      tint: 6,
      shade: theme === "dark" ? -1 : -4,
    },
    accent: {
      primary: theme === "dark" ? "#f1f5f9" : "#0f172a",
      level: 1,
    },
  },
  radius: "round",
  // Add other theme options here
  // chatkit.studio/playground to explore config options
});
