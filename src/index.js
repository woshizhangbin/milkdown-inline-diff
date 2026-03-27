import { ConfigReady, EditorViewReady } from "@milkdown/core";
import { diffConfigCtx, diffConfig } from "./diff-config";
import { diffDecorationPlugin } from "./diffDecorationState";
import { extendedTableSchema } from "./extended-table-schema";
import { diffTooltipPlugins, tooltipViewConfig, } from "./diff-tooltip";
import { diff, getDiffState, jumpTo, merge } from "./markdown-diff";
const extendedTablePlugins = extendedTableSchema;
const diffAutoApplyPlugin = (ctx) => async () => {
    await ctx.wait(ConfigReady);
    await ctx.wait(EditorViewReady);
    const { originContent, modifiedContent } = ctx.get(diffConfigCtx.key);
    if (originContent !== undefined && modifiedContent !== undefined) {
        diff(ctx, modifiedContent, originContent);
    }
};
const diffTooltipConfigPlugin = (ctx) => {
    tooltipViewConfig(ctx);
    return async () => { };
};
export const diffPlugins = [
    diffConfigCtx,
    ...extendedTablePlugins,
    diffDecorationPlugin,
    ...diffTooltipPlugins,
    diffTooltipConfigPlugin,
    diffAutoApplyPlugin,
];
export const diffPlugIns = diffPlugins;
export { diffConfig, diff, getDiffState, jumpTo, merge };
