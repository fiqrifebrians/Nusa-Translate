const sourceLang = document.getElementById('source-lang');
const targetLang = document.getElementById('target-lang');
const sourceText = document.getElementById('source-text');
const targetText = document.getElementById('target-text');
const swapBtn = document.getElementById('swap-btn');

// Fungsi untuk menukar bahasa
swapBtn.addEventListener('click', () => {
    const tempLang = sourceLang.value;
    sourceLang.value = targetLang.value;
    targetLang.value = tempLang;

    const tempText = sourceText.value;
    sourceText.value = targetText.value;
    targetText.value = tempText;

    if (sourceText.value.trim() !== "") {
        translateText();
    }
});

// Otomatis terjemahkan ketika bahasa diganti
sourceLang.addEventListener('change', translateText);
targetLang.addEventListener('change', translateText);

// Logika Real-Time Debounce
let typingTimer;
const typingInterval = 600; // Eksekusi setelah 600ms berhenti mengetik

sourceText.addEventListener('input', () => {
    clearTimeout(typingTimer);
    
    if (sourceText.value.trim() === "") {
        targetText.value = "";
        return;
    }

    typingTimer = setTimeout(() => {
        translateText();
    }, typingInterval);
});

// Fungsi memanggil API
async function translateText() {
    const text = sourceText.value.trim();
    const source = sourceLang.value;
    const target = targetLang.value;

    if (!text) {
        targetText.value = "";
        return;
    }

    try {
        // MENGGUNAKAN API PUBLIK GOOGLE TRANSLATE SEBAGAI ENGINE SEMENTARA AGAR BENAR-BENAR BERFUNGSI
        // URL ini aman dari blokir CORS untuk penggunaan front-end sederhana
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${source}&tl=${target}&dt=t&q=${encodeURIComponent(text)}`;
        
        const response = await fetch(url);
        
        if (!response.ok) throw new Error("Jaringan bermasalah");

        const data = await response.json();
        
        // Mengekstrak hasil terjemahan dari array JSON Google API
        let translatedResult = "";
        data[0].forEach(item => {
            translatedResult += item[0];
        });

        // Tampilkan hasil tanpa embel-embel teks [Hasil AI]
        targetText.value = translatedResult;

    } catch (error) {
        console.error("Gagal menerjemahkan:", error);
        // Fallback jika API gagal atau bahasa daerah spesifik tidak ditemukan di database API
        targetText.value = text;
    }
}