const sourceLang = document.getElementById('source-lang');
const targetLang = document.getElementById('target-lang');
const sourceText = document.getElementById('source-text');
const targetText = document.getElementById('target-text');
const swapBtn = document.getElementById('swap-btn');
const historyList = document.getElementById('history-list');

// Fitur Tukar Bahasa
swapBtn.addEventListener('click', () => {
    const tempLang = sourceLang.value;
    sourceLang.value = targetLang.value;
    targetLang.value = tempLang;

    const tempText = sourceText.value;
    sourceText.value = targetText.value;
    targetText.value = tempText;

    if (sourceText.value.trim() !== "") translateText();
});

sourceLang.addEventListener('change', translateText);
targetLang.addEventListener('change', translateText);

// Debounce Pengetikan agar AI tidak terpanggil di setiap ketukan huruf
let typingTimer;
sourceText.addEventListener('input', () => {
    clearTimeout(typingTimer);
    if (sourceText.value.trim() === "") {
        targetText.value = "";
        return;
    }
    targetText.placeholder = "AI sedang menerjemahkan...";
    typingTimer = setTimeout(translateText, 1000); // 1 detik jeda untuk menghemat kuota API
});

// Fitur History
function addToHistory(sourceL, targetL, originalTxt, translatedTxt) {
    const emptyMsg = document.querySelector('.empty-history');
    if (emptyMsg) emptyMsg.remove(); 

    const li = document.createElement('li');
    li.innerHTML = `
        <div class="history-src">${sourceL.toUpperCase()} ➔ ${targetL.toUpperCase()}</div>
        <div><strong>Asal:</strong> ${originalTxt}</div>
        <div><strong>Hasil:</strong> <em>${translatedTxt}</em></div>
    `;
    historyList.prepend(li);
}

// Fungsi Panggil GEMINI AI API
let lastTranslatedText = ""; 
async function translateText() {
    const text = sourceText.value.trim();
    // Ambil teks lengkap dari dropdown (misal: "Bahasa Melayu Jambi") untuk prompt Gemini
    const sourceName = sourceLang.options[sourceLang.selectedIndex].text;
    const targetName = targetLang.options[targetLang.selectedIndex].text;

    if (!text) return;

    try {
        // PERHATIAN: Masukkan API Key Anda di bawah ini
        const API_KEY = "MASUKKAN_API_KEY_GEMINI_ANDA_DI_SINI"; 
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

        // Prompt rekayasa (Prompt Engineering) agar Gemini bertindak sebagai translator murni
        const promptText = `Anda adalah penerjemah ahli. Terjemahkan teks berikut dari ${sourceName} ke ${targetName}. 
        Aturan:
        1. Hanya berikan hasil terjemahannya saja.
        2. Jangan tambahkan penjelasan, tanda kutip, atau teks tambahan apapun.
        Teks: "${text}"`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }]
            })
        });

        if (!response.ok) throw new Error("Terjadi masalah jaringan atau API Key tidak valid");

        const data = await response.json();
        
        // Ekstraksi hasil teks dari JSON response Gemini
        const translatedResult = data.candidates[0].content.parts[0].text.trim();
        
        targetText.value = translatedResult;

        // Catat ke History
        if (lastTranslatedText !== text && translatedResult !== text) {
            addToHistory(sourceLang.value, targetLang.value, text, translatedResult);
            lastTranslatedText = text;
        }

    } catch (error) {
        console.error("Gagal menerjemahkan:", error);
        targetText.value = "Gagal menghubungi AI. Pastikan API Key valid."; 
    }
}

// === FITUR VOICE ===

// 1. Voice Input (Mic)
const micBtn = document.getElementById('mic-btn');
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.lang = 'id-ID'; 
    recognition.continuous = false;

    micBtn.addEventListener('click', () => {
        recognition.start();
        micBtn.classList.add('recording');
        sourceText.placeholder = "Mendengarkan...";
    });

    recognition.onresult = (event) => {
        const currentContent = sourceText.value;
        const transcript = event.results[0][0].transcript;
        sourceText.value = currentContent ? currentContent + " " + transcript : transcript;
        translateText(); 
    };

    recognition.onspeechend = () => {
        recognition.stop();
        micBtn.classList.remove('recording');
        sourceText.placeholder = "Ketik atau ucapkan teks di sini...";
    };

    recognition.onerror = () => {
        micBtn.classList.remove('recording');
        sourceText.placeholder = "Suara tidak terdengar...";
    };
} else {
    micBtn.style.display = "none";
}

// 2. Voice Output (Speaker)
const speakBtn = document.getElementById('speak-btn');
speakBtn.addEventListener('click', () => {
    const textToSpeak = targetText.value;
    if (!textToSpeak) return;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'id-ID'; 
    utterance.rate = 0.9; 
    window.speechSynthesis.speak(utterance);
});