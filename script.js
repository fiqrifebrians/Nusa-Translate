// Mengambil elemen dari DOM
const sourceLang = document.getElementById('source-lang');
const targetLang = document.getElementById('target-lang');
const sourceText = document.getElementById('source-text');
const targetText = document.getElementById('target-text');
const swapBtn = document.getElementById('swap-btn');

// Fungsi untuk menukar bahasa dan teks
swapBtn.addEventListener('click', () => {
    // Tukar pilihan bahasa
    const tempLang = sourceLang.value;
    sourceLang.value = targetLang.value;
    targetLang.value = tempLang;

    // Tukar teks (opsional, tergantung UX yang diinginkan)
    const tempText = sourceText.value;
    sourceText.value = targetText.value;
    targetText.value = tempText;

    // Picu terjemahan ulang jika ada teks
    if (sourceText.value.trim() !== "") {
        translateText();
    }
});

// Event Listener pada dropdown agar otomatis menerjemahkan saat bahasa diubah
sourceLang.addEventListener('change', translateText);
targetLang.addEventListener('change', translateText);

// --- LOGIKA REAL-TIME DENGAN DEBOUNCE ---
// Debounce mencegah API dipanggil berulang kali setiap detik saat mengetik.
let typingTimer;
const typingInterval = 500; // 500ms setelah selesai mengetik

sourceText.addEventListener('input', () => {
    clearTimeout(typingTimer);
    
    // Tampilkan indikator sedang mengetik/menerjemahkan
    if (sourceText.value.trim() === "") {
        targetText.value = "";
        return;
    }
    
    targetText.value = "Menerjemahkan...";

    typingTimer = setTimeout(() => {
        translateText();
    }, typingInterval);
});

// Fungsi pemanggil AI (Simulasi)
async function translateText() {
    const text = sourceText.value.trim();
    const source = sourceLang.value;
    const target = targetLang.value;

    if (!text) {
        targetText.value = "";
        return;
    }

    try {
        // DI SINI ADALAH TEMPAT UNTUK MEMANGGIL API AI ASLI (misal: OpenAI / Google Cloud)
        // Contoh implementasi fetch asli (dikomentari):
        /*
        const response = await fetch('URL_API_BACKEND_ANDA', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, source, target })
        });
        const data = await response.json();
        targetText.value = data.translated_text;
        */

        // Simulasi respon AI (Mock AI):
        targetText.value = await mockAIApiCall(text, source, target);

    } catch (error) {
        console.error("Gagal menerjemahkan:", error);
        targetText.value = "Maaf, terjadi kesalahan saat menghubungi AI.";
    }
}

// Fungsi pura-pura untuk meniru jeda dan hasil dari AI
function mockAIApiCall(text, source, target) {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Simulasi hasil terjemahan
            resolve(`[Hasil AI dari ${source.toUpperCase()} ke ${target.toUpperCase()}]\n\n${text}`);
        }, 600); // Simulasi delay jaringan 600ms
    });
}