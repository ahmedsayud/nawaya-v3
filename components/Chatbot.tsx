
import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { useUser } from '../context/UserContext';
import { ChatBubbleIcon, CloseIcon, PaperAirplaneIcon, LightBulbIcon } from './icons';

interface Message {
  role: 'user' | 'model';
  text: string;
}

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const { workshops } = useUser();
  const chatRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const initChat = () => {
      if (!process.env.API_KEY) {
          console.warn("Gemini API Key is missing. Chatbot disabled.");
          setIsAvailable(false);
          setMessages([{ role: 'model', text: 'عذراً، خدمة المساعد الذكي غير مفعلة حالياً.' }]);
          return;
      }

      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const workshopDataForAI = workshops
          .filter(w => w.isVisible && !w.isDeleted)
          .map(w => ({
            id: w.id,
            title: w.title,
            instructor: w.instructor,
            startDate: w.startDate,
            location: w.location,
            isRecorded: w.isRecorded,
            description: w.description?.substring(0, 150) + '...',
            price: w.price,
            packages: w.packages?.map(p => ({
              name: p.name,
              price: p.price,
              discountPrice: p.discountPrice,
            }))
          }));

        chatRef.current = ai.chats.create({
          model: 'gemini-2.5-flash',
          config: {
            systemInstruction: `أنت مساعد ذكي لمنصة 'نوايا للفعاليات'. أجب باختصار ومودة، ساعد المستخدمين في العثور على الورش المناسبة.`,
          },
          history: [
            {
              role: "user",
              parts: [{ text: `بيانات الورش:\n${JSON.stringify(workshopDataForAI)}` }],
            },
            {
              role: "model",
              parts: [{ text: "أنا جاهز للمساعدة." }],
            },
          ]
        });

        setMessages([
          { role: 'model', text: 'أهلاً بك في منصة نوايا! 💜 أنا هنا لمساعدتك في اختيار ورشتك القادمة.' }
        ]);
      } catch (error) {
        console.error("Error initializing Gemini Chat:", error);
        setIsAvailable(false);
        setMessages([
          { role: 'model', text: 'عذراً، المساعد الذكي يواجه مشكلة تقنية حالياً.' }
        ]);
      }
    };
    initChat();
  }, [workshops]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    const inputText = inputRef.current?.value;
    if (!inputText?.trim() || isLoading || !chatRef.current || !isAvailable) return;

    const newUserMessage: Message = { role: 'user', text: inputText };
    setMessages(prev => [...prev, newUserMessage]);
    if (inputRef.current) inputRef.current.value = '';
    setIsLoading(true);

    try {
      const responseStream = await chatRef.current.sendMessageStream({ message: inputText });
      
      let currentResponse = '';
      setMessages(prev => [...prev, { role: 'model', text: '' }]);

      for await (const chunk of responseStream) {
        currentResponse += chunk.text;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].text = currentResponse;
          return newMessages;
        });
      }
    } catch (error) {
      console.error("Gemini API error:", error);
      setMessages(prev => {
        const newMessages = [...prev];
        const errorMessage = 'عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.';
        
        if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'model' && newMessages[newMessages.length - 1].text === '') {
            newMessages[newMessages.length - 1].text = errorMessage;
        } else {
            newMessages.push({ role: 'model', text: errorMessage });
        }
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAvailable && !isOpen) return null;

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`chatbot-fab fixed bottom-6 left-6 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 border-2 border-fuchsia-400/50 ${isOpen ? 'bg-slate-800 rotate-90' : 'bg-gradient-to-r from-purple-800 to-fuchsia-600'}`}
        aria-label="افتح المساعد الذكي"
      >
        {isOpen ? <CloseIcon className="w-6 h-6 text-white"/> : <ChatBubbleIcon className="w-7 h-7 text-white" />}
      </button>

      {/* Chat Window */}
      <div 
        className={`fixed bottom-24 left-6 z-50 w-[90vw] max-w-[380px] h-[550px] max-h-[70vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 origin-bottom-left border border-fuchsia-500/30 ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-10 pointer-events-none'}`}
        style={{ backgroundColor: '#1a0b2e' }} // Consistent dark purple background
      >
        {/* Header */}
        <header className="flex-shrink-0 p-4 bg-gradient-to-r from-purple-900/90 to-fuchsia-900/90 backdrop-blur-md flex justify-between items-center border-b border-white/5">
          <div className="flex items-center gap-x-3">
            <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center shadow-inner border border-white/20">
                    <LightBulbIcon className="w-5 h-5 text-white"/>
                </div>
                {isAvailable && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#1a0b2e] rounded-full"></span>}
            </div>
            <div>
              <h2 className="text-sm font-bold text-white leading-tight">المساعد الذكي</h2>
              <p className="text-[10px] text-fuchsia-200/80 font-medium">
                  {isAvailable ? 'متصل الآن' : 'غير متوفر'}
              </p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors">
            <CloseIcon className="w-5 h-5" />
          </button>
        </header>

        {/* Messages Area */}
        <div className="flex-grow p-4 overflow-y-auto space-y-4 custom-scrollbar bg-gradient-to-b from-[#1a0b2e] to-[#2e1065]">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[85%] p-3 text-sm leading-relaxed shadow-md ${
                    msg.role === 'user' 
                    ? 'bg-gradient-to-br from-fuchsia-600 to-purple-700 text-white rounded-2xl rounded-br-none border border-fuchsia-500/20' 
                    : 'bg-slate-800/80 text-slate-200 rounded-2xl rounded-bl-none border border-slate-700 backdrop-blur-sm'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
                <div className="bg-slate-800/80 p-3 rounded-2xl rounded-bl-none border border-slate-700 flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <footer className="flex-shrink-0 p-3 bg-slate-900/90 backdrop-blur-md border-t border-white/5">
          <form onSubmit={handleSend} className="flex items-center gap-x-2 relative bg-slate-800/50 p-1 rounded-full border border-slate-700 focus-within:border-fuchsia-500/50 transition-colors">
            <input
              ref={inputRef}
              type="text"
              placeholder="اكتب استفسارك هنا..."
              className="flex-grow py-2 px-4 bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
              disabled={isLoading || !isAvailable}
            />
            <button
              type="submit"
              className="w-9 h-9 flex items-center justify-center rounded-full bg-gradient-to-tr from-purple-700 to-fuchsia-600 hover:from-purple-600 hover:to-fuchsia-500 text-white transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
              disabled={isLoading || !isAvailable}
              aria-label="إرسال"
            >
              {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                  <PaperAirplaneIcon className="w-4 h-4 -rotate-90 transform translate-x-[1px]" />
              )}
            </button>
          </form>
          <div className="text-[9px] text-center text-slate-500 mt-2">
             مدعوم بالذكاء الاصطناعي من Google Gemini
          </div>
        </footer>
      </div>
    </>
  );
};

export default Chatbot;
