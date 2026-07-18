declare module "d3-flextree" {
    export interface FlextreeNode<Datum> {
        data: Datum;
        x: number;
        y: number;
        depth: number;
        parent: FlextreeNode<Datum> | null;
        children?: FlextreeNode<Datum>[];
        each(callback: (node: FlextreeNode<Datum>) => void): void;
    }

    export interface FlextreeLayout<Datum> {
        (root: FlextreeNode<Datum>): FlextreeNode<Datum>;
        hierarchy(data: Datum): FlextreeNode<Datum>;
        nodeSize(fn: (node: FlextreeNode<Datum>) => [number, number]): FlextreeLayout<Datum>;
    }

    export function flextree<Datum>(options?: {
        nodeSize?: (node: { data: Datum }) => [number, number];
    }): FlextreeLayout<Datum>;
}
