import type { Ctx, MilkdownPlugin } from "@milkdown/ctx";
import { tooltipFactory, TooltipProvider } from "@milkdown/kit/plugin/tooltip";
import { $ctx } from "@milkdown/kit/utils";
import type { EditorState, PluginView } from "@milkdown/prose/state";
import type { EditorView } from "@milkdown/prose/view";
import { Decoration } from "@milkdown/prose/view";

import { debounce } from "lodash";

import { defaultDiffConfig, diffConfigCtx } from "./diff-config";
import { getDiffDecorations, merge } from "./markdown-diff";

export const onMergeCtx = $ctx<
  ((action: "accept" | "reject", index: number) => void) | undefined,
  "onMergeCtx"
>(undefined, "onMergeCtx");

export const diffToolTooltip = tooltipFactory("MERGE_TOOL");

export class DiffTooltipView implements PluginView {
  private tooltipProvider: TooltipProvider;
  private showRect?: DOMRect;
  private shouldShow = false;
  private currentGroupIndex?: number;
  private currentPos?: number;
  private currentDisplayPos?: number;
  private scrollTarget: EventTarget | null = null;

  tooltipElement: HTMLDivElement;
  acceptButton: HTMLButtonElement;
  rejectButton: HTMLButtonElement;

  constructor(private ctx: Ctx, private editView: EditorView) {
    this.tooltipElement = document.createElement("div");
    this.tooltipElement.className = "milkdown-merge-tool-tooltip";

    const buttonContainer = document.createElement("div");
    buttonContainer.className = "milkdown-merge-tool-button-container";

    const config = ctx.get(diffConfigCtx.key);
    const acceptButtonTitle =
      config.acceptButtonTitle ?? defaultDiffConfig.acceptButtonTitle ?? "Accept";
    const rejectButtonTitle =
      config.rejectButtonTitle ?? defaultDiffConfig.rejectButtonTitle ?? "Reject";

    this.acceptButton = document.createElement("button");
    this.acceptButton.textContent = acceptButtonTitle;
    this.acceptButton.className = "milkdown-merge-tool-button accept";
    this.acceptButton.addEventListener("click", () => this.handleAccept());

    this.rejectButton = document.createElement("button");
    this.rejectButton.textContent = rejectButtonTitle;
    this.rejectButton.className = "milkdown-merge-tool-button reject";
    this.rejectButton.addEventListener("click", () => this.handleReject());

    buttonContainer.appendChild(this.rejectButton);
    buttonContainer.appendChild(this.acceptButton);
    this.tooltipElement.appendChild(buttonContainer);

    this.tooltipProvider = new TooltipProvider({
      content: this.tooltipElement,
      offset: -2,
      shouldShow: (_view: EditorView) => false,
      floatingUIOptions: {
        placement: "top-end",
      },
    });

    const container = editView.dom.parentElement ?? document.body;
    container.appendChild(this.tooltipElement);

    const scrollContext = findScrollContainer(editView.dom);
    this.scrollTarget = scrollContext.target;

    if (this.scrollTarget) {
      this.scrollTarget.addEventListener("scroll", this.handleScroll);
    }
  }

  handleScroll = () => {
    if (this.shouldShow && this.currentDisplayPos !== undefined) {
      updateTooltipForPos(
        this,
        this.ctx,
        this.editView,
        this.currentDisplayPos,
      );
    }
  };

  handleAccept(): void {
    const callback = this.ctx.get(onMergeCtx.key);
    callback?.("accept", this.currentGroupIndex!);
    this.hideImmediate();
  }

  handleReject(): void {
    const callback = this.ctx.get(onMergeCtx.key);
    callback?.("reject", this.currentGroupIndex!);
    this.hideImmediate();
  }

  toggleShow() {
    if (this.shouldShow && this.showRect) {
      this.tooltipProvider.show(
        { getBoundingClientRect: () => this.showRect! },
        this.editView,
      );
    } else {
      this.tooltipProvider.hide();
      this.currentGroupIndex = undefined;
    }
  }

  show(groupIndex: number, rect: DOMRect, pos?: number) {
    this.currentGroupIndex = groupIndex;
    this.showRect = rect;
    this.shouldShow = true;
    if (pos !== undefined) {
      this.currentDisplayPos = pos;
    }
    this.toggleShow();
  }

  hide = () => {
    this.shouldShow = false;
    this.toggleShow();
  };

