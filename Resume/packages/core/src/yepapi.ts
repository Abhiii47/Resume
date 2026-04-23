import { z } from "zod";

export const YepJobSchema = z.object({
  jobTitle: z.string(),
  companyName: z.string(),
  location: z.string(),
  source: z.string().optional(),
  link: z.string(),
});

export type YepJob = z.infer<typeof YepJobSchema>;

/**
 * High-quality mock jobs for development/fallback
 */
function getMockJobs(query: string): YepJob[] {
  const isFrontend = query.toLowerCase().includes("frontend");
  const isBackend = query.toLowerCase().includes("backend");

  const baseJobs = [
    {
      jobTitle: isFrontend
        ? "Senior Frontend Engineer"
        : isBackend
          ? "Senior Backend Engineer"
          : "Senior Software Engineer",
      companyName: "Stripe",
      location: "Remote",
      source: "Google Jobs",
      link: "https://stripe.com/jobs",
    },
    {
      jobTitle: "Staff Software Engineer, Platform",
      companyName: "Linear",
      location: "San Francisco, CA",
      source: "Google Jobs",
      link: "https://linear.app/jobs",
    },
    {
      jobTitle: "Founding Engineer (Architecture)",
      companyName: "Antigravity Labs",
      location: "London, UK",
      source: "LinkedIn",
      link: "#",
    },
    {
      jobTitle: "Product Engineer",
      companyName: "Vercel",
      location: "Remote",
      source: "Vercel Jobs",
      link: "https://vercel.com/jobs",
    },
  ];

  return baseJobs;
}

/**
 * Fetch jobs using YepAPI Google SERP endpoint
 */
export async function fetchJobs(query: string): Promise<YepJob[]> {
  const apiKey = process.env.YEPAPI_KEY;

  if (!apiKey || apiKey === "your-yepapi-key") {
    console.warn(
      "YEPAPI_KEY is not defined. Using high-quality mock fallback.",
    );
    return getMockJobs(query);
  }

  try {
    const response = await fetch("https://api.yepapi.com/v1/serp/google", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: query,
        num: 20,
      }),
    });

    if (!response.ok) {
      console.warn(`YepAPI error: ${response.statusText}. Using fallback.`);
      return getMockJobs(query);
    }

    const data = await response.json();
    const results = data.results || [];

    // Filter for rich results of type 'jobs'
    const jobs: YepJob[] = results
      .filter((r: any) => r.type === "jobs")
      .flatMap((r: any) => {
        const nestedJobs = r.data?.results || [];
        return nestedJobs.map((j: any) => ({
          jobTitle: j.data?.jobTitle || "Unknown Position",
          companyName: j.data?.companyName || "Unknown Company",
          location: j.data?.location || "Remote",
          source: j.data?.source,
          link: j.data?.link || r.url,
        }));
      });

    return jobs.length > 0 ? jobs : getMockJobs(query);
  } catch (error) {
    console.error("Failed to fetch jobs from YepAPI:", error);
    return getMockJobs(query);
  }
}
