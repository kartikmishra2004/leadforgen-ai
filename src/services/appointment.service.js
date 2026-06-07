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

export const checkSlotAvailability = async ({ organization_id, appointment_date }) => {
    const requestedStart = new Date(appointment_date);
    if (isNaN(requestedStart.getTime())) {
        throw new Error("Invalid appointment date format.");
    }

    const oneHour = 60 * 60 * 1000;
    const rangeStart = new Date(requestedStart.getTime() - oneHour).toISOString();
    const rangeEnd = new Date(requestedStart.getTime() + oneHour).toISOString();

    const { data, error } = await supabase
        .from("appointments")
        .select("id, title, appointment_date, status")
        .eq("organization_id", organization_id)
        .neq("status", "cancelled")
        .gt("appointment_date", rangeStart)
        .lt("appointment_date", rangeEnd);

    if (error) throw new Error(error.message);

    const isAvailable = data.length === 0;
    return {
        is_available: isAvailable,
        overlapping_appointments: data
    };
};