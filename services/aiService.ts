import { GoogleGenAI } from "@google/genai";

// Initialize the client. API Key must be in process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface ReflectionResult {
  summary: string;
  questions: string[];
  lesson: string;
}

export async function generateReflection(text: string): Promise<ReflectionResult> {
  const model = "gemini-2.5-flash"; // Efficient for text tasks
  
  const systemInstruction = `
    You are an empathetic, private relationship counselor and archivist.
    Your goal is to help the user find closure, understanding, and emotional balance.
    Analyze the user's reflection about a relationship.
    Provide a response in strict JSON format.
  `;

  const prompt = `
    Analyze this text: "${text}"

    Output JSON with these keys:
    1. "summary": A 1-sentence summary of the emotional tone.
    2. "questions": An array of 2 deep, open-ended questions to help the user dig deeper.
    3. "lesson": One constructive lesson or pattern identified.
    
    Do not include markdown formatting like \`\`\`json. Just the raw JSON string.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json", 
      }
    });

    const jsonText = response.text || "{}";
    const result = JSON.parse(jsonText);

    return {
      summary: result.summary || "Unable to summarize.",
      questions: result.questions || [],
      lesson: result.lesson || "No lesson extracted."
    };
  } catch (error) {
    console.error("AI Reflection failed:", error);
    throw new Error("Could not generate reflection insights at this time.");
  }
}
