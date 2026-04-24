const { default: axios } = require("axios");

exports.getCommitHash = async(repoFullName, branch, accessToken)=>
{
    const res = await axios.get(
    `https://api.github.com/repos/${repoFullName}/commits/${branch}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  return res.data.sha;
}