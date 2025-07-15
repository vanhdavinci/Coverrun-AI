import { GoogleGenAI } from "@google/genai";
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import * as updateTransaction from "./tools/updateTransaction";
import * as addMonthlyIncome from "./tools/addMonthlyIncome";

const modules = [updateTransaction, addMonthlyIncome];
const functionDeclarations = modules.map((m) => m.declaration);
const handlers = Object.fromEntries(
  modules.map((m) => [m.declaration.name, m.handler])
);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request) {
  try {
    const { message, conversationHistory = [], userToken } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Create system prompt for VPBank financial assistant
    const systemPrompt = `You are VPBank's AI Financial Assistant. You help users with:
- Personal finance management and budgeting advice
- VPBank banking products and services
- Financial planning and goal setting
- Investment guidance and savings strategies
- Transaction categorization and spending insights
- Vietnamese financial regulations and banking practices

Always be helpful, professional, and provide practical financial advice. 
Keep responses concise but informative. If asked about specific VPBank products, 
provide general information and suggest contacting VPBank directly for detailed terms.

IMPORTANT TOOL USAGE GUIDELINES:
- When user mentions receiving MONTHLY INCOME/SALARY (e.g., "I received my salary", "my monthly income is X"), use "add_monthly_income" tool. This will ask for allocation percentages and properly distribute the income across all jars.
- When user mentions regular income/expense to a specific jar (e.g., "I spent money on food", "I earned from freelance"), use "update_transaction" tool.
- Always ask for allocation percentages when adding monthly income using default values (Necessity: 55%, Play: 10%, Education: 10%, Investment: 10%, Charity: 5%, Savings: 10%) but allow user to customize them.

Respond in the same language the user asks Vietnamese.`;

    // Build conversation context
    let conversationContext = systemPrompt + "\n\n";
    
    // Add conversation history
    conversationHistory.forEach((msg) => {
      if (msg.role === 'user') {
        conversationContext += `User: ${msg.content}\n`;
      } else if (msg.role === 'assistant') {
        conversationContext += `Assistant: ${msg.content}\n`;
      }
    });
    
    // Add current message
    conversationContext += `User: ${message}\nAssistant:`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite-preview-06-17",
      contents: conversationContext,
      config: {
        tools: [
          {
            functionDeclarations,
          }
        ],
      },
    });
        // 5️⃣ If the model chose a function, dispatch to its handler
        if (response.functionCalls?.length) {
          const call = response.functionCalls[0];
          const fn = handlers[call.name];
          if (!fn) throw new Error(`No handler for function ${call.name}`);
          // Pass userToken to the handler
          const result = await fn({ ...call.args, userToken });
          return NextResponse.json({ fromFunction: result });
        }

    return NextResponse.json({ 
      response: response.text,
      success: true 
    });

  } catch (error) {
    console.error('Chatbot API error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate response',
      details: error.message 
    }, { status: 500 });
  }
} 