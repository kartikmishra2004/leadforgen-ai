import {
    appointmentToolDefinition,
    createAppointmentExecutor
} from "./appointment.tool.js";

import {
    customerToolDefinition,
    searchCustomersExecutor
} from "./customer.tool.js";

import {
    availabilityToolDefinition,
    checkSlotAvailabilityExecutor
} from "./availability.tool.js";

export const TOOLS = [
    appointmentToolDefinition,
    customerToolDefinition,
    availabilityToolDefinition
];

export const TOOL_EXECUTORS = {
    create_appointment: createAppointmentExecutor,
    search_customers: searchCustomersExecutor,
    check_slot_availability: checkSlotAvailabilityExecutor
};