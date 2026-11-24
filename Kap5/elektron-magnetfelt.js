(() => {

    const root = document.querySelector("#elektron-magnetfelt");
    if (!root) return;

    const canvas = root.querySelector("#emCanvas");
    const ctx = canvas.getContext("2d");

    // Glidebrytere
    const fartSlider = root.querySelector("#emFart");
    const bSlider = root.querySelector("#emB");

    // Verdier
    const fartVerdi = root.querySelector("#emFartVerdi");
    const bVerdi = root.querySelector("#emBVerdi");

    // Knapp
    const skytKnapp = root.querySelector("#emSkyt");

    // Radioknapper
    const partikkelRadio = root.querySelectorAll(
        'input[name="emPartikkel"]'
    );

    // Canvas
    const scale = 2;

    const W = canvas.width / scale;
    const H = canvas.height / scale;

    ctx.scale(scale, scale);

    // Fysiske konstanter
    const e = 1.602176634e-19;
    const m = 9.1093837e-31;

    // Samme målestokk i x- og y-retning
    const pxPerMeter = 1000;

    // Magnetfeltets rektangel
    const feltX1 = 110;
    const feltX2 = 500;

    const feltY1 = 35;
    const feltY2 = 265;

    // Startpunkt
    const startX = 25;
    const startY = 150;

    // Animasjon
    let animerer = false;
    let startTid = null;
    let animasjonsId = null;

    let elektronPos = {
        x: startX,
        y: startY
    };

    const animasjonsVarighet = 4000;


    // ---------------------------------------
    // HENT VERDIER
    // ---------------------------------------

    function hentVerdier() {

        const valgt = root.querySelector(
            'input[name="emPartikkel"]:checked'
        );

        return {
            v0: Number(fartSlider.value) * 1e6,
            B: Number(bSlider.value) * 1e-3,
            ladning: Number(valgt.value)
        };
    }


    // ---------------------------------------
    // BEREGN PARTIKKELBANE
    // ---------------------------------------

    function beregnBane(v0, B, ladning) {

        const r = m * v0 / (e * B);

        const rPx = r * pxPerMeter;

        // Elektron bøyes nedover
        // Positron bøyes oppover
        const retning = ladning === -1 ? 1 : -1;

        const punkter = [];

        // Før magnetfeltet
        for (let x = startX; x <= feltX1; x += 2) {

            punkter.push({
                x: x,
                y: startY
            });
        }

        // Sirkelbane i magnetfeltet
        const maxVinkel = 2 * Math.PI;

        const steg = 0.002;

        for (
            let theta = 0;
            theta <= maxVinkel;
            theta += steg
        ) {

            const x =
                feltX1 + rPx * Math.sin(theta);

            const y =
                startY +
                retning * rPx * (1 - Math.cos(theta));

            // Stopp ved kanten av magnetfeltet
            if (
                x < feltX1 ||
                x > feltX2 ||
                y < feltY1 ||
                y > feltY2
            ) {
                break;
            }

            punkter.push({ x, y });
        }

        return punkter;
    }

    // Beregn samlet lengde langs banen
function beregnBanelengde(punkter) {

    let lengde = 0;

    for (let i = 1; i < punkter.length; i++) {

        const dx = punkter[i].x - punkter[i - 1].x;
        const dy = punkter[i].y - punkter[i - 1].y;

        lengde += Math.hypot(dx, dy);

        punkter[i].s = lengde;
    }

    if (punkter.length > 0) {
        punkter[0].s = 0;
    }

    return lengde;
}


// Finn posisjon ut fra tilbakelagt strekning
function posisjonLangsBane(s) {

    if (bane.length === 0) {
        return { x: startX, y: startY };
    }

    if (s <= 0) {
        return bane[0];
    }

    if (s >= totalLengde) {
        return bane[bane.length - 1];
    }

    for (let i = 1; i < bane.length; i++) {

        if (bane[i].s >= s) {

            const p1 = bane[i - 1];
            const p2 = bane[i];

            const andel =
                (s - p1.s) / (p2.s - p1.s);

            return {
                x: p1.x + andel * (p2.x - p1.x),
                y: p1.y + andel * (p2.y - p1.y)
            };
        }
    }

    return bane[bane.length - 1];
}

    // ---------------------------------------
    // TEGN MAGNETFELT
    // ---------------------------------------

    function tegnMagnetfelt() {

        ctx.fillStyle = "rgba(59,130,246,0.06)";

        ctx.fillRect(
            feltX1,
            feltY1,
            feltX2 - feltX1,
            feltY2 - feltY1
        );

        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = 1.5;

        ctx.strokeRect(
            feltX1,
            feltY1,
            feltX2 - feltX1,
            feltY2 - feltY1
        );

        // Kryss: magnetfelt inn i arket
        ctx.strokeStyle = "#64748b";
        ctx.lineWidth = 1.5;

        for (
            let x = feltX1 + 20;
            x < feltX2;
            x += 35
        ) {

            for (
                let y = feltY1 + 20;
                y < feltY2;
                y += 35
            ) {

                const s = 4;

                ctx.beginPath();

                ctx.moveTo(x - s, y - s);
                ctx.lineTo(x + s, y + s);

                ctx.moveTo(x + s, y - s);
                ctx.lineTo(x - s, y + s);

                ctx.stroke();
            }
        }
    }


    // ---------------------------------------
    // TEGN STIPLET BANE
    // ---------------------------------------

    function tegnBane(punkter) {

        if (punkter.length < 2) return;

        ctx.beginPath();

        ctx.setLineDash([4, 5]);

        ctx.strokeStyle = "#93c5fd";
        ctx.lineWidth = 1.5;

        ctx.moveTo(
            punkter[0].x,
            punkter[0].y
        );

        for (let i = 1; i < punkter.length; i++) {

            ctx.lineTo(
                punkter[i].x,
                punkter[i].y
            );
        }

        ctx.stroke();
        ctx.setLineDash([]);
    }


    // ---------------------------------------
    // TEGN PARTIKKEL
    // ---------------------------------------

    function tegnPartikkel(x, y, ladning) {

        ctx.beginPath();

        ctx.arc(x, y, 6, 0, 2 * Math.PI);

        // Elektron blått, positron rødt
        ctx.fillStyle =
            ladning === -1
                ? "#2563eb"
                : "#dc2626";

        ctx.fill();

        // Ladningssymbol
        ctx.fillStyle = "white";
        ctx.font = "bold 11px Arial";

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillText(
            ladning === -1 ? "−" : "+",
            x,
            y
        );

        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
    }


    // ---------------------------------------
    // TEGN ALT
    // ---------------------------------------

let bane = [];

let tilbakelagt = 0;
let totalLengde = 0;

    function draw() {

        ctx.clearRect(0, 0, W, H);

        const { v0, B, ladning } = hentVerdier();

        fartVerdi.textContent =
            Number(fartSlider.value).toLocaleString("nb-NO");

        bVerdi.textContent =
            Number(bSlider.value).toLocaleString("nb-NO");

        tegnMagnetfelt();

        tegnBane(bane);

if (bane.length > 0) {

    const p = posisjonLangsBane(tilbakelagt);

    tegnPartikkel(
        p.x,
        p.y,
        ladning
    );
}
    }


    // ---------------------------------------
    // ANIMER PARTIKKEL
    // ---------------------------------------

  function animer(tid) {

    if (!animerer) return;

    if (startTid === null) {
        startTid = tid;
    }

    const { v0 } = hentVerdier();

    // Felles animasjonsfaktor.
    // Gjør den virkelige bevegelsen synlig.
    const tidsfaktor = 2e-8;

    const forløptTid = (tid - startTid) / 1000;

    // Fysisk tilbakelagt strekning, omregnet til piksler
    tilbakelagt =
        v0 * forløptTid * tidsfaktor * pxPerMeter;

    tilbakelagt = Math.min(
        tilbakelagt,
        totalLengde
    );

    draw();

    if (tilbakelagt < totalLengde) {

        animasjonsId = requestAnimationFrame(animer);

    } else {

        animerer = false;
    }
}


    // ---------------------------------------
    // SKYT PARTIKKEL
    // ---------------------------------------

    function skytPartikkel() {

        if (animasjonsId !== null) {
            cancelAnimationFrame(animasjonsId);
        }

        const { v0, B, ladning } = hentVerdier();

 bane = beregnBane(v0, B, ladning);

totalLengde = beregnBanelengde(bane);

tilbakelagt = 0;

        startTid = null;
        animerer = true;

        animasjonsId =
            requestAnimationFrame(animer);
    }


    // ---------------------------------------
    // OPPDATER VED ENDRING
    // ---------------------------------------

    function oppdater() {

        animerer = false;

        if (animasjonsId !== null) {
            cancelAnimationFrame(animasjonsId);
        }

        const { v0, B, ladning } = hentVerdier();

bane = beregnBane(v0, B, ladning);

totalLengde = beregnBanelengde(bane);

tilbakelagt = 0;

        draw();
    }


    fartSlider.addEventListener("input", oppdater);
    bSlider.addEventListener("input", oppdater);

    partikkelRadio.forEach(radio => {
        radio.addEventListener("change", oppdater);
    });

    skytKnapp.addEventListener(
        "click",
        skytPartikkel
    );

    // Starttilstand
    oppdater();

})();