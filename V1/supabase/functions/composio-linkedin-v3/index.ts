import { createClient } from "npm:@supabase/supabase-js@2";
import { Composio } from "npm:@composio/core@latest";

const COMPOSIO_AUTH_CONFIG_ID = "ac_x1x0fNkabTgI";
const LINKEDIN_PROFILE_TOOL_CANDIDATES = [
  "LINKEDIN_GET_PROFILE",
  "LINKEDIN_GET_MY_INFO",
  "LINKEDIN_GET_PERSON",
] as const;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseAnonKey =
  Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_ANON_PUBLIC");
const composioApiKey = Deno.env.get("COMPOSIO_API_KEY");

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables.",
  );
}

if (!composioApiKey) {
  throw new Error("Missing COMPOSIO_API_KEY environment variable.");
}

const composio = new Composio({
  apiKey: composioApiKey,
  toolkitVersions: {
    linkedin: "latest",
  },
});

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function parseDatePart(value: unknown): string | null {
  if (!value) return null;

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object") {
    const raw = value as Record<string, unknown>;
    const year = raw.year;
    const month = raw.month;

    if (typeof year === "number") {
      const monthPart = typeof month === "number"
        ? String(month).padStart(2, "0")
        : "01";
      return `${year}-${monthPart}`;
    }

    const candidate = raw.date ?? raw.start_date ?? raw.end_date;
    if (typeof candidate === "string") {
      return candidate;
    }
  }

  return null;
}

function normalizeSkills(input: unknown): string[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((skill) => {
      if (typeof skill === "string") return skill.trim();
      if (skill && typeof skill === "object") {
        const record = skill as Record<string, unknown>;
        const candidate = record.name ?? record.title ?? record.skill;
        return typeof candidate === "string" ? candidate.trim() : "";
      }
      return "";
    })
    .filter(Boolean);
}

function normalizePositions(input: unknown): Array<Record<string, string | null>> {
  if (!Array.isArray(input)) return [];

  return input.map((item) => {
    const record = item && typeof item === "object"
      ? item as Record<string, unknown>
      : {};

    return {
      company: typeof (record.company ?? record.companyName) === "string"
        ? String(record.company ?? record.companyName)
        : null,
      title: typeof (record.title ?? record.position ?? record.role) === "string"
        ? String(record.title ?? record.position ?? record.role)
        : null,
      start_date: parseDatePart(
        record.start_date ?? record.startDate ?? record.startedAt,
      ),
      end_date: parseDatePart(
        record.end_date ?? record.endDate ?? record.endedAt,
      ),
    };
  }).filter((position) => position.company || position.title);
}

function extractProfilePayload(rawResult: unknown): Record<string, unknown> {
  if (!rawResult || typeof rawResult !== "object") return {};

  const outer = rawResult as Record<string, unknown>;
  const outerData = outer.data;

  if (outerData && typeof outerData === "object") {
    const dataRecord = outerData as Record<string, unknown>;

    if (dataRecord.responseData && typeof dataRecord.responseData === "object") {
      return dataRecord.responseData as Record<string, unknown>;
    }

    if (dataRecord.data && typeof dataRecord.data === "object") {
      const nestedData = dataRecord.data as Record<string, unknown>;
      if (
        nestedData.responseData && typeof nestedData.responseData === "object"
      ) {
        return nestedData.responseData as Record<string, unknown>;
      }
      return nestedData;
    }

    return dataRecord;
  }

  return outer;
}

function buildMappedProfile(rawProfile: Record<string, unknown>) {
  const firstName = typeof rawProfile.firstName === "string"
    ? rawProfile.firstName
    : null;
  const lastName = typeof rawProfile.lastName === "string"
    ? rawProfile.lastName
    : null;

  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim() ||
    (typeof rawProfile.name === "string" ? rawProfile.name : null);

  const headline = typeof (rawProfile.headline ?? rawProfile.occupation) ===
      "string"
    ? String(rawProfile.headline ?? rawProfile.occupation)
    : null;

  const summary = typeof (rawProfile.summary ?? rawProfile.about) === "string"
    ? String(rawProfile.summary ?? rawProfile.about)
    : null;

  const positions = normalizePositions(
    rawProfile.positions ?? rawProfile.experience,
  );
  const skills = normalizeSkills(rawProfile.skills);

  return {
    full_name: fullName,
    first_name: firstName,
    last_name: lastName,
    headline,
    summary,
    positions,
    skills,
    raw: rawProfile,
  };
}

