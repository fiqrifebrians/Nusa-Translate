const sourceLang = document.getElementById('source-lang');
const targetLang = document.getElementById('target-lang');
const sourceText = document.getElementById('source-text');
const targetText = document.getElementById('target-text');
const swapBtn = document.getElementById('swap-btn');

// Fitur Tombol Tukar Bahasa
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

// Otomatis update saat bahasa diganti
sourceLang.addEventListener('change', translateText);
targetLang.addEventListener('change', translateText);

// Deteksi ketikan secara real-time (Debounce: 500ms)
let typingTimer;
sourceText.addEventListener('input', () => {
    clearTimeout(typingTimer);
    
    if (sourceText.value.trim() === "") {
        targetText.value = "";
        return;
    }

    typingTimer = setTimeout(() => {
        translateText();
    }, 500);
});

// Pemanggilan Translator API
async function translateText() {
    const text = sourceText.value.trim();
    const source = sourceLang.value;
    const target = targetLang.value;

    if (!text) {
        targetText.value = "";
        return;
    }

    try {
        // Menggunakan API Gratis Publik Google sebagai penggerak Real-Time
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${source}&tl=${target}&dt=t&q=${encodeURIComponent(text)}`;
        
        const response = await fetch(url);
        
        if (!response.ok) throw new Error("Terjadi masalah jaringan");

        const data = await response.json();
        
        // Membentuk teks hasil terjemahan
        let translatedResult = "";
        if (data && data[0]) {
            data[0].forEach(item => {
                if (item[0]) translatedResult += item[0];
            });
        }

        targetText.value = translatedResult;

    } catch (error) {
        console.error("Gagal menerjemahkan:", error);
        // Tampilkan teks asal jika API terkendala atau bahasa tidak ada di database 
        targetText.value = text; 
    }
}