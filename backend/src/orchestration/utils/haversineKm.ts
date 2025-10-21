// Calculates the distance in kilometers between two lat/lng points
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// export function orderTrailFromLastLocation() {
//   cluster: Order[],
//   nearestSector: (Order & {
//     distance?: number;
//     angle?: number;
//   })[]
//   while (grossWeight(cluster) < MAX_WEIGHT && remainingNearest.size > 0) {
//     const last = cluster.at(-1)!;
//     let nearest: Order | null = null;
//     let nearestDist = Infinity;
//     for (const oId of remainingNearest) {
//       const next = nearestSector.find((o) => o.order_id === oId)!;
//       const d = haversineKm(
//         last.location.lat!,
//         last.location.lng!,
//         next.location.lat!,
//         next.location.lng!
//       );
//       if (d < nearestDist) {
//         nearestDist = d;
//         nearest = next;
//       }
//     }
//     if (!nearest) break;
//     nearest.weight_kg! >= MIN_WEIGHT
//       ? geoClusters.push([nearest])
//       : cluster.push(nearest);
//     // cluster.push(nearest);
//     remainingNearest.delete(nearest.order_id);
//     const clusterWeight = grossWeight(cluster);
//     if (clusterWeight >= MIN_WEIGHT) break;
//   }
// }

// export function mergeShortSectors(
//   shortSectors: (Order & { distance: number; angle: number })[][]
// ) {
//   const mergedSectors: (Order & { distance: number; angle: number })[][] = [];

//   while (shortSectors.length > 0) {
//     // Take one short sector
//     const base = shortSectors.shift()!;
//     let merged = [...base];

//     while (merged.length <= MIN_ORDERS) {
//       // Find the nearest other short sector
//       let nearestIdx = -1;
//       let nearestDist = Infinity;
//       const lastOrder = merged.at(-1)!; // outermost order

//       shortSectors.forEach((sec, idx) => {
//         const firstOrder = sec[0];
//         const d = haversineKm(
//           lastOrder.location.lat!,
//           lastOrder.location.lng!,
//           firstOrder.location.lat!,
//           firstOrder.location.lng!
//         );
//         if (d < nearestDist) {
//           nearestDist = d;
//           nearestIdx = idx;
//         }
//       });

//       if (nearestIdx === -1) break;

//       // Merge with nearest short sector if one exists
//       if (nearestIdx >= 0) {
//         const nearestSector = shortSectors.splice(nearestIdx, 1)[0];
//         merged.push(...nearestSector);
//       }
//     }

//     mergedSectors.push(merged);
//   }
//   return mergedSectors;
// }
