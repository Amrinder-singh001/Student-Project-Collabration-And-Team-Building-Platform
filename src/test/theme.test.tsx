import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ThemeProvider, useTheme } from "@/hooks/useTheme";

function Control() {
  const { theme, toggleTheme } = useTheme();
  return <button onClick={toggleTheme} data-testid="toggle" data-theme={theme} />;
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.classList.remove("dark");
});

describe("Page theme", () => {
  it("switches the shared document between light and dark and persists the selection", async () => {
    render(<ThemeProvider><Control /></ThemeProvider>);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    fireEvent.click(screen.getByTestId("toggle"));
    await waitFor(() => expect(document.documentElement.classList.contains("dark")).toBe(true));
    expect(localStorage.getItem("projectconnect-theme")).toBe("dark");
    fireEvent.click(screen.getByTestId("toggle"));
    await waitFor(() => expect(document.documentElement.classList.contains("dark")).toBe(false));
    expect(localStorage.getItem("projectconnect-theme")).toBe("light");
  });

  it("restores the selected dark mode after the provider is mounted again", async () => {
    localStorage.setItem("projectconnect-theme", "dark");
    render(<ThemeProvider><Control /></ThemeProvider>);
    await waitFor(() => expect(screen.getByTestId("toggle").dataset.theme).toBe("dark"));
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});