// Mock for uuid
let counter = 0;

export const v4 = () => {
  counter += 1;
  return `mock-uuid-${counter}`;
};
