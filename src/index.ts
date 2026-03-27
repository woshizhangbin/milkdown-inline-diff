import { ConfigReady, EditorViewReady } from "@milkdown/core";
import type { MilkdownPlugin } from "@milkdown/ctx";

import { diffConfigCtx, type DiffConfig, diffConfig } from "./diff-config";
import { diffDecorationPlugin } from "./diffDecorationState";
import { extendedTableSchema } from "./extended-table-schema";
import {
  diffTooltipPlugins,
  tooltipViewConfig,
} from "./diff-tooltip";
import { diff, getDiffState, jumpTo, merge } from "./markdown-diff";

const extendedTablePlugins =
  extendedTableSchema as unknown as MilkdownPlugin[];

const diffAutoApplyPlugin: MilkdownPlugin = (ctx) => async () => {
  await ctx.wait(ConfigReady);
  await ctx.wait(EditorViewReady);

  const { originContent, modifiedContent } = ctx.get(diffConfigCtx.key);
  if (originContent !== undefined && modifiedContent !== undefined) {
    diff(ctx, modifiedContent, originContent);
  }
};

const diffTooltipConfigPlugin: MilkdownPlugin = (ctx) => {
  tooltipViewConfig(ctx);
  return async () => {};
};

export const diffPlugins: MilkdownPlugin[] = [
  diffConfigCtx,
  ...extendedTablePlugins,
  diffDecorationPlugin,
  ...diffTooltipPlugins,
  diffTooltipConfigPlugin,
  diffAutoApplyPlugin,
];

export const diffPlugIns = diffPlugins;

export type { DiffConfig };
export { diffConfig, diff, getDiffState, jumpTo, merge };
