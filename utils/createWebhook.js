const axios = require("axios");

exports.createWebhook = async (repoFullName, accessToken) => {
  try {
    const url = `https://api.github.com/repos/${repoFullName}/hooks`;

    await axios.post(
      url,
      {
        name: "web",
        active: true,
        events: ["push"],
        config: {
          url: `${process.env.BACKEND_URL}/api/v1/webhook/github`,
          content_type: "json",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github+json",
        },
      }
    );

  } catch (err) {
    
    if (err.response?.status === 422) {
      console.log("Webhook already exists");
      return;
    }

    console.error("Webhook creation failed:", err.response?.data || err.message);
    throw err;
  }
};