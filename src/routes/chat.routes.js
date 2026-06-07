import express from "express";
import { SYSTEM_PROMPT } from "../config/ai.config.js";
import { TOOLS } from "../tools/index.js";
import { TOOL_EXECUTORS } from "../tools/index.js";

import {
    generateResponse
} from "../services/groq.service.js";

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const {
            message,
            messages: clientMessages,
            currentTime,
            organization_id,
            customer_id,
            title,
            notes
        } = req.body;
        const referenceTime = currentTime || new Date().toString();

        let systemContext = `${SYSTEM_PROMPT}\n\nCurrent Reference Time: ${referenceTime}`;
        if (organization_id) {
            systemContext += `\nTarget Organization ID: ${organization_id}`;
        }
        if (customer_id) {
            systemContext += `\nTarget Customer ID: ${customer_id}`;
        }
        if (title) {
            systemContext += `\nPreset Title: ${title}`;
        }
        if (notes) {
            systemContext += `\nPreset Notes: ${notes}`;
        }

        let messages = [];
        if (clientMessages && Array.isArray(clientMessages)) {
            const history = clientMessages.filter(msg => msg.role !== 'system');
            messages = [
                {
                    role: "system",
                    content: systemContext
                },
                ...history
            ];
        } else {
            messages = [
                {
                    role: "system",
                    content: systemContext
                },
                {
                    role: "user",
                    content: message
                }
            ];
        }

        let currentMessages = [...messages];
        let runLoop = true;
        let lastToolResult = null;

        while (runLoop) {
            console.log("--- CHAT LOOP ITERATION ---");
            console.log("Messages sent to LLM:", JSON.stringify(currentMessages, null, 2));
            const response = await generateResponse({
                messages: currentMessages,
                tools: TOOLS
            });

            const assistantMessage = response.choices[0].message;
            console.log("LLM Assistant Response:", JSON.stringify(assistantMessage, null, 2));
            currentMessages.push(assistantMessage);

            if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
                for (const toolCall of assistantMessage.tool_calls) {
                    const toolName = toolCall.function.name;
                    const args = JSON.parse(toolCall.function.arguments);
                    console.log("Executing tool:", toolName, "with args:", args);
                    const executor = TOOL_EXECUTORS[toolName];

                    if (!executor) {
                        throw new Error(`No executor for ${toolName}`);
                    }

                    let toolResult;
                    try {
                        toolResult = await executor(args);
                    } catch (err) {
                        toolResult = { error: err.message };
                    }
                    console.log("Tool execution result:", JSON.stringify(toolResult, null, 2));
                    lastToolResult = toolResult;

                    currentMessages.push({
                        role: "tool",
                        tool_call_id: toolCall.id,
                        content: JSON.stringify(toolResult)
                    });
                }
            } else {
                runLoop = false;
            }
        }

        const finalAssistantMessage = currentMessages[currentMessages.length - 1];

        return res.json({
            success: true,
            reply: finalAssistantMessage.content,
            data: lastToolResult
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            error: error.message
        });

    }
});

export default router;