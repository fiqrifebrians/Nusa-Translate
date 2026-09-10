const sourceLang = document.getElementById('source-lang');
const targetLang = document.getElementById('target-lang');
const sourceText = document.getElementById('source-text');
const targetText = document.getElementById('target-text');
const swapBtn = document.getElementById('swap-btn');
const historyList = document.getElementById('history-list');

// Fitur Extendable History (Accordion Toggle)
const historyToggle = document.getElementById('history-toggle');
const historyContent = document.getElementById('history-content');
const historyArrow = document.getElementById('history-arrow');

historyToggle.addEventListener('click', () => {
    historyContent.classList.toggle('hidden');
    historyToggle.classList.toggle('collapsed');
});

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

let typingTimer;
sourceText.addEventListener('input', () => {
    clearTimeout(typingTimer);
    if (sourceText.value.trim() === "") {
        targetText.value = "";
        return;
    }
    typingTimer = setTimeout(translateText, 800);
});

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

// Daftar bahasa yang sudah terdukung database publik
const googleSupportedLangs = ['id', 'jv', 'su', 'mad', 'min', 'bug', 'ban', 'bjn', 'ace', 'bbc', 'mak', 'sas', 'btx', 'nia', 'btm', 'sda', 'day', 'gor'];

let lastTranslatedText = ""; 
async function translateText() {
    const text = sourceText.value.trim();
    const source = sourceLang.value;
    const target = targetLang.value;

    if (!text) return;
    targetText.placeholder = "Menerjemahkan...";

    // PEMISAHAN LOGIKA: GOOGLE TRANSLATE vs AI
    if (googleSupportedLangs.includes(target) && googleSupportedLangs.includes(source)) {
        // --- 1. GUNAKAN CARA LAMA (GOOGLE API GRATIS) ---
        try {
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${source}&tl=${target}&dt=t&q=${encodeURIComponent(text)}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error("Terjadi masalah jaringan");

            const data = await response.json();
            let translatedResult = "";
            if (data && data[0]) {
                data[0].forEach(item => {
                    if (item[0]) translatedResult += item[0];
                });
            }
            targetText.value = translatedResult;

            if (lastTranslatedText !== text) {
                addToHistory(source, target, text, translatedResult);
                lastTranslatedText = text;
            }
        } catch (error) {
            targetText.value = text; 
        }

    } else {
        // --- 2. HANYA GUNAKAN AI JIKA BAHASA TIDAK ADA DI DATABASE (Musi/Jambi) ---
        const sourceName = sourceLang.options[sourceLang.selectedIndex].text;
        const targetName = targetLang.options[targetLang.selectedIndex].text;
        const API_KEY = ""; // Masukkan API_KEY di sini jika ingin menghidupkan AI

        if (!API_KEY) {
            targetText.value = `Fitur AI untuk ${targetName} belum aktif. Mohon tambahkan API Key pada script.`;
            return;
        }

        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
            const promptText = `Terjemahkan kalimat ini dari ${sourceName} ke ${targetName} dengan akurat. Hanya berikan hasil akhir tanpa tanda kutip. Teks: "${text}"`;

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
            });

            if (!response.ok) throw new Error();
            const data = await response.json();
            const translatedResult = data.candidates[0].content.parts[0].text.trim();
            targetText.value = translatedResult;

            if (lastTranslatedText !== text) {
                addToHistory(source, target, text, translatedResult);
                lastTranslatedText = text;
            }
        } catch (error) {
            targetText.value = "Gagal memproses bahasa ini menggunakan AI."; 
        }
    }
}

// === FITUR VOICE MINIMALIS ===
const micBtn = document.getElementById('mic-btn');
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.lang = 'id-ID'; 
    recognition.continuous = false;

    micBtn.addEventListener('click', () => {
        recognition.start();
        micBtn.style.color = "#D31227"; // Warna merah saat merekam
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
        micBtn.style.color = "#9CA3AF";
        sourceText.placeholder = "Ketik atau ucapkan teks di sini...";
    };
} else {
    micBtn.style.display = "none";
}

const speakBtn = document.getElementById('speak-btn');
speakBtn.addEventListener('click', () => {
    const textToSpeak = targetText.value;
    if (!textToSpeak) return;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'id-ID'; 
    window.speechSynthesis.speak(utterance);
});