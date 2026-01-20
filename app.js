import { createClient } from "@supabase/supabase-js";
import confetti from "canvas-confetti";
import { formatRelativeTime, formatCompactNumber } from "./utils.js";
import { getTranslation } from "./translations.js";

// Supabase Configuration
const supabaseUrl = 'https://ikogeqhhkdrxdoihirkg.supabase.co/';
const supabaseKey = 'sb_publishable_YtYUTSwaYux-n_8iPm1uCw_kgWj_uiW';
const supabase = createClient(supabaseUrl, supabaseKey);

// State

// URL Parameter Handling - capture state
const currentUrl = new URL(window.location.href);
const isQRSource = currentUrl.searchParams.get('source') === 'qr';

// State
let currentSort = "desc";
let findersData = [];
const userLang = navigator.language || 'en-US';
const t = getTranslation(userLang);

// DOM Elements
const leaderboardEl = document.getElementById("leaderboard");
const finderCountEl = document.getElementById("finder-count");
const sortFilter = document.getElementById("sort-filter");
const popupOverlay = document.getElementById("popup-overlay");
const nicknameInput = document.getElementById("nickname-input");
const submitBtn = document.getElementById("submit-nickname");

// Initialization Logic
async function init() {
    // Apply translations
    applyTranslations();

    try {
        // Only fetch once at load
        fetchLeaderboard();
    } catch (error) {
        console.error("App failed to initialize:", error);
    }

    const isAuthed = localStorage.getItem("sk-autho910") === "True";

    // Check if we should show the "Congrats" popup
    if (isQRSource && !isAuthed) {
        showCongratsPopup();
    }

    // Event Listeners
    sortFilter.addEventListener("change", (e) => {
        currentSort = e.target.value;
        renderLeaderboard();
    });

    submitBtn.addEventListener("click", handleSubmitNickname);
    
    nicknameInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") handleSubmitNickname();
    });
}

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) el.textContent = t[key];
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (t[key]) el.placeholder = t[key];
    });
}

function showCongratsPopup() {
    popupOverlay.classList.remove("hidden");
    confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#10b981', '#f8fafc']
    });
}

async function handleSubmitNickname() {
    const nickname = nicknameInput.value.trim();
    if (!nickname) return;

    submitBtn.disabled = true;
    submitBtn.textContent = t.button_saving;

    try {
        const { error } = await supabase
            .from('hunt')
            .insert([{ nickname }]);

        if (error) throw error;

        localStorage.setItem("sk-autho910", "True");
        popupOverlay.classList.add("hidden");
        
        // Refresh board immediately
        fetchLeaderboard();

        // Final celebratory burst
        confetti({
            particleCount: 100,
            spread: 100,
            origin: { y: 0.8 }
        });
    } catch (error) {
        console.error("Error adding nickname: ", error);
        alert(t.error_msg);
        submitBtn.disabled = false;
        submitBtn.textContent = t.button_claim;
    }
}

async function fetchLeaderboard() {
    try {
        const { data, error } = await supabase
            .from('hunt')
            .select('*');

        if (error) throw error;

        // Map data to match the app's expected format (using created_at as timestamp)
        findersData = (data || []).map(item => ({
            id: item.id,
            nickname: item.nickname,
            timestamp: item.created_at
        }));
        
        renderLeaderboard();
    } catch (error) {
        console.error("Error fetching leaderboard:", error);
    }
}

function renderLeaderboard() {
    // Update count display
    if (finderCountEl) {
        finderCountEl.textContent = `(${formatCompactNumber(findersData.length)})`;
    }

    const sorted = [...findersData].sort((a, b) => {
        // Robust timestamp handling for both ServerTimestamp and manual strings/dates
        const getMs = (val) => {
            if (!val) return Date.now();
            if (val.toMillis) return val.toMillis();
            if (val.seconds) return val.seconds * 1000;
            const d = new Date(val);
            return isNaN(d.getTime()) ? Date.now() : d.getTime();
        };
        const timeA = getMs(a.timestamp);
        const timeB = getMs(b.timestamp);
        return currentSort === "desc" ? timeB - timeA : timeA - timeB;
    });

    if (sorted.length === 0) {
        leaderboardEl.innerHTML = `<div class="loader">${t.empty}</div>`;
        return;
    }

    leaderboardEl.innerHTML = sorted.map(finder => {
        // Handle both Firestore Timestamp objects and ISO strings for backward/forward compatibility
        let date;
        if (finder.timestamp && typeof finder.timestamp.toDate === 'function') {
            date = finder.timestamp.toDate();
        } else if (typeof finder.timestamp === 'string') {
            date = new Date(finder.timestamp);
        } else {
            date = new Date();
        }

        return `
            <li class="finder-item">
                <span class="nickname">${escapeHtml(finder.nickname)}</span>
                <span class="timestamp">${formatRelativeTime(date, userLang, t.just_now)}</span>
            </li>
        `;
    }).join("");
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Kick off
init();