async function getAuthenticatedUser(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return { error: jsonResponse(401, { error: "Missing Authorization header" }) };
  }

  const supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      error: jsonResponse(401, {
        error: error?.message ?? "Invalid or expired access token",
      }),
    };
  }

  return { user };
}

async function getActiveLinkedInConnection(userId: string) {
  const connections = await composio.connectedAccounts.list({
    userIds: [userId],
    authConfigIds: [COMPOSIO_AUTH_CONFIG_ID],
    statuses: ["ACTIVE"],
  });

  return connections.items?.[0] ?? null;
}

async function handleGetLink(userId: string, requestUrl: URL) {
  const callbackUrl = requestUrl.searchParams.get("redirectUri");

  if (!callbackUrl) {
    return jsonResponse(400, {
      error: "Missing required query parameter `redirectUri`.",
    });
  }

  const activeConnection = await getActiveLinkedInConnection(userId);

  if (activeConnection) {
    return jsonResponse(200, {
      success: true,
      alreadyConnected: true,
      connectedAccountId: activeConnection.id,
      redirectUrl: callbackUrl,
    });
  }

  const connectionRequest = await composio.connectedAccounts.initiate(
    userId,
    COMPOSIO_AUTH_CONFIG_ID,
    {
      callbackUrl,
    },
  );

  return jsonResponse(200, {
    success: true,
    connectionRequestId: connectionRequest.id,
    redirectUrl: connectionRequest.redirectUrl,
  });
}

async function handleVerifyConnection(userId: string) {
  const activeConnection = await getActiveLinkedInConnection(userId);

  if (!activeConnection) {
    return jsonResponse(404, {
      success: false,
      error: "No active LinkedIn connection found yet",
    });
  }

  return jsonResponse(200, {
    success: true,
    connectedAccountId: activeConnection.id,
    status: activeConnection.status,
  });
}

async function executeLinkedInProfileTool(
  userId: string,
  connectedAccountId: string,
) {
  let lastError: unknown = null;

  for (const toolSlug of LINKEDIN_PROFILE_TOOL_CANDIDATES) {
    try {
      const result = await composio.tools.execute(toolSlug, {
        userId,
        connectedAccountId,
        arguments: {},
        version: "latest",
      });

      return {
        toolSlug,
        result,
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error("Unable to execute a LinkedIn profile tool.");
}

async function handleFetchProfile(userId: string) {
  const activeConnection = await getActiveLinkedInConnection(userId);

  if (!activeConnection) {
    return jsonResponse(404, {
      success: false,
      error: "No active LinkedIn connection found for this user",
    });
  }

  const { toolSlug, result } = await executeLinkedInProfileTool(
    userId,
    activeConnection.id,
  );

  const rawProfile = extractProfilePayload(result);
  const mappedProfile = buildMappedProfile(rawProfile);

  return jsonResponse(200, {
    success: true,
    connectedAccountId: activeConnection.id,
    toolSlug,
    data: mappedProfile,
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const requestUrl = new URL(request.url);
    const action = requestUrl.searchParams.get("action");

    if (!action) {
      return jsonResponse(400, {
        error: "Missing required query parameter `action`.",
      });
    }

    const authResult = await getAuthenticatedUser(request);
    if ("error" in authResult) return authResult.error;

    const userId = authResult.user.id;

    switch (action) {
      case "get-link":
        return await handleGetLink(userId, requestUrl);
      case "verify-connection":
        return await handleVerifyConnection(userId);
      case "fetch-profile":
        return await handleFetchProfile(userId);
      default:
        return jsonResponse(400, {
          error:
            "Unsupported action. Expected one of: get-link, verify-connection, fetch-profile.",
        });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const details = error && typeof error === "object"
      ? error as Record<string, JsonValue>
      : null;

    return jsonResponse(500, {
      success: false,
      error: message,
      details,
    });
  }
});

