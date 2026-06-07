import { checkSlotAvailability } from "../services/appointment.service.js";

export const availabilityToolDefinition = {
    type: "function",

    function: {
        name: "check_slot_availability",

        description: `
Check if a specific date and time slot is available for booking a 1-hour appointment.
Only call this tool when the user has explicitly provided the appointment date/time. Do not call this tool if the date/time is missing.
`,

        parameters: {
            type: "object",

            properties: {
                organization_id: {
                    type: "string",
                    description: "UUID of the organization."
                },

                appointment_date: {
                    type: "string",
                    description: "The requested appointment start date and time formatted as a valid ISO 8601 timestamp with timezone offset (e.g. '2026-06-08T15:00:00+05:30')."
                }
            },

            required: [
                "organization_id",
                "appointment_date"
            ]
        }
    }
};

export const checkSlotAvailabilityExecutor = async (args) => {
    return await checkSlotAvailability(args);
};
