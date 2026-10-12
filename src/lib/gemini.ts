import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "";

export const gemini = new GoogleGenAI({
  apiKey: apiKey,
});

export const GEMINI_MODEL = "gemini-2.5-flash"; // Fast and tool-calling optimized
