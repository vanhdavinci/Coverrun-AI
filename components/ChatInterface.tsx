"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Send, Bot, User, Trash2, Image, X, Maximize2, Minimize2 } from 'lucide-react';
import { supabase } from '@/services/supabaseClient';
import { useDataRefresh } from '@/context/DataRefreshContext';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  hasImage?: boolean;
}

interface Suggestion {
  label: string;
  value: string;
}

interface ThinkingStep {
  content: string;
  step: number;
  id: number;
}

interface ChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SSEData {
  type: 'thinking' | 'final' | 'error' | 'done';
  content?: string;
  step?: number;
}

interface RequestBody {
  message: string;
  conversation_history: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  user_email: string;
  new_thread: boolean;
  image_data?: string;
  image_format?: string;
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
      content: 'Hello! I am CoverRun Financial Assistant. I can help you with your financial management, budgeting, and answering questions about the CoverRun product.',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [currentThinking, setCurrentThinking] = useState<ThinkingStep | null>(null);
  const [thinkingHistory, setThinkingHistory] = useState<ThinkingStep[]>([]);
  const [needNewThread, setNeedNewThread] = useState<boolean>(false);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { triggerRefresh } = useDataRefresh();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentThinking]);

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  // Function to render text with markdown formatting and clickable links
  const renderTextWithLinks = (text: string) => {
    // Clean up brackets and parentheses around URLs first
    let cleanedText = text
      .replace(/\[(https?:\/\/[^\s\[\]]+)\]/g, '$1') // Remove [url]
      .replace(/\((https?:\/\/[^\s\[\]]+)\)/g, '$1') // Remove (url)
      .replace(/\[(https?:\/\/[^\s\[\]]+)\]/g, '$1'); // Remove [url] again for nested cases
    
    // Then handle URLs with improved regex
    const urlRegex = /(https?:\/\/[^\s\[\]()]+)/g;
    const urlParts = cleanedText.split(urlRegex);
    
    const processedParts = urlParts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={`url-${index}`}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block hover:bg-white text-blue-700 px-2 py-1 rounded text-xs font-medium transition-colors"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            Click here
          </a>
        );
      }
      return part;
    });

    // Then process markdown formatting
    return processedParts.map((part, index) => {
      if (typeof part === 'string') {
        return renderMarkdown(part, index);
      }
      return part;
    });
  };

  // Function to render markdown formatting
  const renderMarkdown = (text: string, keyPrefix: number) => {
    // Handle bold text **text**
    const boldRegex = /\*\*(.*?)\*\*/g;
    const parts = text.split(boldRegex);
    
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        // This is bold text
        return (
          <strong key={`bold-${keyPrefix}-${index}`} className="font-semibold">
            {part}
          </strong>
        );
      }
      
      // Handle italic text *text*
      const italicRegex = /\*(.*?)\*/g;
      const italicParts = part.split(italicRegex);
      
      return italicParts.map((italicPart, italicIndex) => {
        if (italicIndex % 2 === 1) {
          // This is italic text
          return (
            <em key={`italic-${keyPrefix}-${index}-${italicIndex}`} className="italic">
              {italicPart}
            </em>
          );
        }
        
        // Handle bullet points with single *
        if (italicPart.startsWith('* ')) {
          return (
            <div key={`bullet-${keyPrefix}-${index}-${italicIndex}`} className="ml-2">
              <span className="text-blue-600 mr-2">•</span>
              <span>{italicPart.substring(2)}</span>
            </div>
          );
        }
        
        return italicPart;
      });
    });
  };

  const handleSendMessage = async (): Promise<void> => {
    if ((!inputMessage.trim() && !selectedImage) || isLoading) return;

    // Create user message content
    let messageContent = inputMessage;
    
    // If there's an image, show a placeholder in the UI
    if (selectedImage) {
      messageContent = inputMessage || 'Sent an image';
    }

    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: messageContent,
      timestamp: new Date(),
      hasImage: !!selectedImage
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setCurrentThinking(null);
    setThinkingHistory([]);

    try {
      // Get user email for identification
      const { data: { session } } = await supabase.auth.getSession();
      const userEmail = session?.user?.email;

      if (!userEmail) {
        throw new Error('User email not found. Please log in again.');
      }

      // Prepare request body
      const requestBody: RequestBody = {
        message: inputMessage || 'Analyze this image',
        conversation_history: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        user_email: userEmail,
        new_thread: needNewThread
      };

      // Add image data if available
      if (selectedImage) {
        const reader = new FileReader();
        const imagePromise = new Promise<void>((resolve, reject) => {
          reader.onloadend = () => {
            // Get base64 data without the prefix (data:image/jpeg;base64,)
            const result = reader.result as string;
            const base64Data = result.split(',')[1];
            const imageFormat = result.split(',')[0].split(':')[1].split(';')[0];
            
            requestBody.image_data = base64Data;
            requestBody.image_format = imageFormat;
            resolve();
          };
          reader.onerror = reject;
          reader.readAsDataURL(selectedImage);
        });

        await imagePromise;
        // Clear the image after sending
        setSelectedImage(null);
        setImagePreview(null);
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      
      // Use streaming endpoint
      const response = await fetch(`${backendUrl}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let finalResponse = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data: SSEData = JSON.parse(line.slice(6));
              
              if (data.type === 'thinking') {
                // Update current thinking step
                setCurrentThinking({
                  content: data.content || '',
                  step: data.step || 0,
                  id: Date.now() + Math.random()
                });
                
                // Add to thinking history
                setThinkingHistory(prev => [...prev, {
                  content: data.content || '',
                  step: data.step || 0,
                  id: Date.now() + Math.random()
                }]);
                
                // Clear current thinking after a delay (like GPT thinking mode)
                setTimeout(() => {
                  setCurrentThinking(null);
                }, 2000);
                
              } else if (data.type === 'final') {
                // Handle both string and object responses
                let responseContent = '';
                if (typeof data.content === 'string') {
                  responseContent = data.content;
                } else if (Array.isArray(data.content)) {
                  // Handle array of content blocks (like from LangChain)
                  responseContent = (data.content as any[])
                    .map(block => {
                      if (typeof block === 'string') return block;
                      if (block && typeof block === 'object' && (block as any).text) return (block as any).text;
                      return '';
                    })
                    .filter(text => text.length > 0)
                    .join(' ');
                } else if (data.content && typeof data.content === 'object') {
                  // Handle object content
                  const contentObj = data.content as any;
                  if (contentObj.text) {
                    responseContent = contentObj.text;
                  } else {
                    responseContent = JSON.stringify(data.content);
                  }
                } else {
                  responseContent = String(data.content || '');
                }
                
                finalResponse = responseContent;
                setCurrentThinking(null);
                
                const assistantMessage: Message = {
                  id: Date.now() + 1,
                  role: 'assistant',
                  content: finalResponse,
                  timestamp: new Date()
                };
                setMessages(prev => [...prev, assistantMessage]);
                
              } else if (data.type === 'error') {
                throw new Error(data.content || 'Unknown error');
              } else if (data.type === 'done') {
                // Always trigger refresh after successful response in case tools were used
                console.log("ChatInterface: Streaming response completed, triggering refresh");
                triggerRefresh();
                // Reset the new thread flag after successful completion
                setNeedNewThread(false);
                break;
              }
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError);
            }
          }
        }
      }

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'An error occurred, please try again later',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setCurrentThinking(null);
      // Reset the new thread flag in case of error
      setNeedNewThread(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/gif')) {
      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = (): void => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Add clear chat handler
  const handleClearChat = (): void => {
    setMessages([
      {
        id: 1,
        role: 'assistant',
        content: 'Hello! I am CoverRun Financial Assistant. I can help you with your financial management, budgeting, and answering questions about the CoverRun product.',
        timestamp: new Date()
      }
    ]);
    setCurrentThinking(null);
    setThinkingHistory([]);
    setNeedNewThread(true); // Flag to create new thread on next message
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed bg-white rounded-lg shadow-2xl border border-blue-200 flex flex-col z-50 transition-all duration-300 ${
        isMaximized 
          ? 'top-4 left-4 right-4 bottom-20 w-auto h-auto' 
          : 'bottom-20 right-4 w-96 h-[700px]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-600 text-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <span className="font-semibold">CoverRun AI Assistant</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={toggleMaximize}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-blue-700 p-1 h-auto"
            title={isMaximized ? "Thu nhỏ" : "Phóng to"}
          >
            {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
          <Button
            onClick={handleClearChat}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-gray-600 p-1 h-auto"
            title="Xóa hội thoại"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-gray-600 p-1 h-auto"
          >
            ✕
          </Button>
        </div>
      </div>

      {/* Suggestions */}
      {messages.length === 1 && messages[0].role === 'assistant' && (
        <div className="p-4 border-b border-blue-100 bg-blue-50">
          <div className="mb-2 text-sm text-blue-700 font-semibold">Gợi ý câu hỏi:</div>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                className="bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-full px-3 py-1 text-xs font-medium transition"
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: '500px' }}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-100 text-blue-800 border border-blue-300'
              }`}
            >
              <div className="flex items-start gap-2">
                {message.role === 'assistant' && (
                  <Bot className="w-4 h-4 mt-0.5 flex-shrink-0" />
                )}
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.hasImage && (
                    <div className="flex items-center gap-1 mb-1 text-xs font-medium">
                      <Image className="w-3 h-3" /> 
                      <span>{message.role === 'user' ? 'Image sent' : 'Image analyzed'}</span>
                    </div>
                  )}
                  {message.role === 'assistant' ? renderTextWithLinks(message.content) : message.content}
                </div>
                {message.role === 'user' && (
                  <User className="w-4 h-4 mt-0.5 flex-shrink-0" />
                )}
              </div>
              <div className={`text-xs mt-1 ${
                message.role === 'user' ? 'text-blue-100' : 'text-blue-600'
              }`}>
                {message.timestamp.toLocaleTimeString('vi-VN', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          </div>
        ))}
        {/* Thinking display */}
        {currentThinking && (
          <div className="flex justify-start">
            <div className="bg-blue-50 rounded-lg p-3 max-w-[80%] border border-blue-200">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-blue-500" />
                <div className="text-sm text-blue-600 italic">
                  {currentThinking.content}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Loading indicator when no thinking is shown */}
        {isLoading && !currentThinking && (
          <div className="flex justify-start">
            <div className="bg-blue-50 rounded-lg p-3 max-w-[80%] border border-blue-200">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-blue-500" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-blue-200 flex-shrink-0">
        {/* Image preview */}
        {imagePreview && (
          <div className="mb-2 relative">
            <div className="relative inline-block">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="h-20 rounded-md object-cover border border-gray-300" 
              />
              <button
                onClick={handleRemoveImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                type="button"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
        
        <div className="flex gap-2">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here..."
            className="flex-1 resize-none border border-blue-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={2}
            disabled={isLoading}
          />
          <div className="flex flex-col gap-2">
            {/* Image upload button */}
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg"
              title="Upload image"
            >
              <Image className="w-4 h-4" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif"
              onChange={handleImageSelect}
              className="hidden"
            />
            {/* Send button */}
            <Button
              onClick={handleSendMessage}
              disabled={(!(inputMessage.trim() || selectedImage)) || isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface; 