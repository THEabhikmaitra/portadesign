import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireRole, logAdminAction } from "@/lib/authGuard";
import { isLocalSeoEngineAllowed } from "@/lib/seoEngine/llmRouter";
import { pushApprovedPostToLive } from "@/lib/seoEngine/livePublisher";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(["ADMIN"]);
    if (auth.error) return auth.error;

    if (!isLocalSeoEngineAllowed()) {
      return NextResponse.json(
        { error: "Push-to-Live runner operates on local Studio instance only." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { postId, webhookUrl, gitPush, pingIndexers, commitMessage } = body;
    if (!postId) {
      return NextResponse.json({ error: "postId required" }, { status: 400 });
    }

    const res = await pushApprovedPostToLive({
      postId: String(postId),
      webhookUrl: webhookUrl ? String(webhookUrl) : undefined,
      gitPush: Boolean(gitPush),
      pingIndexers: Boolean(pingIndexers),
      commitMessage: commitMessage ? String(commitMessage) : undefined,
    });

    revalidatePath("/guides");
    revalidatePath(`/guides/${res.slug}`);
    revalidatePath("/sitemap.xml");

    await logAdminAction(auth.actor.id, "SEO_PUSH_LIVE", "SeoPost", String(postId), res);
    return NextResponse.json(res);
  } catch (error: any) {
    console.error("POST /api/admin/seo/push-live error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
