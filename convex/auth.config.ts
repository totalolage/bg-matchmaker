export default {
  providers: [
    {
      domain:
        process.env.CONVEX_SITE_URL ||
        `http://localhost:${process.env.PORT || 5173}`,
      applicationID: "convex",
    },
  ],
};