  hideImmediate = () => {
    this.shouldShow = false;
    this.tooltipProvider.hide();
    this.currentGroupIndex = undefined;
  };

  isVisible(): boolean {
    return this.shouldShow;
  }

  update(view: EditorView, _prevState?: EditorState) {
    const editState = view.state;
    const selection = editState.selection;

    const currentPos = selection.from;
    if (this.currentPos !== currentPos) {
      this.currentPos = currentPos;
      updateTooltipForPos(this, this.ctx, view, currentPos);
    }
  }

  destroy = () => {
    if (this.scrollTarget) {
      this.scrollTarget.removeEventListener("scroll", this.handleScroll);
    }
    this.tooltipProvider.destroy();
    this.tooltipElement.remove();
  };
}

const mergeToolPlugin: MilkdownPlugin = (ctx) => {
  ctx.inject(onMergeCtx.key);

  return async () => {
    return () => {
      ctx.remove(onMergeCtx.key);
    };
  };
};

export const diffTooltipPlugins: MilkdownPlugin[] = [
  mergeToolPlugin,
  ...diffToolTooltip,
];

export const tooltipViewConfig = (ctx: Ctx) => {
  let tooltipView: DiffTooltipView | null = null;

  const onMouseMove = debounce((view: EditorView, event: MouseEvent) => {
    if (!tooltipView) return;

    const pos = mouseToPos(view, event);
    if (pos === undefined) {
      tooltipView.hide();
      return;
    }

    updateTooltipForPos(tooltipView, ctx, view, pos);
  }, 0);

  ctx.set(onMergeCtx.key, (action, index) => {
    merge(ctx, action, index, false);
  });

  ctx.set(diffToolTooltip.key, {
    props: {
      handleDOMEvents: {
        mousemove: onMouseMove,
      },
    },
    view: (view) => {
      tooltipView = new DiffTooltipView(ctx, view);
      return tooltipView;
    },
  });
};

function mouseToPos(view: EditorView, event: MouseEvent): number | undefined {
  const $pos = view.posAtCoords({ left: event.clientX, top: event.clientY });
  return $pos?.pos;
}

function isScrollableElement(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element);
  const overflowY = style.overflowY;
  const overflowX = style.overflowX;
  const overflow = style.overflow;
  const canScrollY =
    /(auto|scroll|overlay)/.test(overflowY) ||
    /(auto|scroll|overlay)/.test(overflow);
  const canScrollX =
    /(auto|scroll|overlay)/.test(overflowX) ||
    /(auto|scroll|overlay)/.test(overflow);

  return (
    (canScrollY && element.scrollHeight > element.clientHeight) ||
    (canScrollX && element.scrollWidth > element.clientWidth)
  );
}

function findScrollContainer(start: HTMLElement): {
  element: HTMLElement | null;
  target: EventTarget | null;
} {
  let current: HTMLElement | null = start.parentElement;

  while (current) {
    if (isScrollableElement(current)) {
      return {
        element: current,
        target: current,
      };
    }
    current = current.parentElement;
  }

  const scrollingElement =
    document.scrollingElement instanceof HTMLElement
      ? document.scrollingElement
      : document.documentElement;

  return {
    element: scrollingElement,
    target: window,
  };
}

export function shouldShowMergeToolForPos(
  ctx: Ctx,
  pos: number,
): { index: number; decoration: Decoration } | undefined {
  const diffDecorations = getDiffDecorations(ctx);

  const index = diffDecorations.findIndex((dec) => {
    const all = [...dec.delete, ...dec.insert];
    const start = all[0].from;
    const end = all[all.length - 1].to;
    return start <= pos && pos <= end;
  });

  if (index >= 0) {
    const group = diffDecorations[index];
    const decoration = group.delete[0] || group.insert[0];
    return { index, decoration };
  }

  return undefined;
}

function updateTooltipForPos(
  tooltipView: DiffTooltipView,
  ctx: Ctx,
  view: EditorView,
  pos: number,
): void {
  const diffDecorations = getDiffDecorations(ctx);
  if (diffDecorations.length === 0) {
    tooltipView.hideImmediate();
    return;
  }

  const result = shouldShowMergeToolForPos(ctx, pos);

  if (result) {
    const { index, decoration } = result;
    const domPos = (decoration.spec as any)?.offset
      ? decoration.from
      : decoration.from + 1;
    const dom = view.domAtPos(domPos).node as HTMLElement;
    const domRect = dom.getBoundingClientRect();
    tooltipView.show(index, domRect, pos);
  }
}
