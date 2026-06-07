import { supabase } from "../config/supabase.js";

export const createAppointment = async (payload) => {
    const { data, error } = await supabase
        .from("appointments")
        .insert([
            {
                ...payload,
                status: "scheduled"
            }
        ])
        .select()
        .single();

    if (error) throw new Error(error.message);

    return data;
};