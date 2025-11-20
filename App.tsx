import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, BookOpen, RotateCcw, X, Check, 
  ChevronRight, Sparkles, Loader2, Plus, Search, Trash2, ArrowRight, PlayCircle, LogOut, User,
  Eye, EyeOff
} from 'lucide-react';
import { analyzePracticeAudio, reviewChunkPractice, autoCompleteChunk, generateQuestions } from './services/geminiService';
import { Chunk, PracticeResult, Proficiency, Topic, ViewState, ReviewResult } from './types';

// --- Constants ---

const HINT_TOPICS: Topic[] = [
  { id: 'daily', title: 'Daily Life', description: 'Hobbies, routine, food', icon: '☕', questions: ['Tell me about your morning routine.', 'What is your favorite comfort food and why?', 'How do you usually spend your weekends?'] },
  { id: 'work', title: 'Work & Career', description: 'Meetings, goals, challenges', icon: '💼', questions: ['Describe a challenging project you worked on.', 'How do you handle stress at work?', 'What are your career goals for the next year?'] },
  { id: 'travel', title: 'Travel', description: 'Vacations, culture, places', icon: '✈️', questions: ['Tell me about your most memorable trip.', 'Do you prefer solo travel or group travel?', 'Where would you like to go next?'] },
  { id: 'tech', title: 'Technology', description: 'AI, gadgets, future', icon: '🤖', questions: ['How has technology changed your life recently?', 'Are you worried about AI replacing jobs?', 'What is your favorite app?'] },
];

const FREE_TALK_TOPIC: Topic = { 
  id: 'free', 
  title: 'Free Talk', 
  description: 'Talk about anything you want', 
  icon: '🎙️', 
  questions: ['Talk about anything on your mind right now. What happened today?'] 
};

// --- Components ---

