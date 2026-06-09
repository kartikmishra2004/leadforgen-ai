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
        let lastExecutedTool = null;

        const isCustomerPreset = customer_id && customer_id !== "null" && customer_id !== "";
        const hasSearchedInHistory = messages.some(msg => 
            msg.role === "assistant" && 
            msg.content && 
            (msg.content.toLowerCase().includes("customer") || msg.content.toLowerCase().includes("which one"))
        );

        while (runLoop) {
            console.log("--- CHAT LOOP ITERATION ---");
            console.log("Messages sent to LLM:", JSON.stringify(currentMessages, null, 2));

            let availableTools = TOOLS;

            const response = await generateResponse({
                messages: currentMessages,
                tools: availableTools
            });

            const assistantMessage = response.choices[0].message;
            console.log("LLM Assistant Response:", JSON.stringify(assistantMessage, null, 2));
            currentMessages.push(assistantMessage);

            if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
                const isCustomerPreset = customer_id && customer_id !== "null" && customer_id !== "";
                const hasSearchCall = assistantMessage.tool_calls.some(tc => tc.function.name === "search_customers");
                const hasSearchedInHistoryText = currentMessages.some(msg => 
                    msg.role === "assistant" && 
                    msg.content && 
                    (msg.content.toLowerCase().includes("customer") || msg.content.toLowerCase().includes("which one"))
                );
                const isCustomerResolved = hasSearchCall || hasSearchedInHistoryText;

                let forceStop = false;
                for (const toolCall of assistantMessage.tool_calls) {
                    const toolName = toolCall.function.name;
                    const args = JSON.parse(toolCall.function.arguments);
                    
                    let toolResult;
                    if (!isCustomerPreset && (toolName === "check_slot_availability" || toolName === "create_appointment") && !isCustomerResolved) {
                        toolResult = {
                            error: "You must first call 'search_customers' to list/search customers and ask the user to explicitly select a customer or confirm booking without a customer before calling this tool."
                        };
                    } else if (!isCustomerPreset && hasSearchCall && !hasSearchedInHistoryText && (toolName === "check_slot_availability" || toolName === "create_appointment")) {
                        toolResult = {
                            error: "You must call 'search_customers' first, present the results, and wait for the user to explicitly confirm selection or request booking without a customer in the next turn before calling this tool."
                        };
                    } else {
                        console.log("Executing tool:", toolName, "with args:", args);
                        const executor = TOOL_EXECUTORS[toolName];

                        if (!executor) {
                            throw new Error(`No executor for ${toolName}`);
                        }

                        try {
                            if (toolName === "search_customers") {
                                const isBookingFlow = currentMessages.some(msg => 
                                    msg.role === "user" && 
                                    (msg.content.toLowerCase().includes("book") || 
                                     msg.content.toLowerCase().includes("appointment") || 
                                     msg.content.toLowerCase().includes("appointent") || 
                                     msg.content.toLowerCase().includes("schedule"))
                                );
                                args.limit = isBookingFlow ? 5 : 4;
                            }
                            toolResult = await executor(args);
                        } catch (err) {
                            toolResult = { error: err.message };
                        }
                    }
                    console.log("Tool execution result:", JSON.stringify(toolResult, null, 2));
                    lastToolResult = toolResult;
                    lastExecutedTool = toolName;

                    currentMessages.push({
                        role: "tool",
                        tool_call_id: toolCall.id,
                        content: JSON.stringify(toolResult)
                    });

                    if (toolName === "search_customers" && !isCustomerPreset && !hasSearchedInHistoryText) {
                        forceStop = true;
                    }
                }

                if (forceStop) {
                    console.log("Forcing stop after search_customers. Generating final response...");
                    
                    const isBookingFlow = currentMessages.some(msg => 
                        msg.role === "user" && 
                        (msg.content.toLowerCase().includes("book") || 
                         msg.content.toLowerCase().includes("appointment") || 
                         msg.content.toLowerCase().includes("appointent") || 
                         msg.content.toLowerCase().includes("schedule"))
                    );

                    const finalMessages = currentMessages.map((msg, index) => {
                        if (index === 0 && msg.role === "system") {
                            let addedPrompt = "";
                            if (isBookingFlow) {
                                addedPrompt = "\n\nIMPORTANT: You have just executed 'search_customers'. You MUST now present the list of customer results to the user. The response MUST be a single line of text. Do NOT include emails, phone numbers, or Customer IDs (UUIDs). You MUST format the response exactly as: 'these are the [number of customers] customers I found: [Customer Name 1], [Customer Name 2], ..., do you want to book appointment for them or someone else? or even book without a customer?' replacing the brackets with the actual names of the retrieved customers. Do NOT call any more tools in this turn.";
                            } else {
                                addedPrompt = "\n\nIMPORTANT: You have just executed 'search_customers'. You MUST now present the list of customer results (at most 4) to the user. Show a short, concise message listing them. For each customer, ONLY show their name. Do NOT print their Customer ID (UUID) and do NOT show their ID in brackets, just their name. Do NOT call any more tools in this turn. You MUST NOT ask the user about booking, appointments, scheduling, or booking without a customer. Just show the short list and say nothing about booking.";
                            }
                            return {
                                role: "system",
                                content: msg.content + addedPrompt
                            };
                        }
                        return msg;
                    });

                    let userPrompt = "";
                    if (isBookingFlow) {
                        userPrompt = "Please list the customer search results as a single line containing only names (no emails, no phone numbers, no IDs) in this exact format: 'these are the [number of customers] customers I found: [comma-separated names], do you want to book appointment for them or someone else? or even book without a customer?'";
                    } else {
                        userPrompt = "Please show a short message with the customer search results (at most 4 customers). For each customer, ONLY show their name. Do NOT show their ID (neither in brackets nor otherwise), email, or phone number. Do NOT ask or talk about booking or appointments.";
                    }

                    finalMessages.push({
                        role: "user",
                        content: userPrompt
                    });

                    const finalResponse = await generateResponse({
                        messages: finalMessages,
                        tools: []
                    });
                    const finalAssistantMsg = finalResponse.choices[0].message;
                    console.log("Final forced text response:", JSON.stringify(finalAssistantMsg, null, 2));
                    currentMessages.push(finalAssistantMsg);
                    runLoop = false;
                }
            } else {
                runLoop = false;
            }
        }

        const finalAssistantMessage = currentMessages[currentMessages.length - 1];

        return res.json({
            success: true,
            reply: finalAssistantMessage.content,
            data: lastExecutedTool === "search_customers" ? null : lastToolResult
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            error: error.message
        });

    }
});

export default router;