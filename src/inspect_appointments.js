import "dotenv/config";
import { supabase } from "./config/supabase.js";

async function run() {
    const { data, error } = await supabase.from("appointments").select("*").eq("organization_id", "6980c0d8-bbdd-4a8a-ba66-7720750c4840");
    console.log("Appointments:", data);
}
run();
