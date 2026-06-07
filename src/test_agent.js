import "dotenv/config";
import app from "./app.js";
import { supabase } from "./config/supabase.js";

const PORT = 3001;
const ORG_ID = "6980c0d8-bbdd-4a8a-ba66-7720750c4840";
const CURRENT_TIME = "2026-06-08T10:00:00+05:30"; // Set a stable reference time (Monday, June 8, 2026)

async function testScenario1() {
    console.log("\n==================================================");
    console.log("SCENARIO 1: Booking with a named customer (Aditya Yadav)");
    console.log("==================================================");

    let messages = [];

    // Turn 1: User requests booking with a named customer
    const userMsg1 = "Book a Test Consultation tomorrow at 4 PM for Aditya Yadav";
    console.log(`User: ${userMsg1}`);
    let response = await sendChatRequest(userMsg1, messages);
    console.log(`Agent:\n${response.reply}`);
    console.log("Returned Data:", response.data);

    // Turn 2: User confirms the customer selection
    const userMsg2 = "Yes, book it for Aditya Yadav";
    console.log(`User: ${userMsg2}`);
    response = await sendChatRequest(userMsg2, messages);
    console.log(`Agent:\n${response.reply}`);
    console.log("Returned Data:", response.data);
}

async function testScenario2() {
    console.log("\n==================================================");
    console.log("SCENARIO 2: Booking with no customer initially mentioned, then selecting Manas Gangrade");
    console.log("==================================================");

    let messages = [];

    // Turn 1: User requests booking
    const userMsg1 = "Book a Test Consultation tomorrow at 5 PM";
    console.log(`User: ${userMsg1}`);
    let response = await sendChatRequest(userMsg1, messages);
    console.log(`Agent:\n${response.reply}`);
    console.log("Returned Data:", response.data);

    // Turn 2: User selects a customer from the list
    const userMsg2 = "For Manas Gangrade";
    console.log(`User: ${userMsg2}`);
    response = await sendChatRequest(userMsg2, messages);
    console.log(`Agent:\n${response.reply}`);
    console.log("Returned Data:", response.data);
}

async function testScenario3() {
    console.log("\n==================================================");
    console.log("SCENARIO 3: Booking with 'no customer' explicitly stated");
    console.log("==================================================");

    let messages = [];

    // Turn 1: User requests booking
    const userMsg1 = "Book a Test Consultation tomorrow at 9 PM";
    console.log(`User: ${userMsg1}`);
    let response = await sendChatRequest(userMsg1, messages);
    console.log(`Agent:\n${response.reply}`);
    console.log("Returned Data:", response.data);

    // Turn 2: User explicitly requests no customer
    const userMsg2 = "Book without customer";
    console.log(`User: ${userMsg2}`);
    response = await sendChatRequest(userMsg2, messages);
    console.log(`Agent:\n${response.reply}`);
    console.log("Returned Data:", response.data);
}

async function sendChatRequest(message, messagesHistory) {
    // Add delay to prevent rate limiting (TPM limit) on Groq free tier
    await new Promise((resolve) => setTimeout(resolve, 15000));

    if (message) {
        messagesHistory.push({ role: "user", content: message });
    }

    const payload = {
        messages: messagesHistory,
        currentTime: CURRENT_TIME,
        organization_id: ORG_ID
    };

    const res = await fetch(`http://localhost:${PORT}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP Error ${res.status}: ${errorText}`);
    }

    const json = await res.json();
    if (json.success) {
        messagesHistory.push({ role: "assistant", content: json.reply });
    }
    return json;
}

async function cleanup() {
    console.log("\nCleaning up test appointments...");
    const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("organization_id", ORG_ID)
        .ilike("title", "%Test Consultation%");

    if (error) {
        console.error("Cleanup error:", error);
    } else {
        console.log("Cleanup successful!");
    }
}

async function run() {
    const server = app.listen(PORT, async () => {
        console.log(`Test server listening on port ${PORT}`);
        try {
            await cleanup();
            await testScenario1();
            await testScenario2();
            await testScenario3();
        } catch (err) {
            console.error("Error running tests:", err);
        } finally {
            await cleanup();
            server.close(() => {
                console.log("Test server closed.");
            });
        }
    });
}

run();
