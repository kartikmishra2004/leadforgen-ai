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

        const firstResponse =
            await generateResponse({
                messages,
                tools: TOOLS
            });

        const assistantMessage =
            firstResponse.choices[0].message;

        if (!assistantMessage.tool_calls) {
            return res.json({
                success: true,
                reply: assistantMessage.content
            });
        }

        const toolCall =
            assistantMessage.tool_calls[0];

        const toolName =
            toolCall.function.name;

        const args = JSON.parse(
            toolCall.function.arguments
        );

        const executor =
            TOOL_EXECUTORS[toolName];

        if (!executor) {
            throw new Error(
                `No executor for ${toolName}`
            );
        }

        const toolResult =
            await executor(args);

        const finalMessages = [
            ...messages,

            assistantMessage,

            {
                role: "tool",
                tool_call_id: toolCall.id,
                content: JSON.stringify(toolResult)
            }
        ];

        const finalResponse =
            await generateResponse({
                messages: finalMessages
            });

        return res.json({
            success: true,
            reply:
                finalResponse.choices[0]
                    .message.content,
            data: toolResult
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            error: error.message
        });

    }
});

export default router;