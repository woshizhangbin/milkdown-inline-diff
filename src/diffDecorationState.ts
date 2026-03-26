import { Plugin, PluginKey } from "@milkdown/prose/state";
import { DecorationSet } from "@milkdown/prose/view";
import { $ctx, $prose } from "@milkdown/kit/utils";

export interface DiffDecorationState {
  decorations: DecorationSet | null;
}

export const diffDecorationState = $ctx<
  DiffDecorationState,
  "diffDecorationState"
>(
  {
    decorations: null,
  },
  "diffDecorationState",
);

export const diffDecorationPlugin = $prose((ctx) => {
  const pluginKey = new PluginKey("MILKDOWN_DIFF_DECORATION");
  ctx.inject(diffDecorationState.key);
  return new Plugin({
    key: pluginKey,
    state: {
      init() {
        return DecorationSet.empty;
      },
      apply(tr, oldDeco) {
        const ctxDeco = ctx.get(diffDecorationState.key).decorations;

        if (ctxDeco && ctxDeco !== oldDeco) {
          ctx.set(diffDecorationState.key, { decorations: ctxDeco });
          return ctxDeco;
        }

        let rs = oldDeco.map(tr.mapping, tr.doc);

        ctx.set(diffDecorationState.key, { decorations: rs });
        return rs;
      },
    },
    props: {
      decorations(state) {
        return this.getState(state);
      },
    },
  });
});
