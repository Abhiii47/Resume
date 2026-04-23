type FetchError = Error & {
  status?: number;
  info?: unknown;
};

export const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    const error: FetchError = new Error(
      "An error occurred while fetching the data.",
    );
    // Attach extra info to the error object.
    const info = await res.json();
    error.status = res.status;
    error.info = info;
    throw error;
  }

  return res.json();
};
