const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { verifyToken } = require('../utils/auth');

const bedrock = new BedrockRuntimeClient({ region: process.env.AWS_REGION });
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Import tool handlers
const { updateTransaction } = require('../tools/updateTransaction');
const { addMonthlyIncome } = require('../tools/addMonthlyIncome');
const { swapJar } = require('../tools/swapJar');
const { setSavingTarget } = require('../tools/setSavingTarget');
const { searchTransactions } = require('../tools/searchTransactions');
const { predictSavings } = require('../tools/predictSavings');

const tools = [
  updateTransaction,
  addMonthlyIncome,
  swapJar,
  setSavingTarget,
  searchTransactions,
  predictSavings
];

const toolDeclarations = tools.map(tool => tool.declaration);
const toolHandlers = Object.fromEntries(
  tools.map(tool => [tool.declaration.name, tool.handler])
);

const systemPrompt = `You are Jargon AI's AI Financial Assistant. You help users with:
- Personal finance management and budgeting advice
- Jargon AI banking products and services
- Financial planning and goal setting
- Investment guidance and savings strategies
- Transaction categorization and spending insights
- Vietnamese financial regulations and banking practices

Always be helpful, professional, and provide practical financial advice. 
Keep responses concise but informative. If asked about specific Jargon AI products, 
provide general information and suggest contacting Jargon AI directly for detailed terms.

IMPORTANT TOOL USAGE GUIDELINES:
- When user mentions receiving MONTHLY INCOME/SALARY (e.g., "I received my salary", "my monthly income is X"), use "add_monthly_income" tool. This will ask for allocation percentages and properly distribute the income across all jars.
- When user mentions regular income/expense to a specific jar (e.g., "I spent money on food", "I earned from freelance"), use "update_transaction" tool.
- When user mentions setting a SAVINGS TARGET/GOAL (e.g., "I want to save 5 million VND", "set my savings target to 10 million"), use "set_saving_target" tool.
- When user asks questions about their spending or transactions (e.g., "How much did I spend on coffee?", "Did I buy anything yesterday?", "Show me my food expenses"), use "search_transactions" tool to find relevant transactions.
- When user asks about future financial goals or predictions (e.g., "When can I save 100k?", "When can I buy a 10k USD car?", "How long until I reach my savings goal?"), use "predict_savings" tool to forecast based on their historical savings data.
- For search results, provide natural language responses that directly answer the user's question. For example:
  * If they ask "Did I buy coffee today?" and no transactions are found, say "No, you haven't bought any coffee today."
  * If they ask "How much did I spend on food?" and transactions are found, summarize the total amount and mention key purchases.
  * If they ask "Show me my recent expenses" and transactions are found, list the most recent ones with amounts and descriptions.
- For prediction results, provide clear answers about when they can reach their goal. For example:
  * If they ask "When can I save 100k?" and the prediction shows a target date, say "Based on your current savings rate, you can reach 100k VND by [date]."
  * If they ask about buying something expensive, explain the timeline and suggest ways to reach the goal faster.
- Always ask for allocation percentages when adding monthly income using default values (Necessity: 55%, Play: 10%, Education: 10%, Investment: 10%, Charity: 5%, Savings: 10%) but allow user to customize them.

Respond in the same language the user asks Vietnamese.`;

exports.handler = async (event) => {
  try {
    // Parse request body
    const { message, conversationHistory = [], userToken } = JSON.parse(event.body);

    if (!message) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({ error: 'Message is required' })
      };
    }

    // Verify user token
    const user = await verifyToken(userToken);
    if (!user) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

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

    // Prepare Bedrock request
    const bedrockRequest = {
      modelId: process.env.BEDROCK_MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: conversationContext
          }
        ],
        tools: toolDeclarations.length > 0 ? toolDeclarations : undefined
      })
    };

    // Call Bedrock
    const command = new InvokeModelCommand(bedrockRequest);
    const response = await bedrock.send(command);
    
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    // Check if model wants to use a tool
    if (responseBody.content && responseBody.content[0].type === 'tool_use') {
      const toolCall = responseBody.content[0];
      const toolName = toolCall.name;
      const toolArgs = toolCall.input;
      
      // Execute tool
      const toolHandler = toolHandlers[toolName];
      if (!toolHandler) {
        throw new Error(`No handler for function ${toolName}`);
      }
      
      const result = await toolHandler({ ...toolArgs, userToken: user.sub });
      
      // Generate response based on tool result
      const functionResponsePrompt = `Based on the function result below, provide a natural language response to the user's question. 
      
Function called: ${toolName}
Function arguments: ${JSON.stringify(toolArgs)}
Function result: ${JSON.stringify(result)}

User's original question: ${message}

Please provide a helpful, natural response in the same language as the user's question. If the function was successful, explain the results in a user-friendly way. If there was an error, explain what went wrong.`;

      const functionResponseRequest = {
        modelId: process.env.BEDROCK_MODEL_ID,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: functionResponsePrompt
            }
          ]
        })
      };

      const functionResponseCommand = new InvokeModelCommand(functionResponseRequest);
      const functionResponse = await bedrock.send(functionResponseCommand);
      const functionResponseBody = JSON.parse(new TextDecoder().decode(functionResponse.body));

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({
          response: functionResponseBody.content[0].text,
          success: true,
          functionData: result
        })
      };
    }

    // Return regular response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        response: responseBody.content[0].text,
        success: true
      })
    };

  } catch (error) {
    console.error('Chatbot API error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        error: 'Failed to generate response',
        details: error.message
      })
    };
  }
}; 