import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import { __resetEngine } from "@/services/mockSocket";

afterEach(() => {
  cleanup();
  __resetEngine();
});
