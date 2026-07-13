require('dotenv').config();
const OpenAI = require('openai');
(async () => {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  try {
    const r = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
    });
    console.log('LIVE OPENAI OK ->', r.choices[0].message.content);
  } catch (e) {
    console.log('status:', e.status, '| code:', e.code, '| message:', e.message);
  }
  process.exit(0);
})();
