import { searchCustomers } from "../services/customer.service.js";

export const customerToolDefinition = {
    type: "function",

    function: {
        name: "search_customers",

        description: `
Search for customers within an organization.
Use this tool to find a customer ID when the user mentions a customer name or to let the user select from a list of matches.
`,

        parameters: {
            type: "object",

            properties: {
                organization_id: {
                    type: "string",
                    description: "UUID of the organization."
                },

                search_query: {
                    type: ["string", "null"],
                    description: "Name or partial name of the customer to search for. If null or not provided, searches all customers."
                }
            },

            required: [
                "organization_id"
            ]
        }
    }
};

export const searchCustomersExecutor = async (args) => {
    const result = await searchCustomers(args);
    if (!result || result.length === 0) {
        return {
            status: "error",
            message: "No matching customers found."
        };
    }
    return result;
};
