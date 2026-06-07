import { supabase } from "../config/supabase.js";

export const searchCustomers = async ({ organization_id, search_query }) => {
    let query = supabase
        .from("customers")
        .select("id, name, email, phone")
        .eq("organization_id", organization_id);

    if (search_query) {
        query = query.ilike("name", `%${search_query}%`);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data;
};
