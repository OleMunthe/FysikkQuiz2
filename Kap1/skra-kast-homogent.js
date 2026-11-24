(() => {

    const root = document.getElementById("skra-kast");
    if (!root) return;

    const canvas = root.querySelector("#kastCanvas");
    const ctx = canvas.getContext("2d");

    // Bilde av kanonkula
const cannonballImage = new Image();
cannonballImage.src = "kanonkule.png";

cannonballImage.onload = () => draw();

    const heightSlider = root.querySelector("#kastHeight");
    const speedSlider = root.querySelector("#kastSpeed");
    const angleSlider = root.querySelector("#kastAngle");

    const heightValue = root.querySelector("#kastHeightValue");
    const speedValue = root.querySelector("#kastSpeedValue");
    const angleValue = root.querySelector("#kastAngleValue");

    const timeDisplay = root.querySelector("#kastTime");
    const velocityDisplay = root.querySelector("#kastVelocity");
    const altitudeDisplay = root.querySelector("#kastAltitude");
    const distanceDisplay = root.querySelector("#kastDistance");

    const startButton = root.querySelector("#kastStart");
    const resetButton = root.querySelector("#kastReset");

    // Fysiske konstanter
    const g = 9.81;

    // Tegneområde
    const W = canvas.width;
    const H = canvas.height;

    const marginLeft = 70;
    const groundY = H - 50;

    // Antall piksler per meter
    const scale = 160;

    // Tidsintervall mellom prikkene
    const dotInterval = 0.1;

    // Simulering
    let x, y, vx, vy;
    let time = 0;
    let running = false;

    let dots = [];
    let nextDotTime = dotInterval;

    let lastTimestamp = null;

    function resetSimulation() {

        running = false;
        lastTimestamp = null;

        x = 0;
        y = Number(heightSlider.value);

        const speed = Number(speedSlider.value);
        const angle =
            Number(angleSlider.value) * Math.PI / 180;

        vx = speed * Math.cos(angle);
        vy = speed * Math.sin(angle);

        time = 0;

        dots = [{ x, y }];
        nextDotTime = dotInterval;

        updateInfo();
        draw();
    }

    function updatePhysics(dt) {

        // Bevegelse med konstant akselerasjon
        const newX = x + vx * dt;
        const newY = y + vy * dt - 0.5 * g * dt * dt;
        const newVy = vy - g * dt;

        x = newX;
        y = newY;
        vy = newVy;

        time += dt;

        // Registrer prikker
        while (time >= nextDotTime) {

            const t = nextDotTime;

            const speed = Number(speedSlider.value);
            const angle =
                Number(angleSlider.value) * Math.PI / 180;

            const vx0 = speed * Math.cos(angle);
            const vy0 = speed * Math.sin(angle);
            const y0 = Number(heightSlider.value);

            const dotX = vx0 * t;
            const dotY = y0 + vy0 * t - 0.5 * g * t * t;

            if (dotY >= 0) {
                dots.push({ x: dotX, y: dotY });
            }

            nextDotTime += dotInterval;
        }

        // Treff med bakken
        if (y <= 0) {
            y = 0;
            running = false;
        }
    }

    function toCanvas(px, py) {
        return {
            x: marginLeft + px * scale,
            y: groundY - py * scale
        };
    }

    function draw() {

        ctx.clearRect(0, 0, W, H);

        // Rutenett med 0,5 meter mellom linjene
const gridStep = 0.25 * scale;

ctx.save();

ctx.strokeStyle = "rgba(100, 116, 139, 0.20)";
ctx.lineWidth = 1;

// Vertikale linjer
for (let gx = marginLeft; gx <= W; gx += gridStep) {
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, groundY);
    ctx.stroke();
}

// Horisontale linjer
for (let gy = groundY; gy >= 0; gy -= gridStep) {
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(W, gy);
    ctx.stroke();
}

ctx.restore();

        // Bakken
        ctx.beginPath();
        ctx.moveTo(0, groundY);
        ctx.lineTo(W, groundY);
        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 3;
        ctx.stroke();

        // Høydemarkeringer
        ctx.font = "14px Arial";
        ctx.fillStyle = "#475569";

        for (let h = 0.5; h <= 3; h += 0.5) {

            const py = groundY - h * scale;

            ctx.beginPath();
            ctx.moveTo(marginLeft - 8, py);
            ctx.lineTo(marginLeft + 8, py);
            ctx.strokeStyle = "#94a3b8";
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.fillText(
                h.toFixed(1) + " m",
                10,
                py + 5
            );
        }

        // Prikker
        ctx.fillStyle = "#ef4444";

        dots.forEach(dot => {

            const pos = toCanvas(dot.x, dot.y);

            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 4, 0, 2 * Math.PI);
            ctx.fill();

        });

// Tegn kanonkula
const pos = toCanvas(x, y);

const ballSize = 32;

if (cannonballImage.complete && cannonballImage.naturalWidth > 0) {

    ctx.drawImage(
        cannonballImage,
        pos.x - ballSize / 2,
        pos.y - ballSize / 2,
        ballSize,
        ballSize
    );

} else {

    // Reserveball dersom bildet ikke er lastet inn
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 9, 0, 2 * Math.PI);
    ctx.fillStyle = "#2563eb";
    ctx.fill();
}

 // Startfartspil
