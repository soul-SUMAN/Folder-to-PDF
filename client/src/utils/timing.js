export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const nextPaint = () =>
  new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
