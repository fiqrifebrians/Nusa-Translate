/**
 * main.js
 * Bertugas khusus untuk antarmuka pengguna (UI), DOM, Suara, dan Riwayat
 */

// --- DEKLARASI ELEMEN DOM ---
const sourceLang = document.getElementById('source-lang');
const targetLang = document.getElementById('target-lang');
const sourceText = document.getElementById('source-text');
const targetText = document.getElementById('target-text');
const swapBtn = document.getElementById('swap-btn');
const historyList = document.getElementById('history-list');

const sourceSpeakBtn = document.getElementById('source-speak-btn');
const targetSpeakBtn = document.getElementById('target-speak-btn');
const micBtn = document.getElementById('mic-btn');

const historyToggle = document.getElementById('history-toggle');
const historyContent = document.getElementById('history-content');

// --- PENGATURAN SUARA (TEXT-TO-SPEECH BAHASA INDONESIA) ---
window.speechSynthesis.getVoices();

function speakText(text) {
    if (!text || text === "Sistem error") return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'id-ID'; 
    utterance.rate = 0.9;
    
    let availableVoices = window.speechSynthesis.getVoices();
    const idVoice = availableVoices.find(v => 
        v.lang === 'id-ID' || 
        v.lang === 'id_ID' || 
        v.name.toLowerCase().includes('indonesia')
    );
    
    if (idVoice) {
        utterance.voice = idVoice;
    }
    
    window.speechSynthesis.speak(utterance);
}

// --- LOGIKA RIWAYAT (HISTORY) ---
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

// --- LOGIKA TOMBOL SPEAKER DINAMIS ---
function toggleSpeakerButtons() {
    if (sourceText.value.trim() !== "") {
        sourceSpeakBtn.classList.remove('hidden');
    } else {
        sourceSpeakBtn.classList.add('hidden');
    }
    
    if (targetText.value.trim() !== "" && targetText.value !== "Sistem error") {
        targetSpeakBtn.classList.remove('hidden');
    } else {
        targetSpeakBtn.classList.add('hidden');
    }
}

// --- LOGIKA EVENT KETIK & TRANSLATE ---
swapBtn.addEventListener('click', () => {
    const tempLang = sourceLang.value;
    sourceLang.value = targetLang.value;
    targetLang.value = tempLang;

    const tempText = sourceText.value;
    sourceText.value = targetText.value;
    targetText.value = tempText;

    toggleSpeakerButtons();
    if (sourceText.value.trim() !== "") processTranslation();
});

sourceLang.addEventListener('change', processTranslation);
targetLang.addEventListener('change', processTranslation);

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
    
    typingTimer = setTimeout(processTranslation, 800);
});

let lastTranslatedText = ""; 
async function processTranslation() {
    const text = sourceText.value.trim();
    const sourceCode = sourceLang.value;
    const targetCode = targetLang.value;
    
    const sourceName = sourceLang.options[sourceLang.selectedIndex].text;
    const targetName = targetLang.options[targetLang.selectedIndex].text;

    if (!text) return;
    
    targetText.value = ""; 
    targetText.placeholder = "Menerjemahkan...";
    targetSpeakBtn.classList.add('hidden'); 

    // Memanggil API dari file api.js
    const finalResult = await getTranslation(text, sourceCode, targetCode);
    
    targetText.placeholder = "";
    targetText.value = finalResult;

    // Masukkan ke history hanya jika hasil valid dan bukan teks asli yang sama persis
    if (lastTranslatedText !== text && targetText.value !== text && targetText.value !== "Sistem error") {
        addToHistory(sourceName, targetName, text, targetText.value);
        lastTranslatedText = text;
    }
    
    toggleSpeakerButtons();
}

// --- EVENT LISTENER SUARA (MIC & SPEAKER) ---
sourceSpeakBtn.addEventListener('click', () => speakText(sourceText.value));
targetSpeakBtn.addEventListener('click', () => speakText(targetText.value));

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
        processTranslation(); 
    };

    recognition.onspeechend = () => {
        recognition.stop();
        micBtn.style.color = "#9CA3AF";
        sourceText.placeholder = "Ketik atau ucapkan teks di sini...";
    };
} else {
    micBtn.style.display = "none";
}