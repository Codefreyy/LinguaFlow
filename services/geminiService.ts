import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Chunk, PracticeResult, ReviewResult } from "../types";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-2.5-flash';

/**
 * Helper to convert Blob to Base64
 */
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Generate questions for a specific topic
 */
export const generateQuestions = async (topic: string): Promise<string[]> => {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      questions: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "3-4 engaging conversation questions about the topic."
      }
    },
    required: ["questions"]
  };

  const prompt = `Generate 3-4 engaging English conversation questions for an intermediate learner about the topic: "${topic}". The questions should be open-ended and encourage detailed answers.`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response");
    const data = JSON.parse(text);
    return data.questions;
  } catch (error) {
    console.error("Question generation failed:", error);
    return ["Tell me about your thoughts on this topic.", "Why is this topic interesting to you?", "What are the pros and cons related to this?"];
  }
};

/**
 * Analyze spoken practice audio
 */
export const analyzePracticeAudio = async (audioBlob: Blob, topicContext: string): Promise<PracticeResult> => {
  const base64Audio = await blobToBase64(audioBlob);

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      transcript: { type: Type.STRING, description: "Verbatim transcription of what the user said in English." },
      optimizedText: { type: Type.STRING, description: "A more natural, native-like version of the user's speech." },
      feedback: { type: Type.STRING, description: "Brief feedback on grammar and naturalness (in Chinese)." },
      extractedChunks: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            original: { type: Type.STRING, description: "The useful English chunk/idiom/pattern found or recommended." },
            meaning: { type: Type.STRING, description: "Chinese meaning of the chunk." },
            example: { type: Type.STRING, description: "A new example sentence using this chunk." },
            exampleTranslation: { type: Type.STRING, description: "Chinese translation of the example sentence." },
            tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "1-2 keywords describing usage (e.g. 'Business', 'Greeting')." }
          },
          required: ["original", "meaning", "example", "exampleTranslation", "tags"]
        }
      }
    },
    required: ["transcript", "optimizedText", "feedback", "extractedChunks"]
  };

  const prompt = `
    You are an expert American English coach. 
    The user is practicing speaking about: "${topicContext}".
    1. Transcribe their speech accurately.
    2. Rewrite it to sound like a polished, educated native speaker.
    3. Provide constructive feedback in Chinese.
    4. Extract 2-4 high-value language chunks (idioms, collocations, or sentence patterns) from the *optimized* version that the user should learn.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          { inlineData: { mimeType: audioBlob.type || 'audio/webm', data: base64Audio } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as PracticeResult;
  } catch (error) {
    console.error("Practice analysis failed:", error);
    throw error;
  }
};

/**
 * Review a specific chunk
 */
export const reviewChunkPractice = async (audioBlob: Blob, targetChunk: string): Promise<ReviewResult> => {
  const base64Audio = await blobToBase64(audioBlob);

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      isCorrect: { type: Type.BOOLEAN, description: "True if the user used the target chunk correctly in a sentence." },
      feedback: { type: Type.STRING, description: "Detailed feedback in Chinese about usage and pronunciation." },
      improvedSentence: { type: Type.STRING, description: "A better version of their sentence if applicable." }
    },
    required: ["isCorrect", "feedback"]
  };

  const prompt = `
    The user is trying to practice the English chunk: "${targetChunk}".
    Listen to their sentence.
    1. Did they use the chunk grammatically and contextually correctly?
    2. Is the pronunciation intelligible?
    3. Provide feedback in Chinese.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          { inlineData: { mimeType: audioBlob.type || 'audio/webm', data: base64Audio } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as ReviewResult;
  } catch (error) {
    console.error("Review failed:", error);
    throw error;
  }
};

/**
 * Auto-complete a custom chunk
 */
export const autoCompleteChunk = async (input: string): Promise<Omit<Chunk, 'id' | 'proficiency' | 'createdAt'>> => {
    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            original: { type: Type.STRING },
            meaning: { type: Type.STRING },
            example: { type: Type.STRING },
            exampleTranslation: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["original", "meaning", "example", "exampleTranslation", "tags"]
    };

    const prompt = `
        The user wants to add a new English chunk or expression to their library. 
        Input: "${input}". 
        If the input is Chinese, translate to the most common English idiom/chunk.
        If the input is English, define it.
        Provide a full study card JSON.
    `;

    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: schema
        }
    });
    
    const text = response.text;
    if (!text) throw new Error("No response");
    return JSON.parse(text);
}