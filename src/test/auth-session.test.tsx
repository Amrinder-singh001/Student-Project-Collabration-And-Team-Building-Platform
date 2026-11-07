import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

const mocks = vi.hoisted(() => ({
  callback: null as null | ((event: string, session: unknown) => void),
  cancel: vi.fn(async () => {}), clear: vi.fn(), invalidate: vi.fn(),
  navigate: vi.fn(async () => {}), routerInvalidate: vi.fn(),
  signOut: vi.fn(async () => ({ error: null })),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ cancelQueries: mocks.cancel, clear: mocks.clear, invalidateQueries: mocks.invalidate }),
}));
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mocks.navigate,
  useRouter: () => ({ invalidate: mocks.routerInvalidate }),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: (callback: typeof mocks.callback) => {
        mocks.callback = callback;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      },
      getSession: async () => ({ data: { session: null } }),
      signOut: () => mocks.signOut(),
    },
    from: () => {
      const query = { select: () => query, eq: () => query,
        maybeSingle: async () => ({ data: null }),
        order: async () => ({ data: [] }),
        then: (resolve: (value: unknown) => void) => Promise.resolve({ data: [] }).then(resolve),
      };
      return query;
    },
  },
}));

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("Login and logout session", () => {
  it("reflects a signed-in session then clears it on logout with cache cleanup before redirect", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);
    act(() => mocks.callback?.("SIGNED_IN", { user: { id: "test-user" } }));
    expect(result.current.isAuthenticated).toBe(true);
    await act(() => result.current.signOut());
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(mocks.navigate).toHaveBeenCalledWith({ to: "/login", replace: true });
    expect(mocks.cancel.mock.invocationCallOrder[0]).toBeLessThan(mocks.clear.mock.invocationCallOrder[0]);
    expect(mocks.clear.mock.invocationCallOrder[0]).toBeLessThan(mocks.signOut.mock.invocationCallOrder[0]);
    expect(mocks.signOut.mock.invocationCallOrder[0]).toBeLessThan(mocks.navigate.mock.invocationCallOrder[0]);
  });
});