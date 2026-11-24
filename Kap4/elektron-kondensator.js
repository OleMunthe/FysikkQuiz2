(() => {

    const root = document.querySelector("#elektron-kondensator");
    if (!root) return;

    const canvas = root.querySelector("#ekCanvas");
    const ctx = canvas.getContext("2d");

    const fartSlider = root.querySelector("#ekFart");
    const avstandSlider = root.querySelector("#ekAvstand");
    const spenningSlider = root.querySelector("#ekSpenning");

    const fartVerdi = root.querySelector("#ekFartVerdi");
    const avstandVerdi = root.querySelector("#ekAvstandVerdi");
    const spenningVerdi = root.querySelector("#ekSpenningVerdi");

    const skytKnapp = root.querySelector("#ekSkyt");

    const scale = 2;

    const W = canvas.width / scale;
    const H = canvas.height / scale;

    ctx.scale(scale, scale);

    // Fysiske konstanter
    const e = 1.602176634e-19;
    const m = 9.1093837e-31;

// Felles målestokk i begge retninger
const pxPerCm = 12;
const pxPerMeter = pxPerCm * 100;

// Fysisk platelengde
const plateLengde = 0.40; // 40 cm

// Platenes plassering
const plateStartX = 65;

const plateLengdePx = plateLengde * pxPerMeter;

const plateSluttX = plateStartX + plateLengdePx;

    const midtY = H / 2;

    // Elektronet starter til venstre for platene
    const startX = 20;

    // Animasjon
    let animerer = false;
    let startTid = null;
    let elektronX = startX;

    let animasjonsId = null;

    // Hvor lang tid elektronet bruker på skjermen
    const animasjonsVarighet = 3500;


    // ------------------------------------------
    // HENT VERDIER
    // ------------------------------------------

    function hentVerdier() {

        return {
            v0: Number(fartSlider.value) * 1e6,
            d: Number(avstandSlider.value) / 100,
            U: Number(spenningSlider.value)
        };
    }


    // ------------------------------------------
    // BEREGN ELEKTRONETS POSISJON
    // ------------------------------------------

    function elektronPosisjon(x, v0, d, U) {

        const E = U / d;

        const a = e * E / m;

        // Før platene: rett linje
        if (x <= plateStartX) {
            return midtY;
        }

        // Horisontal avstand i meter
        const xMeter =
            (Math.min(x, plateSluttX) - plateStartX)
            / pxPerMeter;

        const t = xMeter / v0;

        // Forskyvning mellom platene
        const yMeter = 0.5 * a * t * t;

        let y = midtY - yMeter * pxPerMeter;

        // Etter platene: konstant vertikal fart
        if (x > plateSluttX) {

            const tUt = plateLengde / v0;

            const vyUt = a * tUt;

            const ekstraAvstand =
                (x - plateSluttX) / pxPerMeter;

            const ekstraTid =
                ekstraAvstand / v0;

            y -= vyUt * ekstraTid * pxPerMeter;
        }

        return y;
    }


    // ------------------------------------------
    // TEGN PLATER
    // ------------------------------------------

    function tegnPlater(d) {

        const avstandPx = d * pxPerMeter;

        const yTopp = midtY - avstandPx / 2;
        const yBunn = midtY + avstandPx / 2;

        // Positiv øvre plate
        ctx.fillStyle = "#dc2626";

        ctx.fillRect(
            plateStartX,
            yTopp - 8,
            plateLengdePx,
            8
        );

        // Negativ nedre plate
        ctx.fillStyle = "#2563eb";

        ctx.fillRect(
            plateStartX,
            yBunn,
            plateLengdePx,
            8
        );

        ctx.font = "bold 15px Arial";
        ctx.textAlign = "center";

        ctx.fillStyle = "#dc2626";

        ctx.fillText(
            "+",
            plateStartX + plateLengdePx / 2,
            yTopp - 14
        );

        ctx.fillStyle = "#2563eb";

        ctx.fillText(
            "−",
            plateStartX + plateLengdePx / 2,
            yBunn + 24
        );

        ctx.textAlign = "left";

        return { yTopp, yBunn };
    }


    // ------------------------------------------
    // TEGN ELEKTRISK FELT
    // ------------------------------------------

    function tegnFelt(yTopp, yBunn) {

        ctx.strokeStyle = "#94a3b8";
        ctx.fillStyle = "#94a3b8";
        ctx.lineWidth = 1;

        for (let i = 0; i < 6; i++) {

            const x =
                plateStartX +
                (i + 0.5) * plateLengdePx / 6;

            const y1 = yTopp + 12;
            const y2 = yBunn - 12;

            if (y2 <= y1) continue;

            ctx.beginPath();
            ctx.moveTo(x, y1);
            ctx.lineTo(x, y2);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(x, y2);
            ctx.lineTo(x - 4, y2 - 7);
            ctx.lineTo(x + 4, y2 - 7);
            ctx.closePath();
            ctx.fill();
        }
    }


    // ------------------------------------------
    // TEGN FORVENTET BANE
    // ------------------------------------------

    function tegnBane(v0, d, U, yTopp) {

        ctx.beginPath();

        ctx.setLineDash([4, 5]);

        ctx.strokeStyle = "#93c5fd";
        ctx.lineWidth = 1.5;

        let startet = false;

        for (let x = startX; x <= W - 10; x += 2) {

            const y = elektronPosisjon(x, v0, d, U);

            // Stopp banen dersom elektronet treffer platen
            if (
                x >= plateStartX &&
                x <= plateSluttX &&
                y <= yTopp
            ) {
                break;
            }

            if (!startet) {
                ctx.moveTo(x, y);
                startet = true;
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.stroke();

        ctx.setLineDash([]);
    }


    // ------------------------------------------
    // TEGN ELEKTRONET
    // ------------------------------------------

    function tegnElektron(x, y) {

        ctx.beginPath();

        ctx.arc(x, y, 6, 0, 2 * Math.PI);

        ctx.fillStyle = "#2563eb";
        ctx.fill();

        // Minus-tegn i elektronet
        ctx.fillStyle = "white";
        ctx.font = "bold 11px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillText("−", x, y);

        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
    }


    // ------------------------------------------
    // TEGN ALT
    // ------------------------------------------

    function draw() {

        ctx.clearRect(0, 0, W, H);

        const { v0, d, U } = hentVerdier();

        fartVerdi.textContent =
            Number(fartSlider.value).toLocaleString("nb-NO");

        avstandVerdi.textContent =
            Number(avstandSlider.value).toLocaleString("nb-NO");

        spenningVerdi.textContent =
            Number(spenningSlider.value).toLocaleString("nb-NO");

        const { yTopp, yBunn } = tegnPlater(d);

        tegnFelt(yTopp, yBunn);

        tegnBane(v0, d, U, yTopp);

        const y = elektronPosisjon(elektronX, v0, d, U);

        tegnElektron(elektronX, y);
    }


    // ------------------------------------------
    // ANIMER ELEKTRONET
    // ------------------------------------------

    function animer(tid) {

        if (!animerer) return;

        if (startTid === null) {
            startTid = tid;
        }

        const forløptTid = tid - startTid;

        const fremdrift = Math.min(
            forløptTid / animasjonsVarighet,
            1
        );

        elektronX =
            startX + fremdrift * (W - startX - 10);

        const { v0, d, U } = hentVerdier();

        const y = elektronPosisjon(elektronX, v0, d, U);

        const yTopp =
            midtY - (d * pxPerMeter) / 2;

        // Stopp ved kollisjon med øvre plate
 if (
    elektronX >= plateStartX &&
    elektronX <= plateSluttX &&
    y <= yTopp
) {
    // Beregn hvor elektronet treffer øvre plate
    const E = U / d;
    const a = e * E / m;

    // Elektronet starter midt mellom platene.
    // Avstanden opp til øvre plate er d/2.
    const kollisjonTid = Math.sqrt(d / a);

    const kollisjonAvstand = v0 * kollisjonTid;

    elektronX =
        plateStartX +
        kollisjonAvstand * pxPerMeter;

    animerer = false;

    draw();
    return;
}

        draw();

        if (fremdrift < 1) {
            animasjonsId = requestAnimationFrame(animer);
        } else {
            animerer = false;
        }
    }


    // ------------------------------------------
    // SKYT ELEKTRON
    // ------------------------------------------

    function skytElektron() {

        // Stopp eventuell tidligere animasjon
        if (animasjonsId !== null) {
            cancelAnimationFrame(animasjonsId);
        }

        elektronX = startX;

        startTid = null;
        animerer = true;

        animasjonsId = requestAnimationFrame(animer);
    }


    // ------------------------------------------
    // GLIDEBRYTERE
    // ------------------------------------------

    function oppdater() {

        // Stopp animasjonen ved endring
        animerer = false;

        if (animasjonsId !== null) {
            cancelAnimationFrame(animasjonsId);
        }

        elektronX = startX;

        draw();
    }

    fartSlider.addEventListener("input", oppdater);
    avstandSlider.addEventListener("input", oppdater);
    spenningSlider.addEventListener("input", oppdater);

    skytKnapp.addEventListener("click", skytElektron);

    // Vis elektronet i startposisjonen
    draw();

})();