import { createAppointment } from "../services/appointment.service.js";

export const appointmentToolDefinition = {
    type: "function",

    function: {
        name: "create_appointment",

        description: `
Create a new appointment for a customer within an organization.
Only call this tool when the user has explicitly provided both a title and an appointment date/time. Do not call this tool if either parameter is missing.
`,

        parameters: {
            type: "object",

            properties: {
                organization_id: {
                    type: "string",
                    description:
                        "Unique UUID of the organization where the appointment should be created."
                },

                customer_id: {
                    type: ["string", "null"],
                    description:
                        "UUID of the customer associated with the appointment. Optional if customer is not specified."
                },

                title: {
                    type: "string",
                    description:
                        "Short appointment title or subject. Example: Website Consultation, Dental Checkup, Demo Call."
                },

                appointment_date: {
                    type: "string",
                    description: `
                        The appointment date and time, formatted as a valid ISO 8601 timestamp with timezone offset (e.g., "2026-06-08T15:00:00+05:30").
                        You must convert the user's requested date and time (which may be in natural language relative to the current time) into this exact ISO 8601 format using the Current Reference Time.
                        `
                },

                notes: {
                    type: ["string", "null"],
                    description:
                        "Additional information or notes related to the appointment."
                }
            },

            required: [
                "organization_id",
                "title",
                "appointment_date"
            ]
        }
    }
};

export const createAppointmentExecutor = async (args) => {
    return await createAppointment(args);
};