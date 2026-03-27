import { $ctx } from "@milkdown/kit/utils";
export const defaultDiffConfig = {
    acceptButtonTitle: "Accept",
    rejectButtonTitle: "Reject",
};
export const diffConfigCtx = $ctx(defaultDiffConfig, "diffInlineConfig");
export function diffConfig(config = {}) {
    return (ctx) => {
        ctx.update(diffConfigCtx.key, (prev) => ({
            ...prev,
            ...config,
        }));
    };
}
