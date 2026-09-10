const sourceLang = document.getElementById('source-lang');
const targetLang = document.getElementById('target-lang');
const sourceText = document.getElementById('source-text');
const targetText = document.getElementById('target-text');
const swapBtn = document.getElementById('swap-btn');
const historyList = document.getElementById('history-list');

const sourceSpeakBtn = document.getElementById('source-speak-btn');
const targetSpeakBtn = document.getElementById('target-speak-btn');

// --- PENGATURAN SUARA INDONESIA ---
let voices = [];
window.speechSynthesis.onvoiceschanged = () => {
    voices = window.speechSynthesis.getVoices();
};

function speakText(text) {
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'id-ID'; 
    
    // Memaksa browser untuk mencari dan menggunakan aktor suara Indonesia
    const indonesianVoice = voices.find(v => v.lang === 'id-ID' || v.lang === 'id_ID' || v.name.includes('Indonesia'));
    if (indonesianVoice) {
        utterance.voice = indonesianVoice;
    }
    
    window.speechSynthesis.speak(utterance);
}

// --- LOGIKA UI & HISTORY ---
const historyToggle = document.getElementById('history-toggle');
const historyContent = document.getElementById('history-content');

historyToggle.addEventListener('click', () => {
    historyContent.classList.toggle('hidden');
    historyToggle.classList.toggle('collapsed');
});

function addToHistory(sourceName, targetName, originalTxt, translatedTxt) {
    const emptyMsg = document.querySelector('.empty-history');
    if (emptyMsg) emptyMsg.remove(); 

    const li = document.createElement('li');
    li.innerHTML = `
        <div class="history-src">${sourceName} ➔ ${targetName}</div>
        <div><strong>Asal:</strong> ${originalTxt}</div>
        <div><strong>Hasil:</strong> <em>${translatedTxt}</em></div>
    `;
    historyList.prepend(li);
}

function toggleSpeakerButtons() {
    // Tombol speaker input
    if (sourceText.value.trim() !== "") {
        sourceSpeakBtn.classList.remove('hidden');
    } else {
        sourceSpeakBtn.classList.add('hidden');
    }
    
    // Tombol speaker output
    if (targetText.value.trim() !== "" && targetText.value !== "Terjadi masalah jaringan.") {
        targetSpeakBtn.classList.remove('hidden');
    } else {
        targetSpeakBtn.classList.add('hidden');
    }
}

// --- FITUR TUKAR & KETIK ---
swapBtn.addEventListener('click', () => {
    const tempLang = sourceLang.value;
    sourceLang.value = targetLang.value;
    targetLang.value = tempLang;

    const tempText = sourceText.value;
    sourceText.value = targetText.value;
    targetText.value = tempText;

    toggleSpeakerButtons();
    if (sourceText.value.trim() !== "") translateText();
});

sourceLang.addEventListener('change', translateText);
targetLang.addEventListener('change', translateText);

let typingTimer;
sourceText.addEventListener('input', () => {
    toggleSpeakerButtons();
    clearTimeout(typingTimer);
    
    if (sourceText.value.trim() === "") {
        targetText.value = "";
        targetText.placeholder = "";
        toggleSpeakerButtons();
        return;
    }
    
    typingTimer = setTimeout(translateText, 800);
});

// --- ENGINE TRANSLATOR (MENCEGAH ERROR) ---
let lastTranslatedText = ""; 
async function translateText() {
    const text = sourceText.value.trim();
    // Mengambil NAMA LENGKAP bahasa (misal: "Bahasa Indonesia", bukan "id")
    const sourceName = sourceLang.options[sourceLang.selectedIndex].text;
    const targetName = targetLang.options[targetLang.selectedIndex].text;

    if (!text) return;
    
    targetText.value = ""; 
    targetText.placeholder = "Menerjemahkan...";
    targetSpeakBtn.classList.add('hidden'); // Sembunyikan speaker saat loading

    let finalResult = "";

    // 1. Coba gunakan database publik (Google) terlebih dahulu
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang.value}&tl=${targetLang.value}&dt=t&q=${encodeURIComponent(text)}`;
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            if (data && data[0]) {
                data[0].forEach(item => {
                    if (item[0]) finalResult += item[0];
                });
            }
        }
    } catch (error) {
        // Abaikan error jaringan sementara, kita coba backup ke AI di langkah 2
    }

    // 2. Jika database publik gagal (hasil kosong) ATAU bahasa daerah tsb tidak didukung (hasil tidak berubah dari aslinya)
    if (!finalResult || finalResult.toLowerCase() === text.toLowerCase()) {
        const API_KEY = ""; // Masukkan API Key jika tersedia
        
        if (API_KEY) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
                const promptText = `Terjemahkan kalimat ini dari ${sourceName} ke ${targetName} dengan akurat. Hanya berikan hasil akhir tanpa tanda kutip. Teks: "${text}"`;

                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
                });

                if (response.ok) {
                    const data = await response.json();
                    finalResult = data.candidates[0].content.parts[0].text.trim();
                }
            } catch (error) {
                // Biarkan finalResult apa adanya (akan ditangani di bawah)
            }
        }
    }

    // 3. Output hasil (Tidak ada notif AI atau API, murni gagal jaringan jika benar-benar kosong)
    targetText.placeholder = "";
    if (!finalResult) {
        targetText.value = "Terjadi masalah jaringan.";
    } else {
        targetText.value = finalResult;
        
        if (lastTranslatedText !== text) {
            addToHistory(sourceName, targetName, text, finalResult);
            lastTranslatedText = text;
        }
    }
    
    toggleSpeakerButtons();
}

// --- EVENT LISTENER TOMBOL SPEAKER & MIC ---
sourceSpeakBtn.addEventListener('click', () => {
    speakText(sourceText.value);
});

targetSpeakBtn.addEventListener('click', () => {
    if (targetText.value !== "Terjadi masalah jaringan.") {
        speakText(targetText.value);
    }
});

const micBtn = document.getElementById('mic-btn');
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.lang = 'id-ID'; 
    recognition.continuous = false;

    micBtn.addEventListener('click', () => {
        recognition.start();
        micBtn.style.color = "#D31227"; 
        sourceText.placeholder = "Mendengarkan...";
    });

    recognition.onresult = (event) => {
        const currentContent = sourceText.value;
        const transcript = event.results[0][0].transcript;
        sourceText.value = currentContent ? currentContent + " " + transcript : transcript;
        toggleSpeakerButtons();
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