import { type Ctx, type MilkdownPlugin } from "@milkdown/ctx";
import { tooltipFactory, TooltipProvider } from "@milkdown/kit/plugin/tooltip";
import type { EditorState, PluginView } from "@milkdown/prose/state";
import type { EditorView } from "@milkdown/prose/view";
import { Decoration } from "@milkdown/prose/view";

import { debounce } from "lodash";

import { getDiffDecorations, merge } from "./markdown-diff";

export const diffToolTooltip = tooltipFactory("DIFF_TOOLTIP");

export class DiffTooltipView implements PluginView {
  private tooltipProvider: TooltipProvider;
  private showRect?: DOMRect;
  private shouldShow = false;
  private currentGroupIndex?: number;
  private currentPos?: number;
  private currentDisplayPos?: number;
  private scrollContainer: Element | null = null;

  tooltipElement: HTMLDivElement;
  acceptButton: HTMLButtonElement;
  rejectButton: HTMLButtonElement;

  constructor(
    private ctx: Ctx,
    private editView: EditorView,
    private callback: (action: "accept" | "reject", index: number) => void,
  ) {
    this.tooltipElement = document.createElement("div");
    this.tooltipElement.className = "milkdown-merge-tool-tooltip";

    const buttonContainer = document.createElement("div");
    buttonContainer.className = "milkdown-merge-tool-button-container";

    this.acceptButton = document.createElement("button");
    this.acceptButton.textContent = "Accept";
    this.acceptButton.className = "milkdown-merge-tool-button accept";
    this.acceptButton.addEventListener("click", () => this.handleAccept());

    this.rejectButton = document.createElement("button");
    this.rejectButton.textContent = "Reject";
    this.rejectButton.className = "milkdown-merge-tool-button reject";
    this.rejectButton.addEventListener("click", () => this.handleReject());

    buttonContainer.appendChild(this.acceptButton);
    buttonContainer.appendChild(this.rejectButton);
    this.tooltipElement.appendChild(buttonContainer);

    const container = editView.dom.parentElement ?? document.body;
    container.appendChild(this.tooltipElement);

    this.tooltipProvider = new TooltipProvider({
      content: this.tooltipElement,
      offset: -2,
      shouldShow: (_view: EditorView) => false,
      floatingUIOptions: {
        placement: "top-end", // default placement: top center
      },
    });

    const milkdownContainer = container.closest(".markdown-scroll-container");
    this.scrollContainer = milkdownContainer || container;

    if (this.scrollContainer) {
      this.scrollContainer.addEventListener("scroll", this.handleScroll);
    }
  }

  handleScroll() {
    if (this.shouldShow && this.currentDisplayPos !== undefined) {
      updateTooltipForPos(
        this,
        this.ctx,
        this.editView,
        this.currentDisplayPos,
      );
    }
  }

  handleAccept(): void {
    this.callback("accept", this.currentGroupIndex!);
    this.hideImmediate();
  }

  handleReject(): void {
    this.callback("reject", this.currentGroupIndex!);
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
    if (this.scrollContainer) {
      this.scrollContainer.removeEventListener("scroll", this.handleScroll);
    }
    this.tooltipProvider.destroy();
    this.tooltipElement.remove();
  };
}

export const tooltipViewPlugin: MilkdownPlugin = (ctx) => {
  const onMerge = (action: "accept" | "reject", index: number) => {
    merge(ctx, action, index, false);
  };

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

  ctx.set(diffToolTooltip.key, {
    props: {
      handleDOMEvents: {
        mousemove: onMouseMove,
      },
    },
    view: (view) => {
      tooltipView = new DiffTooltipView(ctx, view, onMerge);
      return tooltipView;
    },
  });
  return async () => {};
};
function mouseToPos(view: EditorView, event: MouseEvent): number | undefined {
  const $pos = view.posAtCoords({ left: event.clientX, top: event.clientY });
  return $pos?.pos;
}

export function shouldShowMergeToolForPos(
  ctx: Ctx,
  pos: number,
): { index: number; decoration: Decoration } | undefined {
  const diffDecorations = getDiffDecorations(ctx);

  let index = diffDecorations.findIndex((dec) => {
    let all = [...dec.delete, ...dec.insert];
    let start = all[0].from;
    let end = all[all.length - 1].to;
    return start <= pos && pos <= end;
  });

  if (index >= 0) {
    let group = diffDecorations[index];
    let decoration = group.delete[0] || group.insert[0];
    return { index, decoration };
  } else {
    return undefined;
  }
}

function updateTooltipForPos(
  tooltipView: DiffTooltipView,
  ctx: Ctx,
  view: EditorView,
  pos: number,
): void {
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
