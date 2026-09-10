export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Jika sistem frontend meminta bantuan translasi AI
    if (url.pathname === '/api/translate' && request.method === 'POST') {
      try {
        const { text, sourceName, targetName } = await request.json();
        
        // Mengambil API Key dari brankas rahasia (Environment Variables) Cloudflare
        const API_KEY = env.GEMINI_API_KEY; 

        if (!API_KEY) {
            return new Response(JSON.stringify({ error: "API Key belum diatur" }), { status: 500 });
        }

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
        const promptText = `Terjemahkan kalimat ini dari ${sourceName} ke ${targetName} dengan akurat. Hanya berikan hasil akhir tanpa tanda kutip. Teks: "${text}"`;

        const geminiResponse = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
        });

        if (!geminiResponse.ok) throw new Error("Gagal menghubungi AI");
        
        const data = await geminiResponse.json();
        const translatedText = data.candidates[0].content.parts[0].text.trim();

        // Mengembalikan hanya teks hasil terjemahannya saja ke frontend
        return new Response(JSON.stringify({ translatedText }), {
          headers: { 'Content-Type': 'application/json' }
        });

      } catch (error) {
        return new Response(JSON.stringify({ error: "Terjadi kesalahan internal" }), { status: 500 });
      }
    }

    // Jika bukan fungsi translasi, biarkan sistem memuat index.html, css, dan js seperti biasa
    return env.ASSETS.fetch(request);
  }
};