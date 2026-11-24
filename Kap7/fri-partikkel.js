(() => {

    const simuleringer = document.querySelectorAll(
        ".fri-partikkel-simulering"
    );

    simuleringer.forEach((root) => {

        const fullVersjon = root.dataset.versjon === "full";

        const canvas = root.querySelector(".fri-canvas");
        const ctx = canvas.getContext("2d");

        // Ekstra graf for kvadratet av bølgefunksjonen
const sannsynlighetCanvas = root.querySelector(
    ".fri-sannsynlighet-canvas"
);

const ctx2 = sannsynlighetCanvas
    ? sannsynlighetCanvas.getContext("2d")
    : null;

        const lambdaSlider = root.querySelector(".fri-lambda");

        // Finnes bare i den fullstendige versjonen
        const alphaSlider = root.querySelector(".fri-alpha");

        const lambdaVerdi = root.querySelector(".fri-lambda-verdi");
        const deltaXVerdi = root.querySelector(".fri-deltax-verdi");

        const frekvensVerdi = root.querySelector(".fri-frekvens-verdi");
        const deltaPVerdi = root.querySelector(".fri-deltap-verdi");

        // Dobbel oppløsning for skarp grafikk
        const scale = 2;

        const W = canvas.width / scale;
        const H = canvas.height / scale;

        ctx.scale(scale, scale);

        if (ctx2) {
    ctx2.scale(scale, scale);
}

        const cx = W / 2;
        const cy = 95;

        const amplitude = 65;

        const c = 299792458;
        const hbar = 1.054571817e-34;

        // Fast spredning i den første simuleringen
        const fastAlpha = 90000;


        // ----------------------------------------------
        // FARGE SOM FUNKSJON AV BØLGELENGDE
        // ----------------------------------------------

        function wavelengthToColor(lambda) {

            const colors = [
                [400, [138, 43, 226]],
                [450, [70, 70, 255]],
                [500, [0, 200, 180]],
                [550, [50, 200, 0]],
                [580, [255, 220, 0]],
                [610, [255, 120, 0]],
                [700, [220, 0, 0]]
            ];

            for (let i = 0; i < colors.length - 1; i++) {

                const [l1, c1] = colors[i];
                const [l2, c2] = colors[i + 1];

                if (lambda >= l1 && lambda <= l2) {

                    const t = (lambda - l1) / (l2 - l1);

                    const rgb = c1.map((v, j) =>
                        Math.round(v + t * (c2[j] - v))
                    );

                    return `rgb(${rgb.join(",")})`;
                }
            }

            return "#2563eb";
        }


        // ----------------------------------------------
        // PILER TIL KOORDINATSYSTEMET
        // ----------------------------------------------

        function drawArrow(x1, y1, x2, y2) {

            const angle = Math.atan2(y2 - y1, x2 - x1);
            const head = 5;

            ctx.beginPath();

            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);

            ctx.strokeStyle = "#475569";
            ctx.lineWidth = 1;

            ctx.stroke();

            ctx.beginPath();

            ctx.moveTo(x2, y2);

            ctx.lineTo(
                x2 - head * Math.cos(angle - Math.PI / 6),
                y2 - head * Math.sin(angle - Math.PI / 6)
            );

            ctx.lineTo(
                x2 - head * Math.cos(angle + Math.PI / 6),
                y2 - head * Math.sin(angle + Math.PI / 6)
            );

            ctx.closePath();

            ctx.fillStyle = "#475569";
            ctx.fill();
        }


        // ----------------------------------------------
        // VITENSKAPELIG NOTASJON
        // ----------------------------------------------

        function tilMathJaxTall(verdi) {

            const eksponent = Math.floor(Math.log10(verdi));

            const mantisse =
                verdi / Math.pow(10, eksponent);

            return (
                mantisse.toFixed(2).replace(".", "\\text{,}") +
                ` \\cdot 10^{${eksponent}}`
            );
        }


        // ----------------------------------------------
        // MATHJAX
        // ----------------------------------------------

        let mathJaxKjede = Promise.resolve();

        function oppdaterMathJax() {

            if (!window.MathJax?.typesetPromise) {
                return;
            }

            const elementer = [];

            if (frekvensVerdi) {
                elementer.push(frekvensVerdi);
            }

            if (deltaPVerdi) {
                elementer.push(deltaPVerdi);
            }

            mathJaxKjede = mathJaxKjede
                .catch(() => {})
                .then(() => {

                    if (window.MathJax.typesetClear) {
                        window.MathJax.typesetClear(elementer);
                    }

                    return window.MathJax.typesetPromise(elementer);
                });
        }

        // ----------------------------------------------
// TEGN KVADRATET AV BØLGEFUNKSJONEN
// ----------------------------------------------

function tegnSannsynlighet(lambda, alpha) {

    if (!ctx2) return;

    const W2 = sannsynlighetCanvas.width / scale;
    const H2 = sannsynlighetCanvas.height / scale;

    ctx2.clearRect(0, 0, W2, H2);

    const cx2 = W2 / 2;

    const grunnlinje = H2 - 22;

    const amplitude2 = 85;

    const pxPerNm = 0.12;

    const lambdaPx = lambda * pxPerNm;
    const deltaXPx = Math.sqrt(alpha) * pxPerNm;

    // x-akse
    ctx2.beginPath();

    ctx2.moveTo(15, grunnlinje);
    ctx2.lineTo(W2 - 10, grunnlinje);

    ctx2.strokeStyle = "#475569";
    ctx2.lineWidth = 1;

    ctx2.stroke();

    // y-akse
    ctx2.beginPath();

    ctx2.moveTo(cx2, grunnlinje);
    ctx2.lineTo(cx2, 10);

    ctx2.stroke();

    // Aksetekster
    ctx2.fillStyle = "#334155";
    ctx2.font = "11px Arial";

    ctx2.fillText("|Ψ(x)|²", cx2 + 6, 15);
    ctx2.fillText("x", W2 - 15, grunnlinje - 6);

    // Kvadratet av bølgefunksjonen
    ctx2.beginPath();

    for (let x = 0; x <= W2; x++) {

        const dx = x - cx2;

        const envelope = Math.exp(
            -(dx * dx) / (4 * deltaXPx * deltaXPx)
        );

        const psi =
            envelope *
            Math.cos(2 * Math.PI * dx / lambdaPx);

        const psi2 = psi * psi;

        const y = grunnlinje - amplitude2 * psi2;

        if (x === 0) {
            ctx2.moveTo(x, y);
        } else {
            ctx2.lineTo(x, y);
        }
    }

    ctx2.strokeStyle = wavelengthToColor(lambda);
    ctx2.lineWidth = 3.5;

    ctx2.stroke();
}


// ----------------------------------------------
// MARKERING AV ÉN BØLGELENGDE
// ----------------------------------------------

function tegnBølgelengde(lambdaPx) {

    // Bare i den øverste simuleringen
    if (fullVersjon) return;

    const x1 = cx - lambdaPx / 2;
    const x2 = cx + lambdaPx / 2;

    // Plassering over bølgen
    const y = 15;

    ctx.strokeStyle = "#475569";
    ctx.fillStyle = "#475569";
    ctx.lineWidth = 1.2;

    // Horisontal strek
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.stroke();

    // Pil som peker mot venstre
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x1 + 6, y - 4);
    ctx.lineTo(x1 + 6, y + 4);
    ctx.closePath();
    ctx.fill();

    // Pil som peker mot høyre
    ctx.beginPath();
    ctx.moveTo(x2, y);
    ctx.lineTo(x2 - 6, y - 4);
    ctx.lineTo(x2 - 6, y + 4);
    ctx.closePath();
    ctx.fill();

    // Lambda over markeringen
    ctx.font = "italic 14px Georgia";
    ctx.textAlign = "center";
    ctx.fillText("λ", cx, y - 3);
    ctx.textAlign = "left";
}

        // ----------------------------------------------
        // TEGN SIMULERINGEN
        // ----------------------------------------------

        function draw() {

            ctx.clearRect(0, 0, W, H);

            const lambda = Number(lambdaSlider.value);

            // Hvis spredningsglideren mangler,
            // bruker vi en fast verdi.
            const alpha = alphaSlider
                ? Number(alphaSlider.value)
                : fastAlpha;

            const deltaX = Math.sqrt(alpha);

            const pxPerNm = 0.12;

            const lambdaPx = lambda * pxPerNm;
            const deltaXPx = deltaX * pxPerNm;


            // ------------------------------------------
            // BØLGELENGDE
            // ------------------------------------------

            if (lambdaVerdi) {
                lambdaVerdi.textContent = lambda;
            }


            // ------------------------------------------
            // POSISJONSUSIKKERHET
            // ------------------------------------------

            if (deltaXVerdi) {
                deltaXVerdi.textContent = deltaX.toFixed(0);
            }


            // ------------------------------------------
            // FREKVENS
            // ------------------------------------------

            const lambdaMeter = lambda * 1e-9;

            const frekvens = c / lambdaMeter;

            if (frekvensVerdi) {

                frekvensVerdi.textContent =
                    `\\(f = ${tilMathJaxTall(frekvens)}\\,\\mathrm{Hz}\\)`;
            }


            // ------------------------------------------
            // USKARPHET I BEVEGELSESMENGDE
            // Bare i fullstendig versjon
            // ------------------------------------------

            if (fullVersjon && deltaPVerdi) {

                const deltaXMeter = deltaX * 1e-9;

                const deltaP = hbar / (2 * deltaXMeter);

                deltaPVerdi.textContent =
                    `\\(\\Delta p = ${tilMathJaxTall(deltaP)}\\,\\mathrm{kg\\,m/s}\\)`;
            }


            // ------------------------------------------
            // KOORDINATSYSTEM
            // Bare i fullstendig versjon
            // ------------------------------------------

            if (fullVersjon) {

                // x-akse
                drawArrow(15, cy, W - 10, cy);

                // Forkortet y-akse
                const yStart = cy + (H - 15 - cy) / 2;

                drawArrow(cx, yStart, cx, 10);

                ctx.fillStyle = "#334155";
                ctx.font = "10px Arial";

                ctx.fillText("x", W - 15, cy - 5);
                ctx.fillText("Ψ(x)", cx + 5, 15);
            }


            // ------------------------------------------
            // BØLGEPAKKEN
            // ------------------------------------------

            ctx.beginPath();

            for (let x = 0; x <= W; x++) {

                const dx = x - cx;

                const envelope = Math.exp(
                    -(dx * dx) / (4 * deltaXPx * deltaXPx)
                );

                const psi =
                    amplitude *
                    envelope *
                    Math.cos(2 * Math.PI * dx / lambdaPx);

                const y = cy - psi;

                if (x === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }

            ctx.strokeStyle = wavelengthToColor(lambda);

            // Tykkere bølgekurve i begge simuleringene
            ctx.lineWidth = 3.5;

            ctx.stroke();

            // Vis bølgelengden over den øverste grafen
tegnBølgelengde(lambdaPx);


            // ------------------------------------------
            // MARKERING AV 2Δx
            // Bare i fullstendig versjon
            // ------------------------------------------

            if (fullVersjon) {

                const x1 = cx - deltaXPx;
                const x2 = cx + deltaXPx;

                const markerY = 158;

                ctx.setLineDash([3, 3]);

                ctx.strokeStyle = "#94a3b8";
                ctx.lineWidth = 1;

                ctx.beginPath();

                ctx.moveTo(x1, cy);
                ctx.lineTo(x1, markerY);

                ctx.moveTo(x2, cy);
                ctx.lineTo(x2, markerY);

                ctx.stroke();

                ctx.setLineDash([]);

                ctx.beginPath();

                ctx.moveTo(x1, markerY);
                ctx.lineTo(x2, markerY);

                ctx.strokeStyle = "#475569";
                ctx.stroke();

                ctx.beginPath();

                ctx.moveTo(x1, markerY - 4);
                ctx.lineTo(x1, markerY + 4);

                ctx.moveTo(x2, markerY - 4);
                ctx.lineTo(x2, markerY + 4);

                ctx.stroke();

                ctx.fillStyle = "#334155";
                ctx.font = "10px Arial";
                ctx.textAlign = "center";

                ctx.fillText("2Δx", cx, markerY - 5);

                ctx.textAlign = "left";
            }

            // Tegn den ekstra grafen hvis den finnes
tegnSannsynlighet(lambda, alpha);

            oppdaterMathJax();
        }


        // ----------------------------------------------
        // GLIDEBRYTERE
        // ----------------------------------------------

        lambdaSlider.addEventListener("input", draw);

        // Koble bare til spredningsglideren
        // hvis den finnes i denne simuleringen.
        if (alphaSlider) {
            alphaSlider.addEventListener("input", draw);
        }


        // ----------------------------------------------
        // TEGN VED OPPSTART
        // ----------------------------------------------

        draw();

    });

})();