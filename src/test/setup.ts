import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock browser APIs not available in jsdom
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserverMock;

const originalScrollTo = Element.prototype.scrollTo;
Element.prototype.scrollTo = function () {};

// Mock external dependencies
vi.mock("uuid");
vi.mock("@uidotdev/usehooks");
vi.mock("react-dnd");
vi.mock("react-dnd-html5-backend");
