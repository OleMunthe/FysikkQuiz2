(() => {
    const root = document.getElementById("newtons-kanon");
    if (!root) return;

    const canvas = root.querySelector("#kanonCanvas");
    const ctx = canvas.getContext("2d");

    const speedSlider = root.querySelector("#kanonSpeed");
    const speedValue = root.querySelector("#kanonSpeedValue");

    const timeDisplay = root.querySelector("#kanonTime");
    const velocityDisplay = root.querySelector("#kanonVelocity");
    const altitudeDisplay = root.querySelector("#kanonAltitude");

    const startButton = root.querySelector("#kanonStart");
    const pauseButton = root.querySelector("#kanonPause");
    const resetButton = root.querySelector("#kanonReset");

    // Fysiske konstanter
    const G = 6.67430e-11;
    const M = 5.972e24;
    const R = 6371000;
    const mu = G * M;


    // Bilde av jorda
const earthImage = new Image();
earthImage.src = "Jorda.png";

earthImage.onload = () => {
    draw();
};


    // Tegneområde
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    // Skala: meter til piksler
    const scale = 1 / 30000;

    // Simulering
    const dt = 2;
    const stepsPerFrame = 5;

    let x, y, vx, vy;
    let time = 0;
    let running = false;
    let trajectory = [];

    function acceleration(px, py) {
        const r = Math.hypot(px, py);
        const factor = -mu / (r * r * r);

        return {
            ax: factor * px,
            ay: factor * py
        };
    }

    function resetSimulation() {
        running = false;

        x = 0;
        y = -(R + 350000);

        vx = Number(speedSlider.value);
        vy = 0;

        time = 0;
        trajectory = [{ x, y }];

        updateInfo();
        draw();
    }

    function updatePhysics() {
        const a1 = acceleration(x, y);

        // Velocity Verlet
        const newX = x + vx * dt + 0.5 * a1.ax * dt * dt;
        const newY = y + vy * dt + 0.5 * a1.ay * dt * dt;

        const a2 = acceleration(newX, newY);

        vx += 0.5 * (a1.ax + a2.ax) * dt;
        vy += 0.5 * (a1.ay + a2.ay) * dt;

        x = newX;
        y = newY;

        time += dt;

        trajectory.push({ x, y });

        if (Math.hypot(x, y) <= R) {
            running = false;
        }

        // Begrens antall lagrede punkter
        if (trajectory.length > 10000) {
            trajectory.shift();
        }
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Jorda som bilde
const earthRadius = R * scale;

if (earthImage.complete && earthImage.naturalWidth > 0) {
    ctx.drawImage(
        earthImage,
        cx - earthRadius,
        cy - earthRadius,
        earthRadius * 2,
        earthRadius * 2
    );
}

        // Banen
        if (trajectory.length > 1) {
            ctx.beginPath();

            trajectory.forEach((point, index) => {
                const px = cx + point.x * scale;
                const py = cy + point.y * scale;

                if (index === 0) {
                    ctx.moveTo(px, py);
                } else {
                    ctx.lineTo(px, py);
                }
            });

            ctx.strokeStyle = "#ef4444";
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Kanonkulen
        ctx.beginPath();
        ctx.arc(
            cx + x * scale,
            cy + y * scale,
            5,
            0,
            2 * Math.PI
        );

        ctx.fillStyle = "#060605";
        ctx.fill();
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

        requestAnimationFrame(animate);
    }

    // Knapper
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

    resetSimulation();
    animate();
})();