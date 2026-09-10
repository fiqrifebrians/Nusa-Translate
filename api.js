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
        // Abaikan error secara diam-diam
    }

    // TAHAP 2: Jika Google mengembalikan teks yang sama persis (bahasa tidak didukung)
    if (!result || result.trim().toLowerCase() === text.trim().toLowerCase()) {
        try {
            // Memanggil worker serverless kita sendiri BUKAN memanggil Gemini secara langsung
            const response = await fetch('/api/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    text: text, 
                    sourceName: sourceName, 
                    targetName: targetName 
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.translatedText) {
                    result = data.translatedText;
                }
            } else {
                throw new Error("Backend Error");
            }
        } catch (error) {
            return "Terjadi masalah jaringan."; 
        }
    }

    return result || text;
}