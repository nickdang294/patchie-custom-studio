export function snapRotation(value) {
  const angle = Math.round(Number(value) || 0);
  const target = Math.round(angle / 15) * 15;
  return Math.abs(angle - target) <= 3 ? target : angle;
}