if (time === 0) {

    // Hent verdiene fra glidebryterne
    const v0 = Number(speedSlider.value);
    const y0 = Number(heightSlider.value);
    const angle = Number(angleSlider.value) * Math.PI / 180;

    if (v0 > 0) {

        const startPos = toCanvas(0, y0);

        // Pilelengden er proporsjonal med startfarten
        const arrowLength = v0 * 25;

        const endX = startPos.x + arrowLength * Math.cos(angle);
        const endY = startPos.y - arrowLength * Math.sin(angle);

        const arrowHeadLength = 10;

        ctx.save();

        ctx.strokeStyle = "#16a34a";
        ctx.fillStyle = "#16a34a";
        ctx.lineWidth = 3;

        // Selve pila
        ctx.beginPath();
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Pilspiss
        const arrowAngle = Math.atan2(
            endY - startPos.y,
            endX - startPos.x
        );

        ctx.beginPath();
        ctx.moveTo(endX, endY);

        ctx.lineTo(
            endX - arrowHeadLength * Math.cos(arrowAngle - Math.PI / 6),
            endY - arrowHeadLength * Math.sin(arrowAngle - Math.PI / 6)
        );

        ctx.lineTo(
            endX - arrowHeadLength * Math.cos(arrowAngle + Math.PI / 6),
            endY - arrowHeadLength * Math.sin(arrowAngle + Math.PI / 6)
        );

        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }
}
    }

 function updateInfo() {

    const velocity = Math.hypot(vx, vy);

    timeDisplay.textContent = time.toFixed(2);
    velocityDisplay.textContent = velocity.toFixed(2);
    altitudeDisplay.textContent = y.toFixed(2);
    distanceDisplay.textContent = x.toFixed(2);
}

    function animate(timestamp) {

        if (running) {

            if (lastTimestamp === null) {
                lastTimestamp = timestamp;
            }

            let dt = (timestamp - lastTimestamp) / 1000;

            lastTimestamp = timestamp;

            // Unngå store tidshopp
            dt = Math.min(dt, 0.03);

            updatePhysics(dt);
            updateInfo();
            draw();

        } else {

            lastTimestamp = null;
        }

        requestAnimationFrame(animate);
    }

    // Knapper
    startButton.addEventListener("click", () => {
        if (y > 0 || (time === 0 && vy > 0)) {
            running = true;
        }
    });

    

    resetButton.addEventListener("click", resetSimulation);

    // Glidebrytere
    heightSlider.addEventListener("input", () => {
        heightValue.textContent =
            Number(heightSlider.value).toFixed(1);

        resetSimulation();
    });

    speedSlider.addEventListener("input", () => {
        speedValue.textContent =
            Number(speedSlider.value).toFixed(1);

        resetSimulation();
    });

    angleSlider.addEventListener("input", () => {
        angleValue.textContent = angleSlider.value;
        resetSimulation();
    });

    resetSimulation();
    requestAnimationFrame(animate);

})();