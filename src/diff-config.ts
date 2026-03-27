import type { Ctx } from "@milkdown/ctx";
import { $ctx } from "@milkdown/kit/utils";

export interface DiffConfig {
  acceptButtonTitle?: string;
  rejectButtonTitle?: string;
  originContent?: string;
  modifiedContent?: string;
}

export const defaultDiffConfig: DiffConfig = {
  acceptButtonTitle: "Accept",
  rejectButtonTitle: "Reject",
};

export const diffConfigCtx = $ctx<DiffConfig, "diffInlineConfig">(
  defaultDiffConfig,
  "diffInlineConfig",
);

export function diffConfig(config: DiffConfig = {}) {
  return (ctx: Ctx) => {
    ctx.update(diffConfigCtx.key, (prev) => ({
      ...prev,
      ...config,
    }));
  };
}
