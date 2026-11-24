(() => {

    const root = document.getElementById("sirkel-simulering");
    if (!root) return;

    const canvas = root.querySelector("#sirkelCanvas");
    const ctx = canvas.getContext("2d");

const vSlider = root.querySelector("#sirkelV");
const vVerdi = root.querySelector("#sirkelVVerdi");
    const startButton = root.querySelector("#sirkelStart");


    const aksDisplay = root.querySelector("#sirkelAks");
    const rundetidDisplay = root.querySelector("#sirkelRundetid");

    // Tegneområde
    const W = canvas.width;
    const H = canvas.height;

    // Sentrum
    const cx = 190;
    const cy = 150;

    // Fast radius i meter
    const radius = 1;

    // Radius i piksler
    const R = 110;

    // Skalering av vektorpiler
    const fartSkala = 15;
    const aksSkala = 15;

    let theta = 0;
    let lastTime = null;
    let running = false;

    // Tegn pil
    function drawArrow(x1, y1, x2, y2, color) {

        const headLength = 13;

        const angle = Math.atan2(
            y2 - y1,
            x2 - x1
        );

        ctx.save();

        ctx.strokeStyle = color;
        ctx.fillStyle = color;

        ctx.lineWidth = 3;
        ctx.lineCap = "butt";

        // Pilestrek
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Pilspiss
        ctx.beginPath();
        ctx.moveTo(
    x2 + 3 * Math.cos(angle),
    y2 + 3 * Math.sin(angle)
);

        ctx.lineTo(
            x2 - headLength * Math.cos(angle - Math.PI / 6),
            y2 - headLength * Math.sin(angle - Math.PI / 6)
        );

        ctx.lineTo(
            x2 - headLength * Math.cos(angle + Math.PI / 6),
            y2 - headLength * Math.sin(angle + Math.PI / 6)
        );

        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    function draw() {

        ctx.clearRect(0, 0, W, H);

// Fart fra glidebryteren
const v = Number(vSlider.value);

// Vinkelhastighet
const omega = v / radius;

// Sentripetalakselerasjon
const a = v * v / radius;

// Rundetid
const T = 2 * Math.PI * radius / v;

// Oppdater verdier
vVerdi.textContent = v.toFixed(1);
aksDisplay.textContent = a.toFixed(2);
rundetidDisplay.textContent = T.toFixed(2);

        // Sirkelbane
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, 2 * Math.PI);

        ctx.strokeStyle = "rgba(100, 116, 139, 0.6)";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Sentrum
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, 2 * Math.PI);

        ctx.fillStyle = "#475569";
        ctx.fill();

        // Kulens posisjon
        const x = cx + R * Math.cos(theta);
        const y = cy - R * Math.sin(theta);

        // Fartsvektor (tangentielt)
        const vx = -Math.sin(theta);
        const vy = -Math.cos(theta);

        // Akselerasjonsvektor (mot sentrum)
        const ax = -Math.cos(theta);
        const ay = Math.sin(theta);

        // Pilelengder
        const vLength = 30 * Math.sqrt(v);
        const aLength = 30 * Math.sqrt(a);

                // Kule
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, 2 * Math.PI);

        ctx.fillStyle = "#2563eb";
        ctx.fill();

        ctx.strokeStyle = "#1e3a8a";
        ctx.lineWidth = 2;
        ctx.stroke();


        // Fartsvektor – grønn
        drawArrow(
            x,
            y,
            x + vx * vLength,
            y + vy * vLength,
            "#16a34a"
        );

        // Akselerasjonsvektor – rød
        drawArrow(
            x,
            y,
            x + ax * aLength,
            y + ay * aLength,
            "#dc2626"
        );


    }

  function animate(timestamp) {

    if (running) {

        if (lastTime === null) {
            lastTime = timestamp;
        }

        const dt = Math.min(
            (timestamp - lastTime) / 1000,
            0.05
        );

        lastTime = timestamp;

        const v = Number(vSlider.value);
const omega = v / radius;

        // Bevegelse mot klokka
        theta += omega * dt;

        draw();

    } else {

        // Hindrer tidshopp når simuleringen starter igjen
        lastTime = null;
    }

    requestAnimationFrame(animate);
}

    // Glidebryter
   vSlider.addEventListener("input", draw);

    // Start og pause
startButton.addEventListener("click", () => {

    running = !running;

    if (running) {
        startButton.textContent = "Pause";
    } else {
        startButton.textContent = "Start";
    }

});


    // Start simuleringen
    draw();
    requestAnimationFrame(animate);

})();