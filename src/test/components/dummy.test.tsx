import { describe, it, expect } from "vitest";
import { render } from "./test-utils";

describe("Component test infrastructure", () => {
  it("should render a simple div", () => {
    const { container } = render(<div>Test</div>);
    expect(container.textContent).toBe("Test");
  });
});
