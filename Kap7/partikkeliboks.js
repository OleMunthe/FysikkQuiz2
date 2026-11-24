(() => {

    const root = document.getElementById("partikkeliboks-simulering");
    if (!root) return;

    const canvas = root.querySelector("#boksCanvas");
    const ctx = canvas.getContext("2d");

    const nSlider = root.querySelector("#boksN");
    const nVerdi = root.querySelector("#boksNVerdi");
    const energiDisplay = root.querySelector("#boksEnergi");

const scale = 2;

const W = canvas.width / scale;
const H = canvas.height / scale;

ctx.scale(scale, scale);

const left = 45;
const right = W - 20;
const plotWidth = right - left;

const psiMid = 80;
const probBase = 235;

const psiScale = 45;
const probScale = 50;

    function drawCurve(fn, color, lineWidth = 2.5) {

        ctx.beginPath();

        for (let i = 0; i <= 500; i++) {

            const u = i / 500;

            const x = left + u * plotWidth;
            const y = fn(u);

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
    }

    function drawText(text, x, y, color = "#334155", size = 12) {

        ctx.fillStyle = color;
        ctx.font = `${size}px Arial`;
        ctx.fillText(text, x, y);
    }

    function draw() {

        ctx.clearRect(0, 0, W, H);

        const n = Number(nSlider.value);

        nVerdi.textContent = n;
energiDisplay.textContent = `\\(E_{${n}} = ${n * n}E_1\\)`;

if (window.MathJax?.typesetPromise) {
    MathJax.typesetClear([energiDisplay]);
    MathJax.typesetPromise([energiDisplay]);
}

        // -------------------------
        // Øverste graf: Psi(x)
        // -------------------------

        drawText("Bølgefunksjon Ψ(x)", left, 20, "#2563eb", 10);

        // Nullinje
        ctx.beginPath();
        ctx.moveTo(left, psiMid);
        ctx.lineTo(right, psiMid);
        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Uendelige potensialvegger
        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 3;

        ctx.beginPath();
ctx.moveTo(left, 30);
ctx.lineTo(left, 130);

ctx.moveTo(right, 30);
ctx.lineTo(right, 130);
        ctx.stroke();

        // Bølgefunksjon
        drawCurve(
            u => psiMid - psiScale * Math.sin(n * Math.PI * u),
            "#2563eb"
        );

        // -------------------------
        // Nederste graf: |Psi|²
        // -------------------------

        drawText("Sannsynlighetstetthet |Ψ(x)|²", left, 155, "#dc2626", 10);

        // Grunnlinje
        ctx.beginPath();
        ctx.moveTo(left, probBase);
        ctx.lineTo(right, probBase);
        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Uendelige potensialvegger
        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 3;

        ctx.beginPath();
ctx.moveTo(left, 175);
ctx.lineTo(left, probBase);

ctx.moveTo(right, 175);
ctx.lineTo(right, probBase);
        ctx.stroke();

        // Sannsynlighetstetthet
        drawCurve(
            u => {
                const psi = Math.sin(n * Math.PI * u);
                return probBase - probScale * psi * psi;
            },
            "#dc2626"
        );

        // x-akse
drawText("0", left - 5, 255);
drawText("L", right - 5, 255);

    }

    nSlider.addEventListener("input", draw);

    draw();

})();