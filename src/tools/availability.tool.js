import { checkSlotAvailability } from "../services/appointment.service.js";

export const availabilityToolDefinition = {
    type: "function",

    function: {
        name: "check_slot_availability",

        description: `
Check if a specific date and time slot is available for booking a 1-hour appointment.
CRITICAL: You MUST NOT call this tool if the user has only specified a time (e.g., "at 3 PM") without a day/date, or only specified a day/date (e.g., "tomorrow") without a time. In these cases, you must ask the user for the missing day/date or time instead of calling this tool.
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
                "organization_id"
            ]
        }
    }
};

export const checkSlotAvailabilityExecutor = async (args) => {
    return await checkSlotAvailability(args);
};
