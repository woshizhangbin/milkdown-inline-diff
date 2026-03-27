import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const MergeBar = ({ conflictCount, currentIndex, onJump, onAcceptAll, onRemoveAll, }) => {
    if (conflictCount <= 0) {
        return null;
    }
    const displayIndex = currentIndex === -1 ? 1 : currentIndex + 1;
    return (_jsxs("div", { className: "merge-bar", children: [_jsxs("div", { className: "merge-bar__status", children: [_jsx("button", { type: "button", className: "merge-bar__nav", onClick: () => onJump(currentIndex <= 0 ? 0 : currentIndex - 1), disabled: currentIndex <= 0, children: "Prev" }), _jsxs("span", { className: "merge-bar__counter", children: [displayIndex, " / ", conflictCount] }), _jsx("button", { type: "button", className: "merge-bar__nav", onClick: () => onJump(currentIndex === -1
                            ? 0
                            : Math.min(currentIndex + 1, conflictCount - 1)), disabled: currentIndex >= conflictCount - 1, children: "Next" })] }), _jsxs("div", { className: "merge-bar__actions", children: [_jsx("button", { type: "button", className: "merge-bar__button merge-bar__button--secondary", onClick: onRemoveAll, children: "Remove All" }), _jsx("button", { type: "button", className: "merge-bar__button merge-bar__button--primary", onClick: onAcceptAll, children: "Accept All" })] })] }));
};
