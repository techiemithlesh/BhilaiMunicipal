export function applyOwnerDefaults(owners) {
  return owners.map((owner) => ({
    ...owner,
    isArmedForce: owner.isArmedForce ?? "0",
    isSpeciallyAbled: owner.isSpeciallyAbled ?? "0",
  }));
}
