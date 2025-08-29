import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import persirajaLogo from '/icons/persiraja-logo.png';

export function ChatBot() {
  const navigate = useNavigate();

  return (
    <Button
      onClick={() => navigate('/assistant')}
      className="fixed  md:bottom-6 bottom-16 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-50 bg-primary border-2 border-primary/20 hover:border-primary/40 hover:scale-105 flex items-center justify-center"
      size="icon"
      title="Asisten Persiraja"
    >
      <img 
        src={persirajaLogo} 
        alt="Asisten Persiraja" 
        className="h-14 w-14 object-contain"
      />
    </Button>
  );
}