exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
  const { password } = JSON.parse(event.body);
  if (password === process.env.STAFF_PASSWORD) {
    return { statusCode: 200, body: JSON.stringify({ token: process.env.STAFF_TOKEN }) };
  }
  return { statusCode: 401, body: JSON.stringify({ error: 'Wrong password' }) };
};
