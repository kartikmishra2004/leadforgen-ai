import Groq from "groq-sdk";

export const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
    timeout: 20 * 1000
});

export const generateResponse = async ({
    messages,
    tools = []
}) => {
    const payload = {
        model: "llama-3.1-8b-instant",
        messages,
        temperature: 0
    };
    if (tools && tools.length > 0) {
        payload.tools = tools;
        payload.tool_choice = "auto";
        payload.parallel_tool_calls = false;
    }
    return await groq.chat.completions.create(payload);
};