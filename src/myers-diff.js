export function myersDiff(a, b, equal) {
    const N = a.length;
    const M = b.length;
    if (N === 0 && M === 0)
        return [];
    if (N === 0)
        return [{ type: "insert", items: [...b] }];
    if (M === 0)
        return [{ type: "delete", items: [...a] }];
    const MAX = N + M;
    const offset = MAX;
    const v = new Array(2 * MAX + 1).fill(0);
    v[1 + offset] = 0;
    const trace = [];
    for (let d = 0; d <= MAX; d++) {
        trace.push([...v]);
        for (let k = -d; k <= d; k += 2) {
            const kIndex = k + offset;
            let x;
            if (k === -d || (k !== d && v[k - 1 + offset] < v[k + 1 + offset])) {
                x = v[k + 1 + offset];
            }
            else {
                x = v[k - 1 + offset] + 1;
            }
            let y = x - k;
            while (x < N && y < M) {
                const itemA = a[x];
                const itemB = b[y];
                if (!itemA || !itemB || !equal(itemA, itemB))
                    break;
                x++;
                y++;
            }
            v[kIndex] = x;
            if (x >= N && y >= M) {
                return buildDiff(trace, a, b, N, M, offset);
            }
        }
    }
    return [];
}
function buildDiff(trace, a, b, startX, startY, offset) {
    let x = startX;
    let y = startY;
    const result = [];
    for (let d = trace.length - 1; d >= 0; d--) {
        const v = trace[d];
        const k = x - y;
        let prevK;
        if (k === -d || (k !== d && v[k - 1 + offset] < v[k + 1 + offset])) {
            prevK = k + 1;
        }
        else {
            prevK = k - 1;
        }
        const prevX = v[prevK + offset];
        const prevY = prevX - prevK;
        while (x > prevX && y > prevY) {
            const item = a[x - 1];
            if (item)
                push(result, "equal", item);
            x--;
            y--;
        }
        if (d === 0)
            break;
        if (x === prevX) {
            const item = b[y - 1];
            if (item)
                push(result, "insert", item);
            y--;
        }
        else {
            const item = a[x - 1];
            if (item)
                push(result, "delete", item);
            x--;
        }
    }
    return mergeOps(result.reverse());
}
function push(ops, type, item) {
    ops.push({ type, items: [item] });
}
function mergeOps(ops) {
    const result = [];
    for (const op of ops) {
        const prev = result[result.length - 1];
        if (prev && prev.type === op.type) {
            prev.items.push(...op.items);
        }
        else {
            result.push({ ...op });
        }
    }
    return result;
}
