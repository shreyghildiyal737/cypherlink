import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock socket.io-client before importing the module under test.
const mockSocket = {
  auth: {} as Record<string, unknown>,
  connected: true,
  connect: vi.fn(),
  disconnect: vi.fn(),
};

vi.mock("socket.io-client", () => ({
  io: vi.fn(() => mockSocket),
}));

// Lazy import so the mock is in place first.
const { getSocket, disconnectSocket, updateSocketToken } = await import(
  "../services/socket"
);

beforeEach(() => {
  mockSocket.connected = true;
  mockSocket.connect.mockClear();
  mockSocket.disconnect.mockClear();
  // Ensure socket singleton exists.
  getSocket();
});

describe("updateSocketToken", () => {
  it("updates socket.auth with the new token", () => {
    updateSocketToken("tok-abc");
    expect(mockSocket.auth).toEqual({ token: "tok-abc" });
  });

  it("does NOT reconnect when socket is already connected", () => {
    mockSocket.connected = true;
    updateSocketToken("tok-connected");
    expect(mockSocket.disconnect).not.toHaveBeenCalled();
    expect(mockSocket.connect).not.toHaveBeenCalled();
  });

  it("cycles connection when socket is offline (disconnected while token was expiring)", () => {
    mockSocket.connected = false;
    updateSocketToken("tok-offline");
    expect(mockSocket.disconnect).toHaveBeenCalledTimes(1);
    expect(mockSocket.connect).toHaveBeenCalledTimes(1);
  });
});

describe("disconnectSocket", () => {
  it("calls socket.disconnect and clears the singleton", () => {
    disconnectSocket();
    expect(mockSocket.disconnect).toHaveBeenCalled();
    // After disconnect the singleton is null; getSocket() creates a new one.
    const fresh = getSocket();
    expect(fresh).toBeDefined();
  });
});
