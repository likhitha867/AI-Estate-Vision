import { useState, useRef, useEffect } from 'react';
import { Send, Mic, Loader2, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatPanel({ setHouseData }: { setHouseData: (data: any) => void }) {
  const [messages, setMessages] = useState<{role: string, content: string}[]>([
    { role: 'ai', content: 'Hello! I am your AI Architect. Describe the house you want to build and I will generate a real 3D blueprint instantly. Try: "Generate a modern 3 bedroom duplex with parking and balcony"' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // AI Connection State
  const [aiStatus, setAiStatus] = useState<{grokActive: boolean, grokModel: string} | null>(null);
  const [grokApiKey, setGrokApiKey] = useState(() => localStorage.getItem('grok_api_key') || '');

  // Design constraints
  const [width, setWidth] = useState('10');
  const [length, setLength] = useState('15');
  const [wallColor, setWallColor] = useState('#cccccc');
  const [budget, setBudget] = useState('50000');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check backend AI engine availability & settings on component mount
    const fetchAIStatus = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/ai/status');
        if (res.ok) {
          const data = await res.json();
          setAiStatus(data);
        }
      } catch (e) {
        console.warn('Unable to reach backend status endpoint, using local fallbacks.');
      }
    };
    fetchAIStatus();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleGrokKeyChange = (key: string) => {
    setGrokApiKey(key);
    if (key.trim()) {
      localStorage.setItem('grok_api_key', key);
    } else {
      localStorage.removeItem('grok_api_key');
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsTyping(true);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (grokApiKey.trim()) {
        headers['x-grok-api-key'] = grokApiKey.trim();
      }

      const response = await fetch('http://localhost:5000/api/ai/chat', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          prompt: userMessage,
          model: 'llama3',
          constraints: { width, length, color: wallColor, budget }
        })
      });

      const data = await response.json();

      // Get AI text
      const rawText: string = data.response || data.error || 'Blueprint generated!';
      const cleanText = rawText.replace(/```json[\s\S]*?```/g, '').trim();

      // Update 3D model — backend now returns { rooms, wallColor, dimensions }
      if (data.rooms) {
        setHouseData({ rooms: data.rooms, wallColor: data.wallColor, dimensions: data.dimensions });
      }

      setMessages(prev => [...prev, { role: 'ai', content: cleanText }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        role: 'ai',
        content: 'Could not reach the architecture engine. Please make sure the backend server is running on port 5000.'
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleVoice = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Voice recognition is not supported in this browser. Try Chrome.');
      return;
    }
    if (isListening) return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e: any) => setInput(e.results[0][0].transcript);
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  return (
    <div className="flex flex-col h-full bg-black/60 p-4 gap-3">

      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-3">
        <div className="w-8 h-8 rounded-full bg-[#00f0ff] flex items-center justify-center shadow-[0_0_12px_rgba(0,240,255,0.8)] flex-shrink-0">
          <span className="text-black font-bold text-sm">AI</span>
        </div>
        <div className="flex flex-col flex-grow">
          <h2 className="font-semibold text-base tracking-wide leading-tight" style={{ textShadow: '0 0 20px rgba(0,240,255,0.5)' }}>
            ArchiAI Assistant
          </h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            {grokApiKey.trim() || aiStatus?.grokActive ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse shadow-[0_0_8px_#10b981]" />
                <span className="text-[#10b981] text-[10px] font-bold uppercase tracking-wider">Grok AI (Cloud)</span>
              </>
            ) : aiStatus ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-pulse shadow-[0_0_8px_#00f0ff]" />
                <span className="text-[#00f0ff] text-[10px] font-bold uppercase tracking-wider">Ollama (Local)</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                <span className="text-amber-500 text-[10px] font-bold uppercase tracking-wider">Offline Fallback</span>
              </>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowSettings(v => !v)}
          className={`p-2 rounded-lg transition-all ${showSettings ? 'bg-[#00f0ff]/20 text-[#00f0ff]' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
          title="Design Constraints & Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Constraints Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white/5 rounded-xl p-3 border border-white/10 text-sm">
              <h3 className="text-[#00f0ff] font-semibold mb-3 text-xs uppercase tracking-widest">Design Constraints</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-xs block mb-1">Width (m)</label>
                  <input
                    type="number" value={width} min="5" max="50"
                    onChange={e => setWidth(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-[#00f0ff]"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs block mb-1">Length (m)</label>
                  <input
                    type="number" value={length} min="5" max="60"
                    onChange={e => setLength(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-[#00f0ff]"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs block mb-1">Wall Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color" value={wallColor}
                      onChange={e => setWallColor(e.target.value)}
                      className="w-10 h-8 bg-black/50 border border-white/10 rounded cursor-pointer"
                    />
                    <span className="text-gray-400 text-xs font-mono">{wallColor}</span>
                  </div>
                </div>
                <div>
                  <label className="text-gray-400 text-xs block mb-1">Budget ($)</label>
                  <input
                    type="number" value={budget} min="10000" step="5000"
                    onChange={e => setBudget(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-[#00f0ff]"
                  />
                </div>
              </div>
              
              {/* Custom Grok Key Input Section */}
              <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
                <h4 className="text-[#00f0ff] font-semibold text-xs uppercase tracking-widest">Grok AI Engine</h4>
                <div>
                  <label className="text-gray-400 text-xs block mb-1">xAI API Key (Optional Override)</label>
                  <input
                    type="password"
                    value={grokApiKey}
                    onChange={e => handleGrokKeyChange(e.target.value)}
                    placeholder="xai-..."
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-[#00f0ff] font-mono"
                  />
                  <p className="text-gray-500 text-[10px] mt-1 leading-normal">
                    Paste your x.ai API key here. Saves to local storage for premium cloud generation outside localhost!
                  </p>
                </div>
              </div>

              <p className="text-gray-500 text-xs mt-2">These constraints are sent with every message.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-grow overflow-y-auto pr-1 space-y-3" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1a1a1a transparent' }}>
        {messages.map((msg, i) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-[#00f0ff]/15 border border-[#00f0ff]/40 text-white rounded-tr-none'
                : 'bg-white/5 border border-white/10 text-gray-300 rounded-tl-none'
            }`}>
              {msg.content}
            </div>
          </motion.div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-none p-3 text-[#00f0ff] flex gap-2 items-center text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating blueprint...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleVoice}
          className={`p-3 rounded-full flex-shrink-0 transition-all ${
            isListening
              ? 'bg-red-500/20 text-red-400 animate-pulse border border-red-500/50'
              : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
          }`}
          title={isListening ? 'Listening...' : 'Voice input'}
        >
          <Mic className="w-5 h-5" />
        </button>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="e.g. Generate a 3 bedroom luxury duplex..."
          className="flex-grow bg-white/5 border border-white/10 rounded-full py-3 px-5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00f0ff] transition-colors"
        />
        <button
          onClick={handleSend}
          disabled={isTyping || !input.trim()}
          className="p-3 rounded-full bg-[#00f0ff] text-black flex-shrink-0 hover:shadow-[0_0_15px_rgba(0,240,255,0.6)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
