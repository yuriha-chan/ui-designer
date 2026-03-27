import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock external dependencies
vi.mock("uuid");
vi.mock("@uidotdev/usehooks");
vi.mock("react-dnd");
vi.mock("react-dnd-html5-backend");
