// SVG path generators for lineage tree connectors

// ── Smooth elbow — from bottom-center of parent to top-center of child ───────
// Uses a cubic bezier for a gentle S-curve
export function elbowPath(
    px: number, py: number, // parent bottom-center
    cx: number, cy: number  // child top-center
): string {
    const midY = (py + cy) / 2;
    return `M ${px} ${py} C ${px} ${midY}, ${cx} ${midY}, ${cx} ${cy}`;
}

// ── Horizontal crossbar with drops ───────────────────────────────────────────
// For one parent connected to multiple children:
// Draws a vertical stem from parent down to a horizontal bar,
// then vertical drops from the bar to each child top-center
export function crossbarPaths(
    parentX: number, parentY: number,       // parent bottom-center
    childXs: number[], childTopY: number    // all children top-center Y (same for all)
): string[] {
    if (childXs.length === 0) return [];
    if (childXs.length === 1) {
        return [elbowPath(parentX, parentY, childXs[0], childTopY)];
    }

    const barY = parentY + (childTopY - parentY) * 0.5;
    const minX = Math.min(...childXs);
    const maxX = Math.max(...childXs);

    const paths: string[] = [];

    // Vertical stem from parent down to bar
    paths.push(`M ${parentX} ${parentY} L ${parentX} ${barY}`);

    // Horizontal crossbar
    paths.push(`M ${minX} ${barY} L ${maxX} ${barY}`);

    // Vertical drops from bar to each child
    for (const cx of childXs) {
        paths.push(`M ${cx} ${barY} L ${cx} ${childTopY}`);
    }

    return paths;
}

// ── Marriage line — horizontal between two nodes ──────────────────────────────
// Draws from right-center of left card to left-center of right card
export function marriagePath(
    leftX: number, leftY: number,
    rightX: number, rightY: number
): string {
    const midX = (leftX + rightX) / 2;
    const y = (leftY + rightY) / 2;
    return `M ${leftX} ${y} L ${rightX} ${y}`;
}

// midpoint for placing the ♥ icon
export function marriageMidpoint(
    leftX: number, leftY: number,
    rightX: number, rightY: number
): { x: number; y: number } {
    return { x: (leftX + rightX) / 2, y: (leftY + rightY) / 2 };
}
