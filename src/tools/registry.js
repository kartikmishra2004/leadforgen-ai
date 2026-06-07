import {
    appointmentToolDefinition,
    createAppointmentExecutor
} from "./appointment.tool.js";

export const TOOLS = [
    appointmentToolDefinition
];

export const TOOL_EXECUTORS = {
    create_appointment:
        createAppointmentExecutor
};