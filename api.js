// Letakkan API Key Gemini Anda di sini jika ada. Jika tidak, biarkan kosong.
const GEMINI_API_KEY = ""; 

/**
 * Fungsi untuk menerjemahkan teks.
 * Didesain untuk fail-safe: Tidak akan pernah melempar pesan error mencolok.
 * Jika semua layanan gagal, akan mengembalikan teks aslinya.
 */
async function getTranslation(text, sourceCode, targetCode, sourceName, targetName) {
    if (!text) return "";
    
    let result = "";

    // TAHAP 1: Coba gunakan Google Translate API Publik
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceCode}&tl=${targetCode}&dt=t&q=${encodeURIComponent(text)}`;
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            if (data && data[0]) {
                data[0].forEach(item => {
                    if (item[0]) result += item[0];
                });
            }
        }
    } catch (error) {
        // Abaikan error secara diam-diam (Silent Catch)
    }

    // TAHAP 2: Jika gagal atau Google tidak mendukung bahasa daerah tersebut (teks tidak berubah)
    // Kita panggil Gemini AI (hanya jika ada API Key)
    if (!result || result.toLowerCase() === text.toLowerCase()) {
        if (GEMINI_API_KEY) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
                const promptText = `Terjemahkan kalimat ini dari ${sourceName} ke ${targetName} dengan akurat. Hanya berikan hasil akhir tanpa tanda kutip. Teks: "${text}"`;

                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.candidates && data.candidates[0].content.parts[0].text) {
                        result = data.candidates[0].content.parts[0].text.trim();
                    }
                }
            } catch (error) {
                // Abaikan error AI secara diam-diam
            }
        }
    }

    // TAHAP 3: Kembalikan hasil terbaik yang didapat, atau teks asli jika semuanya gagal
    return result || text;
}