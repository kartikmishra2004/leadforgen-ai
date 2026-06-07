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
                    type: "string",
                    description: "Name or partial name of the customer to search for."
                }
            },

            required: [
                "organization_id"
            ]
        }
    }
};

export const searchCustomersExecutor = async (args) => {
    return await searchCustomers(args);
};
