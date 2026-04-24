const axios = require("axios");

exports.deleteWebhook = async (repoFullName, accessToken) => {
  try {
    const baseUrl = `${process.env.BACKEND_URL}/api/webhook/github`;

    const res = await axios.get(
      `https://api.github.com/repos/${repoFullName}/hooks`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github+json",
        },
      }
    );

    const hooks = res.data;

    
    const hook = hooks.find(
      (h) => h.config?.url === baseUrl
    );

    if (!hook) {
      console.log("Webhook not found");
      return;
    }

    
    await axios.delete(
      `https://api.github.com/repos/${repoFullName}/hooks/${hook.id}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    console.log("Webhook deleted");
  } catch (err) {
    console.error(
      "Delete webhook failed:",
      err.response?.data || err.message
    );
  }
};