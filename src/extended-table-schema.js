import { tableSchema as officialTableSchema } from "@milkdown/preset-gfm";
export const extendedTableSchema = officialTableSchema.extendSchema((prev) => {
    return (ctx) => {
        const baseSchema = prev(ctx);
        return {
            ...baseSchema,
            content: "table_header_row+ table_row+",
        };
    };
});
