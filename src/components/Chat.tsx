'use client'

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function Chat() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ user: string; bot: string }[]>([]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    const data = await response.json();

    setChatHistory([...chatHistory, { user: message, bot: data.reply }]);
    setMessage('');
  };

  return (
    <div className="p-4 border rounded-lg">
      <div className="h-64 overflow-y-auto mb-4">
        {chatHistory.map((chat, index) => (
          <div key={index} className="mb-2">
            <p><strong>You:</strong> {chat.user}</p>
            <p><strong>Bot:</strong> {chat.bot}</p>
          </div>
        ))}
      </div>
      <div className="flex">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
        />
        <Button onClick={handleSendMessage} className="ml-2">
          Send
        </Button>
      </div>
    </div>
  );
}