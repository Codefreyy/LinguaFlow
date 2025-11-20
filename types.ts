export enum ViewState {
  HOME = 'HOME',
  PRACTICE = 'PRACTICE',
  LIBRARY = 'LIBRARY',
  REVIEW = 'REVIEW',
  ADD_CHUNK = 'ADD_CHUNK'
}

export enum Proficiency {
  NEW = 0,
  LEARNING = 1,
  MASTERED = 2
}

export interface Chunk {
  id: string;
  original: string; // The English chunk
  meaning: string;  // Chinese meaning
  example: string;  // English example
  exampleTranslation: string; // Chinese translation of example
  proficiency: Proficiency;
  tags: string[];
  createdAt: number;
}

export interface Topic {
  id: string;
  title: string;
  description: string;
  icon: string;
  questions: string[];
}

export interface PracticeResult {
  transcript: string;
  optimizedText: string;
  feedback: string;
  extractedChunks: Omit<Chunk, 'id' | 'proficiency' | 'createdAt'>[];
}

export interface ReviewResult {
  isCorrect: boolean;
  feedback: string;
  improvedSentence?: string;
}