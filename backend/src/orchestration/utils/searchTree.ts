/*
  Simple 2D KD-tree for nearest neighbor queries.
  - Build is O(n log n)
  - Nearest query typical O(log n) avg
  This KD tree is read-only; we use it for fast nearest candidate lookup.
  For deletions we check membership against a Set of remaining ids.
*/

import { Order } from "../../types/order.types";

export type Maybe<T> = T | undefined | null;
export type Point = { x: number; y: number; id: number };

export class KDNode {
  point: Point;
  left?: KDNode;
  right?: KDNode;
  axis: 0 | 1;
  constructor(point: Point, axis: 0 | 1, left?: KDNode, right?: KDNode) {
    this.point = point;
    this.axis = axis;
    this.left = left;
    this.right = right;
  }
}

export class KDTree {
  root?: KDNode;
  constructor(points: Point[] = []) {
    if (points.length) this.root = this.build(points, 0);
  }

  private build(points: Point[], depth: number): KDNode | undefined {
    if (!points.length) return undefined;
    const axis = (depth % 2) as 0 | 1;
    points.sort((a, b) => (axis === 0 ? a.x - b.x : a.y - b.y));
    const mid = Math.floor(points.length / 2);
    return new KDNode(
      points[mid],
      axis,
      this.build(points.slice(0, mid), depth + 1),
      this.build(points.slice(mid + 1), depth + 1)
    );
  }

  nearestK(x: number, y: number, k = 5): Point[] {
    if (!this.root) return [];
    const best: { dist: number; p: Point }[] = [];

    function squaredDist(a: Point, bx: number, by: number) {
      const dx = a.x - bx;
      const dy = a.y - by;
      return dx * dx + dy * dy;
    }

    function visit(node?: KDNode) {
      if (!node) return;
      const pd = squaredDist(node.point, x, y);
      if (best.length < k) {
        best.push({ dist: pd, p: node.point });
        best.sort((a, b) => a.dist - b.dist);
      } else if (pd < best[best.length - 1].dist) {
        best[best.length - 1] = { dist: pd, p: node.point };
        best.sort((a, b) => a.dist - b.dist);
      }

      const axis = node.axis;
      const diff = axis === 0 ? x - node.point.x : y - node.point.y;

      const first = diff <= 0 ? node.left : node.right;
      const second = diff <= 0 ? node.right : node.left;

      visit(first);
      if (best.length < k || diff * diff < best[best.length - 1].dist) {
        visit(second);
      }
    }

    visit(this.root);
    return best.map((b) => b.p);
  }
}

// Pop nearest order (by Euclidean lat/lng) from remainingOrders using KDTree candidate search & membership set.
//  - remainingSet: Set of order_id that are still available
//  - ordersById: Map from id -> OrderWithCoords

export function popNearestOrderFromSet(
  lastLat: number,
  lastLng: number,
  kdTree: KDTree,
  remainingSet: Set<number>,
  ordersById: Map<number, Order & { distance?: number; angle?: number }>
): Maybe<Order> {
  // kd-tree lookup to some K nearest candidates,
  //  then pick first that exists in remainingSet
  const candidates = kdTree.nearestK(lastLng, lastLat, 8); // kd uses x=lng, y=lat
  for (const c of candidates) {
    if (remainingSet.has(c.id)) {
      // consume it
      remainingSet.delete(c.id);
      return ordersById.get(c.id)!;
    }
  }

  // Fallback: full scan (rare because kd-tree should find something)
  for (const id of Array.from(remainingSet)) {
    remainingSet.delete(id);
    return ordersById.get(id)!;
  }
  return undefined;
}
