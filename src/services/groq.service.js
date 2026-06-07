import Groq from "groq-sdk";

export const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
    timeout: 20 * 1000
});

export const generateResponse = async ({
    messages,
    tools = []
}) => {
    return await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages,
        tools,
        tool_choice: "auto",
        temperature: 0
    });
};