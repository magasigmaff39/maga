import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, User, Sparkles, Loader2 } from 'lucide-react';

interface AIAssistantWidgetProps {}

export const AIAssistantWidget: React.FC<AIAssistantWidgetProps> = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: 'Привет! Я AI-эдвайзер AdmitRoute. Готов подсказать по грантам, визам или мотивационным эссе. Что вас интересует?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setIsTyping(true);

    // Simulate network delay and AI generation
    setTimeout(() => {
      let aiResponse = 'Извините, я не совсем понял вопрос. Можете переформулировать?';
      
      const lowerInput = userMessage.toLowerCase();
      if (lowerInput.includes('грант') || lowerInput.includes('бесплатн') || lowerInput.includes('стипенд')) {
        aiResponse = 'Отличный вопрос! Основные варианты 100% грантов: 1) Гос. гранты РК (ЕНТ), 2) Stipendium Hungaricum (Европа), 3) KAIST (Южная Корея), 4) Need-blind колледжи США (Harvard, MIT, Princeton).';
      } else if (lowerInput.includes('эссе') || lowerInput.includes('мотиваци') || lowerInput.includes('письм')) {
        aiResponse = 'Для сильного мотивационного эссе (Personal Statement) главное — структура. Начните с "крючка" (Hook), опишите академический бэкграунд, объясните выбор вуза и завершите видением карьерных целей.';
      } else if (lowerInput.includes('ielts') || lowerInput.includes('toefl') || lowerInput.includes('sat')) {
        aiResponse = 'Для большинства топовых вузов минимальный порог — IELTS 6.5 (без секций ниже 6.0) и SAT от 1400. Для Ivy League или Oxbridge потребуется IELTS 7.5+ и SAT 1500+.';
      } else if (lowerInput.includes('дедлайн') || lowerInput.includes('когда') || lowerInput.includes('срок')) {
        aiResponse = 'Ранняя подача (Early Action / Early Decision) в США обычно закрывается 1 ноября. Регулярная (Regular Decision) — 1-15 января. В Европе и Азии сроки варьируются от февраля до мая.';
      }

      setMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-40 w-14 h-14 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-105 hover:bg-slate-800 transition-all duration-300 animate-fadeInUp ${isOpen ? 'opacity-0 pointer-events-none scale-75' : 'opacity-100'}`}
      >
        <Sparkles className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      <div className={`fixed bottom-6 right-6 z-50 w-[360px] h-[500px] max-h-[80vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col transition-all duration-300 origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 rounded-t-3xl text-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-blue-300" />
            </div>
            <div>
              <div className="text-sm font-bold">AI Консультант</div>
              <div className="text-[10px] text-blue-200">Powered by AdmitRoute AI</div>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/10 rounded-full transition">
            <X className="w-5 h-5 text-slate-300" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/50">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-slate-200' : 'bg-slate-900'}`}>
                {m.role === 'user' ? <User className="w-3.5 h-3.5 text-slate-600" /> : <Bot className="w-3.5 h-3.5 text-white" />}
              </div>
              <div className={`px-4 py-2.5 rounded-2xl max-w-[75%] text-xs leading-relaxed ${m.role === 'user' ? 'bg-slate-900 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-xs'}`}>
                {m.text}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 flex-row">
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-slate-900">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-xs flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse"></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse delay-75"></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse delay-150"></span>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-3 bg-white border-t border-slate-100 rounded-b-3xl">
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Спросить о грантах, эссе..."
              className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-slate-900 transition-all outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center disabled:opacity-50 hover:bg-slate-800 transition"
            >
              {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};
