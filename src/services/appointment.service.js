import { supabase } from "../config/supabase.js";

export const createAppointment = async (payload) => {
    // Cleanse customer_id
    let customer_id = payload.customer_id;
    if (customer_id === "" || customer_id === "null" || customer_id === undefined) {
        customer_id = null;
    }

    // 1. Validate inputs
    if (!payload.appointment_date || isNaN(new Date(payload.appointment_date).getTime())) {
        throw new Error("Invalid date/time format. Please provide a valid date and time.");
    }
    if (!payload.title || payload.title.trim() === "") {
        throw new Error("Title is required.");
    }

    // 2. Check slot availability automatically
    const availability = await checkSlotAvailability({
        organization_id: payload.organization_id,
        appointment_date: payload.appointment_date
    });

    if (!availability.is_available) {
        throw new Error("The requested slot is already booked. Please try another date or time.");
    }

    // Explicitly construct insert database payload with valid schema columns only
    const insertPayload = {
        organization_id: payload.organization_id,
        customer_id: customer_id,
        title: payload.title,
        appointment_date: payload.appointment_date,
        notes: payload.notes || null,
        status: "scheduled"
    };

    const { data, error } = await supabase
        .from("appointments")
        .insert([insertPayload])
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