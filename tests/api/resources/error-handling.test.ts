
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PUT, DELETE } from "@/app/api/resources/[id]/route";
import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

// Mock auth
vi.mock("@/lib/auth", () => ({
  getAuthInfo: vi.fn(),
}));

import { getAuthInfo } from "@/lib/auth";

describe("Resource API Error Handling", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should handle foreign key constraint on audit log creation (deleted user) gracefully", async () => {
    // Create a temporary user to create the resource
    const user = await prisma.user.create({
        data: {
            name: "Temp User",
            email: `temp-${Date.now()}@example.com`,
            passwordHash: "hash",
            role: {
                connectOrCreate: {
                    where: { name: "admin" },
                    create: { name: "admin" }
                }
            }
        }
    });

    const resource = await prisma.resource.create({
        data: {
          type: "youtube",
          path: `https://youtube.com/watch?v=${Date.now()}`,
          categoryPath: "Test",
          originalName: "Test Video",
          createdById: user.id,
        },
    });

    // Mock auth to return a NON-EXISTENT user ID (simulating a deleted user or stale token)
    (getAuthInfo as any).mockResolvedValue({ userId: "non-existent-user-id", role: "admin" });

    const req = new NextRequest(`http://localhost/api/resources/${resource.id}`, {
      method: "DELETE",
    });

    // The API should now handle the audit failure gracefully and return 200 OK
    const res = await DELETE(req, { params: { id: resource.id } });
    
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);

    // Verify the resource is actually deleted despite audit failure
    const check = await prisma.resource.findUnique({ where: { id: resource.id } });
    expect(check).toBeNull();

    // Cleanup
    await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
  });
});
