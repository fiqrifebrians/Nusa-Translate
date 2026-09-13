/**
 * api.js
 * Bertugas khusus untuk komunikasi dengan API Google Translate
 */

async function getTranslation(text, sourceCode, targetCode) {
    if (!text) return "";

    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceCode}&tl=${targetCode}&dt=t&q=${encodeURIComponent(text)}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error("Gagal mengambil data dari server");
        }

        const data = await response.json();
        let translatedResult = "";
        
        if (data && data[0]) {
            data[0].forEach(item => {
                if (item[0]) translatedResult += item[0];
            });
        }
        
        // Kembalikan hasil terjemahan. Jika kosong, kembalikan teks aslinya.
        return translatedResult || text;

    } catch (error) {
        // Menampilkan pesan gangguan
        return "Sistem error"; 
    }
}