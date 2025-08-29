import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import persirajaLogo from '/icons/persiraja-logo.png';
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
export default function AssistantPage() {
  const {
    theme
  } = useTheme();
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: 'Halo! Saya adalah **Asisten Virtual Persiraja Banda Aceh**. 👋\n\nSaya siap membantu Anda dengan:\n\n• **Cara membeli tiket** pertandingan\n• **Cara berbelanja merchandise** resmi\n• **Jadwal pertandingan** dan berita terbaru\n• **Informasi pemain** dan sejarah klub\n• Dan pertanyaan lainnya seputar **Persiraja**\n\nApa yang ingin Anda tanyakan?',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.id) {
        const {
          data
        } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
        setUserProfile(data);
      }
    };
    fetchUserProfile();
  }, [user]);
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('gemini-chat', {
        body: {
          message: input,
          history: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        }
      });
      if (error) {
        throw error;
      }
      if (data?.reply) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.reply,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('No reply received from assistant');
      }
    } catch (error: any) {
      console.error('Assistant error:', error);
      toast.error('Maaf, terjadi kesalahan. Silakan coba lagi.');
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Maaf, saya mengalami kendala teknis. Silakan coba bertanya lagi nanti.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  const quickQuestions = ["Bagaimana cara membeli tiket pertandingan?", "Dimana saya bisa beli merchandise Persiraja?", "Kapan jadwal pertandingan selanjutnya?", "Siapa saja pemain bintang Persiraja?"];
  const handleQuickQuestion = (question: string) => {
    setInput(question);
  };

  return <div className="min-h-screen bg-background flex flex-col mt-20">
      <ScrollArea className="flex-1 [&>div>div]:!scrollbar-none">
        <div className="w-full px-3 py-4 md:px-4 md:py-6">
          <div className="space-y-3 md:space-y-4">
            {messages.map(message => <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-2 md:gap-3 max-w-[85%] md:max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className="flex-shrink-0 mt-1">
                    {message.role === 'assistant' ? <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gray-500 flex items-center justify-center overflow-hidden border border-primary/20">
                        <img src={persirajaLogo} alt="Persiraja" className="w-6 h-6 md:w-8 md:h-8 object-contain" />
                      </div> : <div className="w-6 h-6 md:w-8 md:h-8 rounded-full overflow-hidden bg-secondary text-secondary-foreground flex items-center justify-center">
                        {userProfile?.avatar_url ? <img src={userProfile.avatar_url} alt="User avatar" className="w-full h-full object-cover" /> : <User className="w-3 h-3 md:w-4 md:h-4" />}
                      </div>}
                  </div>
                  
                  <div className={`rounded-2xl px-3 py-2 md:px-4 md:py-3 ${message.role === 'assistant' ? 'bg-muted text-foreground' : 'bg-primary text-primary-foreground'}`}>
                    {message.role === 'assistant' ? <div className="prose prose-neutral dark:prose-invert max-w-none text-xs md:text-sm
                        prose-p:mb-2 prose-p:leading-relaxed prose-p:text-xs md:prose-p:text-sm prose-p:indent-0
                        prose-headings:text-foreground prose-headings:font-semibold prose-headings:mb-2 prose-headings:mt-3 first:prose-headings:mt-0
                        prose-h1:text-sm md:prose-h1:text-base prose-h1:font-bold
                        prose-h2:text-sm md:prose-h2:text-base 
                        prose-h3:text-xs md:prose-h3:text-sm
                        prose-ul:mb-2 prose-ul:ml-4 prose-ul:space-y-1 prose-ul:list-disc prose-ul:list-outside
                        prose-ol:mb-2 prose-ol:ml-4 prose-ol:space-y-1 prose-ol:list-decimal prose-ol:list-outside
                        prose-li:text-xs md:prose-li:text-sm prose-li:leading-relaxed prose-li:pl-1
                        prose-blockquote:border-l-2 prose-blockquote:border-primary/30 prose-blockquote:pl-3 prose-blockquote:italic prose-blockquote:text-muted-foreground
                        prose-code:bg-background prose-code:text-foreground prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:before:content-none prose-code:after:content-none
                        prose-pre:bg-background prose-pre:text-foreground prose-pre:border prose-pre:border-border prose-pre:rounded-md prose-pre:p-3 prose-pre:overflow-x-auto prose-pre:text-xs
                        prose-strong:font-semibold prose-strong:text-foreground
                        prose-em:italic prose-em:text-foreground
                        prose-a:text-primary prose-a:underline prose-a:underline-offset-2 hover:prose-a:text-primary/80
                        prose-table:text-xs prose-table:border prose-table:border-border prose-table:rounded
                        prose-th:border prose-th:border-border prose-th:bg-muted prose-th:p-2 prose-th:font-semibold
                        prose-td:border prose-td:border-border prose-td:p-2
                        prose-hr:border-border prose-hr:my-4">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]} 
                          components={{
                            p: ({ children }) => <p className="mb-2 leading-relaxed text-xs md:text-sm whitespace-pre-wrap">{children}</p>,
                            h1: ({ children }) => <h1 className="text-sm md:text-base font-bold mb-2 mt-3 first:mt-0 text-foreground">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-sm md:text-base font-semibold mb-2 mt-3 first:mt-0 text-foreground">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-xs md:text-sm font-semibold mb-2 mt-3 first:mt-0 text-foreground">{children}</h3>,
                            h4: ({ children }) => <h4 className="text-xs md:text-sm font-medium mb-1 mt-2 first:mt-0 text-foreground">{children}</h4>,
                            h5: ({ children }) => <h5 className="text-xs font-medium mb-1 mt-2 first:mt-0 text-foreground">{children}</h5>,
                            h6: ({ children }) => <h6 className="text-xs font-medium mb-1 mt-2 first:mt-0 text-muted-foreground">{children}</h6>,
                            ul: ({ children }) => <ul className="list-disc list-outside ml-4 space-y-1 mb-2">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal list-outside ml-4 space-y-1 mb-2">{children}</ol>,
                            li: ({ children }) => <li className="text-xs md:text-sm leading-relaxed pl-1">{children}</li>,
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-2 border-primary/30 pl-3 italic text-muted-foreground my-2">
                                {children}
                              </blockquote>
                            ),
                            code: ({ children, className }) => {
                              const isInline = !className;
                              return isInline ? (
                                <code className="bg-background text-foreground px-1 py-0.5 rounded text-xs border border-border">
                                  {children}
                                </code>
                              ) : (
                                <code className={className}>{children}</code>
                              );
                            },
                            pre: ({ children }) => (
                              <pre className="bg-background text-foreground border border-border rounded-md p-3 overflow-x-auto text-xs my-2">
                                {children}
                              </pre>
                            ),
                            strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                            em: ({ children }) => <em className="italic text-foreground">{children}</em>,
                            a: ({ children, href }) => (
                              <a href={href} className="text-primary underline underline-offset-2 hover:text-primary/80" target="_blank" rel="noopener noreferrer">
                                {children}
                              </a>
                            ),
                            table: ({ children }) => (
                              <div className="overflow-x-auto my-2">
                                <table className="min-w-full text-xs border border-border rounded">
                                  {children}
                                </table>
                              </div>
                            ),
                            thead: ({ children }) => <thead className="bg-muted">{children}</thead>,
                            tbody: ({ children }) => <tbody>{children}</tbody>,
                            tr: ({ children }) => <tr className="border-b border-border">{children}</tr>,
                            th: ({ children }) => <th className="border border-border p-2 font-semibold text-left">{children}</th>,
                            td: ({ children }) => <td className="border border-border p-2">{children}</td>,
                            hr: ({ children }) => <hr className="border-border my-4" />,
                            br: () => <br className="leading-relaxed" />
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div> : <div className="text-xs md:text-sm leading-relaxed">
                        {message.content}
                      </div>}
                  </div>
                </div>
              </div>)}
            
            {isLoading && <div className="flex justify-start">
                <div className="flex gap-2 md:gap-3 max-w-[85%] md:max-w-[80%]">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden border border-primary/20">
                      <img src={persirajaLogo} alt="Persiraja" className="w-5 h-5 md:w-6 md:h-6 object-contain" />
                    </div>
                  </div>
                  <div className="rounded-2xl px-3 py-2 md:px-4 md:py-3 bg-muted">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
                      <span className="text-xs md:text-sm">Sedang mengetik...</span>
                    </div>
                  </div>
                </div>
              </div>}
          </div>
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Bottom Input Area */}
      <div className="border-t bg-background">
        <div className="w-full px-4 py-4">
           {/* Quick Questions - Show when chat is empty or after welcome message */}
           {messages.length <= 1 && <div className="mb-3 md:mb-4">
                <div className="grid grid-cols-4 gap-2">
                  {quickQuestions.map((question, index) => <button key={index} onClick={() => handleQuickQuestion(question)} className="p-2 text-xs md:text-xs text-left bg-muted hover:bg-muted/80 rounded-lg transition-colors border border-border/50 hover:border-border truncate" disabled={isLoading}>
                      {question}
                    </button>)}
                </div>
              </div>}
           
           {/* Input Form */}
           <div className="relative">
             <div className="flex items-center gap-2 md:gap-3 bg-muted rounded-lg px-3 py-0 md:px-4 md:py-0">
               <Input value={input} onChange={e => setInput(e.target.value)} onKeyPress={handleKeyPress} placeholder="Ketik pertanyaan..." disabled={isLoading} className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/70 text-xs md:text-xs" />
               <Button onClick={sendMessage} disabled={!input.trim() || isLoading} size="sm" className="rounded-md px-2 md:px-3 h-8 md:h-8 md:w-8">
                 {isLoading ? <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" /> : <Send className="w-2 h-2 md:w-3 md:h-3 mr-1" />}
               </Button>
             </div>
           </div>
          
          <p className="text-xs text-muted-foreground/70 text-center mt-3">
            Asisten Persiraja dapat membuat kesalahan. Pertimbangkan untuk memverifikasi informasi penting.
          </p>
        </div>
      </div>
    </div>;
}