// =======================
// IDENTIFIKASJON
// =======================
const path = window.location.pathname;
const match = path.match(/Oppgave(\d+)\.html/i);
const OPPGAVE_ID = match ? parseInt(match[1], 10) : 1;

/* ✅ ENDRING:
   Bruk kategori satt av quiz.html
   (fallback beholdt)
*/
const kategori =
    sessionStorage.getItem("kategori") ||
    sessionStorage.getItem("valgtKategori") ||
    "standard";

const STORAGE_KEY = `quizData_${kategori}`;

/* ✅ ENDRING:
   ALLTID 10 spørsmål per økt
*/
const TOTAL_OPPGAVER =
    parseInt(sessionStorage.getItem("total")) || 10;

/* ✅ ENDRING:
   Nullstill statistikk når ny quiz starter
*/
if (OPPGAVE_ID === 1 && sessionStorage.getItem("indeks") === "0") {
    localStorage.removeItem(STORAGE_KEY);
}

// =======================
// DATA
// =======================
function hentData() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
        riktige: [],
        feil: {}
    };
}

function lagreData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// =======================
// UI
// =======================
function initUI() {
    document.getElementById("riktig").textContent = 0;
    document.getElementById("feil").textContent = 0;
    document.getElementById("prosent").textContent = 0;
    document.getElementById("progress").style.width = "0%";
}

function oppdaterStatus() {
    const data = hentData();

    const antallRiktig = data.riktige.length;
    const antallFeil = Object.values(data.feil)
        .reduce((sum, val) => sum + val, 0);

    const besvart = antallRiktig + antallFeil;

    document.getElementById("riktig").textContent = antallRiktig;
    document.getElementById("feil").textContent = antallFeil;

    const scoreProsent = besvart > 0
        ? Math.round((antallRiktig / besvart) * 100)
        : 0;

    document.getElementById("prosent").textContent = scoreProsent;

    // ✅ PROGRESS = riktige / 10
    const progressProsent =
        Math.round((antallRiktig / TOTAL_OPPGAVER) * 100);

    document.getElementById("progress").style.width =
        progressProsent + "%";
}

// =======================
// SVARSJEKK DIREKTE
// =======================
document.querySelectorAll('.svar').forEach(label => {
    label.addEventListener('click', () => {

        if (
            label.classList.contains('riktig') ||
            label.classList.contains('feil')
        ) return;

        const input = label.querySelector('input');
        const verdi = input.value;

        if (verdi === 'riktig') {
            label.classList.add('riktig');
        } else {
            label.classList.add('feil');
        }

        document.querySelectorAll('.svar').forEach(l => {
            l.querySelector('input').disabled = true;
            l.style.pointerEvents = 'none';
        });

        let data = hentData();

        if (verdi === 'riktig') {
            if (!data.riktige.includes(OPPGAVE_ID)) {
                data.riktige.push(OPPGAVE_ID);
            }
        } else {
            if (!data.feil[OPPGAVE_ID]) {
                data.feil[OPPGAVE_ID] = 0;
            }
            data.feil[OPPGAVE_ID]++;
        }

        lagreData(data);
        oppdaterStatus();

        document.getElementById('neste').style.display =
            'inline-block';
    });
});

// =======================
// NESTE SPØRSMÅL
// =======================

function nesteSporsmal() {
    let oppgaver = JSON.parse(sessionStorage.getItem("oppgaver"));
    let kategori = sessionStorage.getItem("kategori");
    const data = hentData();

    // Fjern nåværende oppgave fra køen
    oppgaver = oppgaver.filter(id => id !== OPPGAVE_ID);

    // Hvis feil → legg bakerst
    if (!data.riktige.includes(OPPGAVE_ID)) {
        oppgaver.push(OPPGAVE_ID);
    }

    // Lagre oppdatert kø
    sessionStorage.setItem("oppgaver", JSON.stringify(oppgaver));

    // Ferdig når 10 unike riktige
    if (data.riktige.length >= TOTAL_OPPGAVER) {
        alert("Hipp hurra! Du har løst alle oppgavene 🤓");
        window.location.href = "../index.html";
        return;
    }

    // Gå til neste oppgave (først i køen)
    window.location.href =
        `../${kategori}/Oppgave${oppgaver[0]}.html`;
}


// =======================
// INIT
// =======================
initUI();
oppdaterStatus();