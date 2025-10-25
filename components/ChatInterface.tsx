"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Send, Bot, User, Trash2 } from 'lucide-react';
import { supabase } from '@/services/supabaseClient';
import { useDataRefresh } from '@/context/DataRefreshContext';

interface Suggestion {
  label: string;
  value: string;
}

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUGGESTIONS: Suggestion[] = [
  {
    label: 'Tôi đã chi bao nhiêu cho cà phê/thức uống tuần này?',
    value: 'Tôi đã chi bao nhiêu cho cà phê hoặc nước uống tuần này?'
  },
  {
    label: 'Khi nào tôi có thể tiết kiệm được 50 triệu?',
    value: 'Khi nào tôi có thể tiết kiệm được 50 triệu?'
  },
  {
    label: 'Tôi vừa chi 5 triệu để trả tiền thuê nhà.',
    value: 'Tôi vừa chi 5 triệu để trả tiền thuê nhà.'
  },
  {
    label: 'Tôi muốn đặt mục tiêu tiết kiệm 50 triệu',
    value: 'Tôi muốn đặt mục tiêu tiết kiệm 50 triệu.'
  },
  {
    label: 'Tôi nhận lương tháng này',
    value: 'Tôi vừa nhận lương tháng này.'
  },
];

const ChatInterface: React.FC<ChatInterfaceProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'assistant',
      content: 'Xin chào! Tôi là trợ lý tài chính AI của CoverRun AI. Tôi có thể giúp bạn với quản lý tài chính, lập kế hoạch ngân sách, và các câu hỏi về sản phẩm CoverRun AI. Bạn cần hỗ trợ gì?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { triggerRefresh } = useDataRefresh();

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (): Promise<void> => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Get user token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      const userToken = session?.access_token;

      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          conversationHistory: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          userToken: userToken
        }),
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: Message = {
          id: Date.now() + 1,
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else if (data.fromFunction) {
        // Handle function call response
        const functionResponse = data.fromFunction;
        const assistantMessage: Message = {
          id: Date.now() + 1,
          role: 'assistant',
          content: functionResponse.success 
            ? functionResponse.message || 'Đã thực hiện thành công!'
            : `Lỗi: ${functionResponse.error}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);

        // If transaction was successful, trigger refresh
        if (functionResponse.success) {
          console.log("ChatInterface: Function successful, triggering refresh");
          triggerRefresh();
        }
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Add clear chat handler
  const handleClearChat = (): void => {
    setMessages([
      {
        id: 1,
        role: 'assistant',
        content: 'Xin chào! Tôi là trợ lý tài chính AI của CoverRun AI. Tôi có thể giúp bạn với quản lý tài chính, lập kế hoạch ngân sách, và các câu hỏi về sản phẩm CoverRun AI. Bạn cần hỗ trợ gì?',
        timestamp: new Date()
      }
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-20 right-4 w-96 h-[500px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-green-600 text-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <span className="font-semibold">CoverRun AI AI Assistant</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleClearChat}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-red-600 p-1 h-auto"
            title="Xóa hội thoại"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-green-700 p-1 h-auto"
          >
            ✕
          </Button>
        </div>
      </div>

      {/* Suggestions */}
      {messages.length === 1 && messages[0].role === 'assistant' && (
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <div className="mb-2 text-sm text-gray-700 font-semibold">Gợi ý câu hỏi:</div>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                className="bg-green-100 hover:bg-green-200 text-green-800 rounded-full px-3 py-1 text-xs font-medium transition"
                onClick={() => setInputMessage(s.value)}
                type="button"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <div className="flex items-start gap-2">
                {message.role === 'assistant' && (
                  <Bot className="w-4 h-4 mt-0.5 flex-shrink-0" />
                )}
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </div>
                {message.role === 'user' && (
                  <User className="w-4 h-4 mt-0.5 flex-shrink-0" />
                )}
              </div>
              <div className={`text-xs mt-1 ${
                message.role === 'user' ? 'text-green-100' : 'text-gray-500'
              }`}>
                {message.timestamp.toLocaleTimeString('vi-VN', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Nhập câu hỏi của bạn..."
            className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            rows={2}
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
