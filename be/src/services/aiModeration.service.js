const axios = require('axios');

const AI_MODERATION_URL =
  process.env.AI_MODERATION_URL || 'http://127.0.0.1:8001';

async function moderateComment(text) {
  const response = await axios.post(
    `${AI_MODERATION_URL}/moderate`,
    { text },
    { timeout: 10000 }
  );

  return response.data;
}

module.exports = {
  moderateComment,
};