// 1. Auth Screen
const AuthScreen = ({ onLogin }: { onLogin: (username: string) => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    const usersStr = localStorage.getItem('sn_users');
    const users = usersStr ? JSON.parse(usersStr) : {};

    if (isLogin) {
      if (users[username] && users[username] === password) {
        onLogin(username);
      } else {
        setError('Invalid username or password');
      }
    } else {
      if (users[username]) {
        setError('Username already exists');
      } else {
        users[username] = password;
        localStorage.setItem('sn_users', JSON.stringify(users));
        onLogin(username);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center text-white shadow-md mx-auto mb-4">
            <Mic className="w-7 h-7"/>
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Speak<span className="text-indigo-600">Native</span></h1>
          <p className="text-slate-500 mt-2">{isLogin ? 'Welcome back!' : 'Create your account'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-colors bg-slate-50 focus:bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-colors bg-slate-50 focus:bg-white"
            />
          </div>
          
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 hover:shadow-indigo-200 transition transform active:scale-95">
            {isLogin ? 'Log In' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-sm text-slate-400 hover:text-indigo-600 font-medium transition"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
          </button>
        </div>
      </div>
    </div>
  );
};

// 2. Topic Selection
const TopicSelector = ({ onSelect }: { onSelect: (topic: Topic, question: string) => void }) => {
  const [customTopic, setCustomTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<string[]>([]);
  const [activeTopicName, setActiveTopicName] = useState<string>('');

  const handleGenerate = async () => {
    if (!customTopic.trim()) return;
    setIsGenerating(true);
    setGeneratedQuestions([]);
    setActiveTopicName(customTopic);
    try {
      const questions = await generateQuestions(customTopic);
      setGeneratedQuestions(questions);
    } catch (e) {
      alert("Could not generate questions. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleGenerate();
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-[70vh] px-4 animate-in fade-in duration-500">
      <div className="w-full max-w-md space-y-8">
        
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">What shall we practice?</h2>
          <p className="text-slate-500">Choose a topic or chat freely to improve your fluency.</p>
        </div>

        {/* Input Section */}
        <div className="space-y-4">
          <div className="relative group">
            <input 
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Enter a topic (e.g., Movies, Job Interview)..." 
              className="w-full p-4 pr-14 rounded-2xl border border-slate-200 bg-slate-50 shadow-inner focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-lg"
            />
            <button 
              onClick={handleGenerate}
              disabled={isGenerating || !customTopic.trim()}
              className="absolute right-2 top-2 bottom-2 aspect-square bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition shadow-md hover:shadow-lg outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
            </button>
          </div>

          {/* Generated Questions List */}
          {generatedQuestions.length > 0 && (
            <div className="space-y-2 animate-in slide-in-from-top-2">
              <div className="text-xs font-bold text-indigo-500 uppercase tracking-wider pl-1 mb-1">
                 Questions for {activeTopicName}
              </div>
              {generatedQuestions.map((q, i) => (
                <button 
                  key={i}
                  onClick={() => onSelect({ id: 'custom', title: activeTopicName, description: 'Custom Topic', icon: '✨', questions: generatedQuestions }, q)}
                  className="w-full text-left p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-500 hover:shadow-md hover:-translate-y-0.5 transition duration-200 group outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <span className="text-slate-700 font-medium group-hover:text-indigo-700">{q}</span>
                </button>
              ))}
            </div>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-2 bg-white text-sm text-slate-400">or</span>
            </div>
          </div>

          <button 
            onClick={() => onSelect(FREE_TALK_TOPIC, FREE_TALK_TOPIC.questions[0])}
            className="w-full p-4 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 font-bold group outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <div className="p-1 rounded-full bg-slate-100 group-hover:bg-emerald-200 transition"><Sparkles className="w-4 h-4 text-slate-500 group-hover:text-emerald-700"/></div>
            Free Talk Mode
          </button>
        </div>

        {/* Small Topic Hints */}
        <div className="text-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide mr-2">Popular:</span>
          <div className="inline-flex flex-wrap justify-center gap-x-3 gap-y-2">
            {HINT_TOPICS.map(topic => (
              <button 
                key={topic.id} 
                onClick={() => onSelect(topic, topic.questions[0])}
                className="text-sm text-slate-500 hover:text-indigo-600 hover:underline decoration-indigo-300 underline-offset-4 transition outline-none focus:text-indigo-800"
              >
                {topic.title}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

// 3. Audio Recorder
interface RecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  isProcessing: boolean;
}

const Recorder: React.FC<RecorderProps> = ({ onRecordingComplete, isProcessing }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [time, setTime] = useState(0);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);
  const [supportedMimeType, setSupportedMimeType] = useState<string>('');

  useEffect(() => {
    if (typeof MediaRecorder === 'undefined') return;
    const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        setSupportedMimeType(type);
        break;
      }
    }
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = supportedMimeType ? { mimeType: supportedMimeType } : undefined;
      mediaRecorder.current = new MediaRecorder(stream, options);
      chunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data);
      };

      mediaRecorder.current.onstop = () => {
        const blobType = supportedMimeType || (chunks.current[0] as Blob)?.type || 'audio/webm';
        const blob = new Blob(chunks.current, { type: blobType });
        onRecordingComplete(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      setTime(0);
      timerRef.current = window.setInterval(() => setTime(t => t + 1), 1000);
    } catch (err) {
      console.error(err);
      alert("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="relative">
        {isRecording && <div className="absolute inset-0 rounded-full bg-red-400 opacity-75 blob-pulse"></div>}
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-xl hover:shadow-2xl outline-none focus:ring-4 focus:ring-offset-4 ${
            isRecording ? 'bg-red-500 hover:bg-red-600 scale-110 focus:ring-red-300' : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105 focus:ring-indigo-300'
          } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isProcessing ? (
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          ) : isRecording ? (
            <div className="w-8 h-8 bg-white rounded-md shadow-sm" />
          ) : (
            <Mic className="w-10 h-10 text-white" />
          )}
        </button>
      </div>
      <div className="mt-6 font-mono text-slate-500 font-medium min-h-[24px]">
        {isRecording ? (
            <span className="text-red-500 animate-pulse">Recording {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}</span>
        ) : "Tap to Speak"}
      </div>
    </div>
  );
};

// 4. Practice Session View
const PracticeSession = ({ 
  topic, 
  question, 
  onFinish,
  onSaveChunk
}: { 
  topic: Topic, 
  question: string, 
  onFinish: () => void,
  onSaveChunk: (chunk: Omit<Chunk, 'id' | 'proficiency' | 'createdAt'>) => void
}) => {
  const [result, setResult] = useState<PracticeResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [savedIndices, setSavedIndices] = useState<number[]>([]);

  const handleRecording = async (blob: Blob) => {
    setIsProcessing(true);
    try {
      const data = await analyzePracticeAudio(blob, `Topic: ${topic.title}. Question: ${question}`);
      setResult(data);
    } catch (e) {
      console.error("Analysis error", e);
      alert("Failed to analyze audio. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = (idx: number) => {
    if (result && !savedIndices.includes(idx)) {
      onSaveChunk(result.extractedChunks[idx]);
      setSavedIndices([...savedIndices, idx]);
    }
  };

  if (!result) {
    return (
      <div className="p-4 animate-in fade-in">
        <button onClick={onFinish} className="text-slate-400 hover:text-slate-700 mb-6 flex items-center gap-1 font-medium transition outline-none focus:text-slate-900"><ChevronRight className="rotate-180 w-4 h-4"/> Back to Topics</button>
        
        <div className="bg-white border border-slate-100 p-8 rounded-3xl mb-10 text-center shadow-xl shadow-indigo-100/50">
          <div className="inline-block px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 font-bold text-xs tracking-wider uppercase mb-4">{topic.title}</div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 leading-tight">"{question}"</h2>
        </div>

        <Recorder onRecordingComplete={handleRecording} isProcessing={isProcessing} />
        
        <div className="text-center mt-8">
           <p className="text-slate-400 text-sm">Try to speak for at least 5 seconds.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20 animate-in slide-in-from-bottom-8 duration-500">
       <div className="flex justify-between items-center mb-6">
         <h2 className="font-bold text-xl text-slate-800">Analysis Result</h2>
         <button onClick={() => setResult(null)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 font-medium flex items-center gap-2 text-sm transition outline-none focus:ring-2 focus:ring-slate-300">
            <RotateCcw className="w-4 h-4"/> New Try
         </button>
       </div>
       
       <div className="space-y-6">
          {/* Transcript & Optimization */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
               <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Mic className="w-3 h-3"/> Your Speech
               </div>
               <p className="text-slate-600 leading-relaxed text-lg">{result.transcript}</p>
            </div>

            <div className="bg-indigo-50/50 rounded-2xl border border-indigo-100 p-5 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles className="w-24 h-24 text-indigo-500"/></div>
               <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3 flex items-center gap-2 relative z-10">
                  <Sparkles className="w-3 h-3"/> Native Optimization
               </div>
               <p className="text-slate-800 font-medium leading-relaxed text-lg relative z-10">{result.optimizedText}</p>
               <div className="mt-4 pt-4 border-t border-indigo-100 text-sm text-indigo-700 italic relative z-10">
                 "{result.feedback}"
               </div>
            </div>
          </div>

          {/* Extracted Chunks */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-500"/> Useful Chunks to Learn
            </h3>
            <div className="grid gap-4">
              {result.extractedChunks.map((chunk, idx) => (
                <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition group">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold text-xl text-indigo-900">{chunk.original}</div>
                      <div className="text-slate-500">{chunk.meaning}</div>
                    </div>
                    <button 
                      onClick={() => handleSave(idx)}
                      disabled={savedIndices.includes(idx)}
                      className={`p-2 rounded-xl transition-all transform active:scale-95 outline-none focus:ring-2 focus:ring-offset-1 ${
                          savedIndices.includes(idx) 
                          ? 'bg-green-100 text-green-600 focus:ring-green-400' 
                          : 'bg-slate-100 text-slate-400 hover:bg-indigo-600 hover:text-white focus:ring-indigo-400'
                      }`}
                    >
                      {savedIndices.includes(idx) ? <Check className="w-5 h-5"/> : <Plus className="w-5 h-5"/>}
                    </button>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl text-sm text-slate-600 mt-3 group-hover:bg-indigo-50/30 transition-colors">
                    <p className="mb-1"><span className="font-bold text-slate-400 text-xs uppercase mr-1">Ex:</span> {chunk.example}</p>
                    <p className="text-slate-400 text-xs pl-6">{chunk.exampleTranslation}</p>
                  </div>
                  <div className="mt-3 flex gap-2">
                    {chunk.tags.map(t => <span key={t} className="text-[10px] uppercase font-bold px-2 py-1 bg-slate-100 text-slate-500 rounded-md tracking-wide">{t}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
       </div>
    </div>
  );
};

// 5. Library / Chunk List
const ChunkLibrary = ({ 
  chunks, 
  onDelete, 
  onReviewSelected,
  onAddClick
}: { 
  chunks: Chunk[], 
  onDelete: (id: string) => void,
  onReviewSelected: (ids: string[]) => void,
  onAddClick: () => void
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelfCheckMode, setIsSelfCheckMode] = useState(false);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  const filtered = chunks.filter(c => 
    c.original.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.meaning.includes(searchTerm)
  );

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleReveal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSet = new Set(revealedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setRevealedIds(newSet);
  };

  const handleReviewClick = () => {
    if (selectedIds.size > 0) {
        onReviewSelected(Array.from(selectedIds));
        setSelectedIds(new Set()); // clear selection after starting
    }
  };

  return (
    <div className="p-4 animate-in fade-in">
      <div className="flex justify-between items-end mb-6">
        <div>
            <h1 className="text-2xl font-bold text-slate-900">Chunk Library</h1>
            <p className="text-slate-500 text-sm">{chunks.length} chunks saved</p>
        </div>
        <button 
            onClick={onAddClick} 
            className="bg-indigo-600 text-white p-2.5 rounded-xl shadow hover:bg-indigo-700 hover:scale-105 transition outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
            <Plus className="w-5 h-5"/>
        </button>
      </div>

      <div className="mb-6 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400"/>
          <input 
            type="text" 
            placeholder="Search chunks..." 
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        
        <button 
            onClick={() => { setIsSelfCheckMode(!isSelfCheckMode); setRevealedIds(new Set()); }}
            className={`p-3 rounded-xl border shadow-sm transition outline-none focus:ring-2 focus:ring-indigo-500 ${isSelfCheckMode ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'}`}
            title={isSelfCheckMode ? "Exit Self-Check Mode" : "Enter Self-Check Mode"}
        >
            {isSelfCheckMode ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
        </button>

        {selectedIds.size > 0 && (
            <button 
                onClick={handleReviewClick}
                className="px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 transition flex items-center gap-2 animate-in slide-in-from-right-2 outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
                <PlayCircle className="w-5 h-5"/>
                Review ({selectedIds.size})
            </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center text-slate-400 py-20 flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center"><BookOpen className="w-8 h-8 text-slate-300"/></div>
            <p>No chunks found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(chunk => {
            const isRevealed = !isSelfCheckMode || revealedIds.has(chunk.id);
            return (
            <div 
                key={chunk.id} 
                className={`bg-white p-4 rounded-xl border shadow-sm flex justify-between items-start group transition cursor-pointer relative overflow-hidden
                    ${selectedIds.has(chunk.id) ? 'border-indigo-500 bg-indigo-50/30 ring-1 ring-indigo-500' : 'border-slate-200 hover:border-indigo-300'}`}
                onClick={() => toggleSelection(chunk.id)}
            >
              {/* Selection Checkbox */}
              <div className={`absolute top-4 right-4 w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedIds.has(chunk.id) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}`}>
                  {selectedIds.has(chunk.id) && <Check className="w-3.5 h-3.5 text-white"/>}
              </div>

              <div className="flex-1 pr-8">
                <div className="flex items-center gap-2 mb-1">
                   <span className="font-bold text-lg text-slate-800">{chunk.original}</span>
                   <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                     chunk.proficiency === Proficiency.MASTERED ? 'bg-green-100 text-green-700' :
                     chunk.proficiency === Proficiency.LEARNING ? 'bg-yellow-100 text-yellow-700' :
                     'bg-slate-100 text-slate-500'
                   }`}>
                     {chunk.proficiency === Proficiency.MASTERED ? 'Mastered' : 
                      chunk.proficiency === Proficiency.LEARNING ? 'Learning' : 'New'}
                   </span>
                </div>

                {isRevealed ? (
                    <div className="animate-in fade-in duration-200">
                        <p className="text-slate-600 text-sm mb-2">{chunk.meaning}</p>
                        <div className="text-xs text-slate-400 italic pl-2 border-l-2 border-slate-100">"{chunk.example}"</div>
                    </div>
                ) : (
                    <button 
                        onClick={(e) => toggleReveal(chunk.id, e)}
                        className="mt-2 flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors text-sm font-medium"
                    >
                        <Eye className="w-4 h-4"/> <span className="text-xs">Reveal Meaning</span>
                    </button>
                )}
              </div>
              
              <div className="flex flex-col gap-2 absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(chunk.id); }} 
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition outline-none"
                    title="Delete"
                >
                    <Trash2 className="w-4 h-4"/>
                </button>
              </div>
            </div>
          )})}
        </div>
      )}
    </div>
  );
};

// 6. Review Mode
const ReviewSession = ({ 
    chunks, 
    onUpdateProficiency, 
    onFinish,
    targetIds
}: { 
    chunks: Chunk[], 
    onUpdateProficiency: (id: string, correct: boolean) => void, 
    onFinish: () => void,
    targetIds?: string[] | null
}) => {
  const [queue, setQueue] = useState<Chunk[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    let toReview: Chunk[] = [];
    
    if (targetIds && targetIds.length > 0) {
        toReview = chunks.filter(c => targetIds.includes(c.id));
    } else {
        const needsWork = chunks.filter(c => c.proficiency !== Proficiency.MASTERED);
        if (needsWork.length > 0) {
            toReview = needsWork.slice(0, 5); 
        } else if (chunks.length > 0) {
            toReview = [...chunks].sort(() => 0.5 - Math.random()).slice(0, 3); 
        }
    }
    setQueue(toReview);
  }, [chunks, targetIds]);

  const currentChunk = queue[currentIndex];

  const handleReviewRecording = async (blob: Blob) => {
    setIsProcessing(true);
    try {
      const res = await reviewChunkPractice(blob, currentChunk.original);
      setReviewResult(res);
      onUpdateProficiency(currentChunk.id, res.isCorrect);
    } catch (e) {
      alert("Review analysis failed. Please try speaking again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const next = () => {
    setReviewResult(null);
    if (currentIndex < queue.length - 1) {
      setCurrentIndex(c => c + 1);
    } else {
      onFinish();
    }
  };

  if (!currentChunk && queue.length === 0) return (
      <div className="p-8 text-center flex flex-col items-center justify-center h-[60vh] animate-in fade-in">
          <div className="w-20 h-20 bg-indigo-50 text-indigo-200 rounded-full flex items-center justify-center mb-6"><Check className="w-10 h-10"/></div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Nothing to Review</h3>
          <p className="text-slate-500 mb-8">Add some chunks to your library first!</p>
          <button onClick={onFinish} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow hover:bg-indigo-700 transition outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">Go Back</button>
      </div>
  );

  if (!currentChunk) return (
      <div className="p-8 text-center flex flex-col items-center justify-center h-[60vh] animate-in fade-in">
          <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6"><Check className="w-10 h-10"/></div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Review Complete!</h3>
          <p className="text-slate-500 mb-8">You've finished your session.</p>
          <button onClick={onFinish} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow hover:bg-indigo-700 transition outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">Continue</button>
      </div>
  );

  return (
    <div className="p-4 flex flex-col items-center min-h-[70vh] animate-in fade-in">
      <div className="w-full flex justify-between items-center mb-10 text-slate-400 text-sm font-medium uppercase tracking-wider">
        <span>Review Mode</span>
        <span>{currentIndex + 1} / {queue.length}</span>
      </div>

      <div className="bg-white p-10 rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 w-full text-center mb-10">
        <div className="text-xs text-slate-400 mb-3 uppercase tracking-widest font-bold">Use this in a sentence</div>
        <div className="text-3xl md:text-4xl font-black text-indigo-600 mb-4 tracking-tight">{currentChunk.original}</div>
        <div className="text-slate-500 font-medium">{currentChunk.meaning}</div>
      </div>

      {!reviewResult ? (
        <>
          <Recorder onRecordingComplete={handleReviewRecording} isProcessing={isProcessing} />
          {isProcessing && <p className="mt-6 text-slate-400 animate-pulse font-medium">Analyzing pronunciation & grammar...</p>}
        </>
      ) : (
        <div className="w-full animate-in slide-in-from-bottom-4 duration-500">
          <div className={`p-6 rounded-2xl border mb-6 ${reviewResult.isCorrect ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
            <div className="flex items-center gap-3 mb-3 font-bold text-xl">
              <div className={`p-2 rounded-full ${reviewResult.isCorrect ? 'bg-green-200 text-green-700' : 'bg-orange-200 text-orange-700'}`}>
                 {reviewResult.isCorrect ? <Check className="w-5 h-5"/> : <X className="w-5 h-5"/>}
              </div>
              <span className={reviewResult.isCorrect ? 'text-green-800' : 'text-orange-800'}>
                {reviewResult.isCorrect ? "Excellent!" : "Keep Practicing"}
              </span>
            </div>
            <p className="text-slate-700 mb-3 leading-relaxed">{reviewResult.feedback}</p>
            {reviewResult.improvedSentence && (
              <div className="bg-white/80 p-3 rounded-lg text-sm text-slate-600 border border-black/5">
                <strong className="text-slate-800">Better:</strong> {reviewResult.improvedSentence}
              </div>
            )}
          </div>
          <button onClick={next} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-indigo-700 hover:shadow-indigo-200 transition flex items-center justify-center gap-2 outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
            {currentIndex < queue.length - 1 ? <>Next Chunk <ArrowRight className="w-5 h-5"/></> : "Finish Review"}
          </button>
        </div>
      )}
    </div>
  );
};

// 7. Add Chunk Screen (Full Page)
interface ChunkFormState {
    original: string;
    meaning: string;
    example: string;
    exampleTranslation: string;
    tags: string;
}

const AddChunkScreen = ({ onCancel, onSave }: { onCancel: () => void, onSave: (c: Omit<Chunk, 'id' | 'proficiency' | 'createdAt'>) => void }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ChunkFormState>({
      original: '', meaning: '', example: '', exampleTranslation: '', tags: ''
  });

  const handleAutoGenerate = async () => {
    if (!formData.original) return;
    setLoading(true);
    try {
      const data = await autoCompleteChunk(formData.original);
      setFormData({
          original: data.original,
          meaning: data.meaning,
          example: data.example,
          exampleTranslation: data.exampleTranslation,
          tags: data.tags.join(', ')
      });
    } catch (e) {
      alert("Failed to generate details. Please enter them manually.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveClick = () => {
      if (!formData.original || !formData.meaning) {
          alert("Please fill at least the Chunk and Meaning fields.");
          return;
      }
      onSave({
          original: formData.original,
          meaning: formData.meaning,
          example: formData.example,
          exampleTranslation: formData.exampleTranslation,
          tags: formData.tags.split(',').map(t => t.trim()).filter(t => t)
      });
      onCancel();
  };

  return (
    <div className="p-6 animate-in fade-in">
      <div className="flex items-center gap-2 mb-6">
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-700 transition"><ChevronRight className="rotate-180 w-5 h-5"/></button>
          <h1 className="text-2xl font-bold text-slate-900">Add New Chunk</h1>
      </div>
      
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-6">
          
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">New Chunk / Phrase</label>
            <div className="flex gap-2">
                <input 
                    className="flex-1 p-4 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-0 outline-none text-lg font-medium transition-colors"
                    placeholder="e.g. 'Piece of cake'"
                    value={formData.original}
                    onChange={e => setFormData({...formData, original: e.target.value})}
                    autoFocus
                />
            </div>
            <button 
                onClick={handleAutoGenerate}
                disabled={loading || !formData.original}
                className="mt-3 text-sm font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-3 py-2 rounded-lg transition flex items-center gap-2 disabled:opacity-50"
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4"/>}
                Auto-Complete with AI
            </button>
          </div>

          <div className="border-t border-slate-100 pt-6 space-y-4">
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Meaning</label>
                <input 
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
                    value={formData.meaning}
                    onChange={e => setFormData({...formData, meaning: e.target.value})}
                    placeholder="Chinese translation"
                />
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Example Sentence</label>
                <textarea 
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none h-24 resize-none"
                    value={formData.example}
                    onChange={e => setFormData({...formData, example: e.target.value})}
                    placeholder="An example using the chunk"
                />
            </div>
            
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Example Translation</label>
                <textarea 
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none h-20 resize-none"
                    value={formData.exampleTranslation}
                    onChange={e => setFormData({...formData, exampleTranslation: e.target.value})}
                    placeholder="Translation of the example"
                />
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Tags</label>
                <input 
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
                    value={formData.tags}
                    onChange={e => setFormData({...formData, tags: e.target.value})}
                    placeholder="Comma separated (e.g. Business, Casual)"
                />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
              <button onClick={onCancel} className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition">Cancel</button>
              <button onClick={handleSaveClick} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg transition">Save Chunk</button>
          </div>

      </div>
    </div>
  );
};


// --- Main App Shell ---

export default function App() {
  // Auth State
  const [user, setUser] = useState<string | null>(() => localStorage.getItem('sn_current_user'));
  
  // App State
  const [view, setView] = useState<ViewState>(ViewState.HOME);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<{t: Topic, q: string} | null>(null);
  const [reviewTargetIds, setReviewTargetIds] = useState<string[] | null>(null);

  // Load chunks when user changes
  useEffect(() => {
    if (user) {
        const saved = localStorage.getItem(`sn_chunks_${user}`);
        setChunks(saved ? JSON.parse(saved) : []);
        localStorage.setItem('sn_current_user', user);
    } else {
        setChunks([]);
        localStorage.removeItem('sn_current_user');
    }
  }, [user]);

  // Save chunks whenever they change (if logged in)
  useEffect(() => {
    if (user) {
        localStorage.setItem(`sn_chunks_${user}`, JSON.stringify(chunks));
    }
  }, [chunks, user]);

  const handleLogin = (username: string) => {
    setUser(username);
    setView(ViewState.HOME);
  };

  const handleLogout = () => {
    setUser(null);
  };

  const saveChunk = (data: Omit<Chunk, 'id' | 'proficiency' | 'createdAt'>) => {
    const newChunk: Chunk = {
      ...data,
      id: Date.now().toString(),
      proficiency: Proficiency.NEW,
      createdAt: Date.now()
    };
    setChunks(prev => [newChunk, ...prev]);
  };

  const deleteChunk = (id: string) => {
    setChunks(prev => prev.filter(c => c.id !== id));
  };

  const updateProficiency = (id: string, correct: boolean) => {
    setChunks(prev => prev.map(c => {
      if (c.id !== id) return c;
      let newProf = c.proficiency;
      if (correct && newProf < Proficiency.MASTERED) newProf++;
      if (!correct && newProf > Proficiency.NEW) newProf--;
      return { ...c, proficiency: newProf };
    }));
  };

  const startReview = (ids?: string[]) => {
      setReviewTargetIds(ids || null);
      setView(ViewState.REVIEW);
  };

  // View Switching Logic
  const renderContent = () => {
    switch (view) {
      case ViewState.HOME:
        return (
          <TopicSelector onSelect={(t, q) => {
            setSelectedTopic({ t, q });
            setView(ViewState.PRACTICE);
          }} />
        );
      case ViewState.PRACTICE:
        if (!selectedTopic) return null;
        return (
          <PracticeSession 
            topic={selectedTopic.t} 
            question={selectedTopic.q} 
            onFinish={() => setView(ViewState.HOME)} 
            onSaveChunk={saveChunk}
          />
        );
      case ViewState.LIBRARY:
        return (
            <ChunkLibrary 
                chunks={chunks} 
                onDelete={deleteChunk} 
                onReviewSelected={(ids) => startReview(ids)}
                onAddClick={() => setView(ViewState.ADD_CHUNK)}
            />
        );
      case ViewState.ADD_CHUNK:
        return (
            <AddChunkScreen 
                onCancel={() => setView(ViewState.LIBRARY)}
                onSave={saveChunk}
            />
        );
      case ViewState.REVIEW:
        return (
          <ReviewSession 
            chunks={chunks} 
            onUpdateProficiency={updateProficiency} 
            onFinish={() => setView(ViewState.LIBRARY)} 
            targetIds={reviewTargetIds}
          />
        );
    }
  };

  if (!user) {
      return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-100/50 font-sans text-slate-900">
      <div className="max-w-2xl mx-auto min-h-screen flex flex-col bg-white shadow-2xl shadow-slate-200/50 border-x border-slate-100">
        
        {/* Top Header Navigation */}
        <header className="flex items-center justify-between px-6 py-5 bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100">
           <div 
             className="flex items-center gap-2 cursor-pointer group outline-none" 
             onClick={() => setView(ViewState.HOME)}
           >
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center text-white shadow-md group-hover:scale-105 transition">
                <Mic className="w-5 h-5"/>
              </div>
              <span className="font-black text-xl tracking-tight text-slate-800">Speak<span className="text-indigo-600">Native</span></span>
           </div>

           <nav className="flex items-center gap-1">
              <button 
                 onClick={() => startReview()} 
                 className={`p-2 rounded-lg flex items-center gap-2 text-sm font-bold transition outline-none focus:ring-2 focus:ring-slate-200 ${view === ViewState.REVIEW ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
              >
                 <RotateCcw className="w-4 h-4"/> Review
              </button>
              <div className="w-px h-4 bg-slate-200 mx-1"></div>
              <button 
                 onClick={() => setView(ViewState.LIBRARY)} 
                 className={`p-2 rounded-lg flex items-center gap-2 text-sm font-bold transition outline-none focus:ring-2 focus:ring-slate-200 ${view === ViewState.LIBRARY || view === ViewState.ADD_CHUNK ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
              >
                 <BookOpen className="w-4 h-4"/> Library
              </button>
              <div className="w-px h-4 bg-slate-200 mx-1"></div>
              <button 
                onClick={handleLogout}
                className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
                title="Log Out"
              >
                  <LogOut className="w-4 h-4"/>
              </button>
           </nav>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>

      </div>
    </div>
  );
}