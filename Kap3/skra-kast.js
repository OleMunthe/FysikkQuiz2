(() => {
    const root = document.getElementById("skra-kast");
    if (!root) return;

    const canvas = root.querySelector("#kastCanvas");
    const ctx = canvas.getContext("2d");
    const overlay = document.getElementById("kastOverlay");

// Flytt overlayet direkte til body
document.body.appendChild(overlay);

const overlayCtx = overlay.getContext("2d");

const speedSlider = root.querySelector("#kastSpeed");
const angleSlider = root.querySelector("#kastAngle");
const heightSlider = root.querySelector("#kastHeight");

const speedValue = root.querySelector("#kastSpeedValue");
const angleValue = root.querySelector("#kastAngleValue");
const heightValue = root.querySelector("#kastHeightValue");

    const timeDisplay = root.querySelector("#kastTime");
    const velocityDisplay = root.querySelector("#kastVelocity");
    const altitudeDisplay = root.querySelector("#kastAltitude");

    const startButton = root.querySelector("#kastStart");
    const pauseButton = root.querySelector("#kastPause");
    const resetButton = root.querySelector("#kastReset");

    // Fysiske konstanter
    const G = 6.67430e-11;
    const M = 5.972e24;
    const R = 6371000;
    const mu = G * M;

    // Canvas
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const scale = 1 / 30000;

    // Simulering
    const dt = 0.5;
    const stepsPerFrame = 80;

    let x, y, vx, vy;
    let time = 0;
    let running = false;
    let trajectory = [];

    // Jordbilde
    const earthImage = new Image();
    earthImage.src = "Jorda.png";

    earthImage.onload = () => draw();

    function acceleration(px, py) {
        const r = Math.hypot(px, py);
        const factor = -mu / (r * r * r);

        return {
            ax: factor * px,
            ay: factor * py
        };
    }

    // Tilpass overlayet til hele nettsiden
function resizeOverlay() {
    const dpr = window.devicePixelRatio || 1;

    overlay.width = Math.round(window.innerWidth * dpr);
    overlay.height = Math.round(window.innerHeight * dpr);

    overlay.style.width = window.innerWidth + "px";
    overlay.style.height = window.innerHeight + "px";

    overlayCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

// Finn posisjonen til et punkt på nettsiden
function toPageCoordinates(px, py) {
    const rect = canvas.getBoundingClientRect();

    return {
        x: rect.left + px * (rect.width / canvas.width),
        y: rect.top + py * (rect.height / canvas.height)
    };
}

    function resetSimulation() {
        running = false;

        // Starthøyde i meter
        const startHeight = Number(heightSlider.value) * 1000;

        // Start over jordoverflaten
        x = 0;
        y = -(R + startHeight);

        const speed = Number(speedSlider.value);
        const angle = Number(angleSlider.value) * Math.PI / 180;

        // 0 grader = horisontalt mot høyre
        // 90 grader = rett opp
        vx = speed * Math.cos(angle);
        vy = -speed * Math.sin(angle);

        time = 0;
        trajectory = [{ x, y }];

        updateInfo();
        draw();
        drawOverlay();
    }

    function updatePhysics() {
        const a1 = acceleration(x, y);

        const newX = x + vx * dt + 0.5 * a1.ax * dt * dt;
        const newY = y + vy * dt + 0.5 * a1.ay * dt * dt;

        const a2 = acceleration(newX, newY);

        vx += 0.5 * (a1.ax + a2.ax) * dt;
        vy += 0.5 * (a1.ay + a2.ay) * dt;

        x = newX;
        y = newY;

        time += dt;

        trajectory.push({ x, y });

        // Treff med jordoverflaten
        if (Math.hypot(x, y) <= R) {
            running = false;
        }

        // Begrens antall punkter
        if (trajectory.length > 10000) {
            trajectory.shift();
        }
    }

    // Bilde av kanonkulen
const cannonballImage = new Image();
cannonballImage.src = "kanonkule.png";

cannonballImage.onload = () => drawOverlay();

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const earthRadius = R * scale;

        // Jorda
        if (earthImage.complete && earthImage.naturalWidth > 0) {
            ctx.drawImage(
                earthImage,
                cx - earthRadius,
                cy - earthRadius,
                earthRadius * 2,
                earthRadius * 2
            );
        } else {
            ctx.beginPath();
            ctx.arc(cx, cy, earthRadius, 0, 2 * Math.PI);
            ctx.fillStyle = "#2563eb";
            ctx.fill();
        }

       
// Tegn pil som viser utskytningsretningen
if (time === 0) {

    const angle = Number(angleSlider.value) * Math.PI / 180;

    // Startpunkt ved valgt starthøyde
    const startX = cx;
    const startY = cy - (R + Number(heightSlider.value) * 1000) * scale;

    // Pilens lengde
    const length = 80;

    // Endepunkt
    const endX = startX + length * Math.cos(angle);
    const endY = startY - length * Math.sin(angle);

    // Tegn pil
    ctx.save();

    ctx.strokeStyle = "#ff0000";
    ctx.fillStyle = "#ff0000";
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Pilspiss
    const direction = Math.atan2(endY - startY, endX - startX);
    const headLength = 15;

    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
        endX - headLength * Math.cos(direction - Math.PI / 6),
        endY - headLength * Math.sin(direction - Math.PI / 6)
    );
    ctx.lineTo(
        endX - headLength * Math.cos(direction + Math.PI / 6),
        endY - headLength * Math.sin(direction + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

 
}

function drawOverlay() {

    overlayCtx.clearRect(
        0,
        0,
        window.innerWidth,
        window.innerHeight
    );

    // Tegn den røde banen
    if (trajectory.length > 1) {

        overlayCtx.beginPath();

        trajectory.forEach((point, index) => {

            const px = cx + point.x * scale;
            const py = cy + point.y * scale;

            const pos = toPageCoordinates(px, py);

            if (index === 0) {
                overlayCtx.moveTo(pos.x, pos.y);
            } else {
                overlayCtx.lineTo(pos.x, pos.y);
            }
        });

        overlayCtx.strokeStyle = "#ef4444";
        overlayCtx.lineWidth = 2;
        overlayCtx.stroke();
    }

    // Tegn kanonkulen
    const ballX = cx + x * scale;
    const ballY = cy + y * scale;

    const pos = toPageCoordinates(ballX, ballY);

    const ballSize = 16;

    if (
        cannonballImage.complete &&
        cannonballImage.naturalWidth > 0
    ) {

        overlayCtx.drawImage(
            cannonballImage,
            pos.x - ballSize / 2,
            pos.y - ballSize / 2,
            ballSize,
            ballSize
        );

    } else {

        overlayCtx.beginPath();
        overlayCtx.arc(
            pos.x,
            pos.y,
            5,
            0,
            2 * Math.PI
        );

        overlayCtx.fillStyle = "#facc15";
        overlayCtx.fill();
    }


}


    function updateInfo() {
        const velocity = Math.hypot(vx, vy);
        const altitude = Math.max(0, Math.hypot(x, y) - R);

        timeDisplay.textContent = time.toFixed(0);
        velocityDisplay.textContent = velocity.toFixed(0);
        altitudeDisplay.textContent = (altitude / 1000).toFixed(1);
    }

function animate() {

    if (running) {

        for (let i = 0; i < stepsPerFrame; i++) {
            if (!running) break;

            updatePhysics();
        }

        updateInfo();
        draw();
    }

    drawOverlay();

    requestAnimationFrame(animate);
}

    startButton.addEventListener("click", () => {
        running = true;
    });

    pauseButton.addEventListener("click", () => {
        running = false;
    });

    resetButton.addEventListener("click", resetSimulation);

    speedSlider.addEventListener("input", () => {
        speedValue.textContent = speedSlider.value;
        resetSimulation();
    });

    angleSlider.addEventListener("input", () => {
        angleValue.textContent = angleSlider.value;
        resetSimulation();
    });

    heightSlider.addEventListener("input", () => {
    heightValue.textContent = heightSlider.value;
    resetSimulation();
});

window.addEventListener("scroll", () => {
    drawOverlay();
});


resizeOverlay();

window.addEventListener("resize", () => {
    resizeOverlay();
    drawOverlay();
});

resetSimulation();
animate();

})();