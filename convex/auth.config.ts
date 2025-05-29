// Determine the site URL based on environment
const getSiteUrl = () => {
  // For production/preview deployments on Vercel
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

  // For local development
  return (
    process.env.CONVEX_SITE_URL ||
    `http://localhost:${process.env.PORT || 5173}`
  );
};

export default {
  providers: [
    {
      domain: getSiteUrl(),
      applicationID: "convex",
    },
  ],
};
