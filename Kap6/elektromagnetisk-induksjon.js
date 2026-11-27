(() => {

    const root =
        document.querySelector("#elektromagnetisk-induksjon");

    if (!root) return;


    // ----------------------------------------
    // HTML-ELEMENTER
    // ----------------------------------------

    const startKnapp = root.querySelector("#eiStart");
    const nullstillKnapp = root.querySelector("#eiNullstill");

    const simCanvas = root.querySelector("#eiSimulering");
    const fluksCanvas = root.querySelector("#eiFluks");
    const spenningCanvas = root.querySelector("#eiSpenning");

    const simCtx = simCanvas.getContext("2d");
    const fluksCtx = fluksCanvas.getContext("2d");
    const spenningCtx = spenningCanvas.getContext("2d");


    // ----------------------------------------
    // CANVAS MED HØY OPPLØSNING
    // ----------------------------------------

    const scale = 2;

    simCtx.scale(scale, scale);
    fluksCtx.scale(scale, scale);
    spenningCtx.scale(scale, scale);

    const W = simCanvas.width / scale;
    const simH = simCanvas.height / scale;
    const grafH = fluksCanvas.height / scale;


    // ----------------------------------------
    // MAGNETFELTETS GEOMETRI
    // ----------------------------------------

    const feltVenstre = 200;
    const feltHoyre = 470;

    const feltTopp = 25;
    const feltBunn = 165;


    // ----------------------------------------
    // LEDERSLØYFAS GEOMETRI
    // ----------------------------------------

    const sloyfeBredde = 120;
    const sloyfeHoyde = 100;

    const sloyfeY = 45;

    const startX = 35;
    const sluttX = 550;

    // Konstant fart i piksler per sekund
    const fart = 55;

    const totalTid = (sluttX - startX) / fart;


    // ----------------------------------------
    // TIDSPUNKTER FOR DE ULIKE FASENE
    // ----------------------------------------

    // Sløyfa begynner å gå inn i feltet

    const t1 =
        (feltVenstre - sloyfeBredde - startX) / fart;


    // Hele sløyfa er inne i feltet

    const t2 =
        (feltVenstre - startX) / fart;


    // Sløyfa begynner å gå ut av feltet

    const t3 =
        (feltHoyre - sloyfeBredde - startX) / fart;


    // Hele sløyfa er ute av feltet

    const t4 =
        (feltHoyre - startX) / fart;


    // ----------------------------------------
    // FARGER
    // ----------------------------------------

    const sloyfeFarge = "#ca9b24";
    const feltFarge = "#64748b";

    const fluksFarge = "#2563eb";
    const spenningFarge = "#dc2626";

    const akseFarge = "#334155";


    // ----------------------------------------
    // ANIMASJON
    // ----------------------------------------

    let tid = 0;
    let starttid = null;
    let animasjon = null;


    // ----------------------------------------
    // TEGN LINJE
    // ----------------------------------------

    function tegnLinje(
        ctx, x1, y1, x2, y2, farge, bredde
    ) {

        ctx.strokeStyle = farge;
        ctx.lineWidth = bredde;

        ctx.beginPath();

        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);

        ctx.stroke();
    }


    // ----------------------------------------
    // TEGN PILSPISS
    // ----------------------------------------

    function pilspiss(ctx, x, y, vinkel, farge) {

        const lengde = 9;

        ctx.fillStyle = farge;

        ctx.beginPath();

        ctx.moveTo(x, y);

        ctx.lineTo(
            x - lengde * Math.cos(vinkel - Math.PI / 6),
            y - lengde * Math.sin(vinkel - Math.PI / 6)
        );

        ctx.lineTo(
            x - lengde * Math.cos(vinkel + Math.PI / 6),
            y - lengde * Math.sin(vinkel + Math.PI / 6)
        );

        ctx.closePath();
        ctx.fill();
    }


    // ----------------------------------------
    // SLØYFAS POSISJON
    // ----------------------------------------

    function sloyfeX(t) {

        return startX + fart * t;
    }


    // ----------------------------------------
    // OVERLAPP MELLOM SLØYFA OG FELTET
    // ----------------------------------------

    function overlapp(t) {

        const x = sloyfeX(t);

        const venstre = Math.max(
            x,
            feltVenstre
        );

        const hoyre = Math.min(
            x + sloyfeBredde,
            feltHoyre
        );

        return Math.max(0, hoyre - venstre);
    }


    // ----------------------------------------
    // MAGNETISK FLUKS
    // ----------------------------------------

    function fluks(t) {

        // Normalisert fluks mellom 0 og 1

        return overlapp(t) / sloyfeBredde;
    }


    // ----------------------------------------
    // INDUSERT SPENNING
    // ----------------------------------------

    function spenning(t) {

        // Sløyfa går inn i feltet

        if (t >= t1 && t < t2) {

            return -1;
        }


        // Sløyfa går ut av feltet

        if (t >= t3 && t < t4) {

            return 1;
        }


        // Konstant fluks

        return 0;
    }


    // ----------------------------------------
    // TEGN MAGNETFELTET
    // ----------------------------------------

    function tegnMagnetfelt() {

        const ctx = simCtx;


        // Svak bakgrunnsfarge

        ctx.fillStyle = "#f1f5f9";

        ctx.fillRect(
            feltVenstre,
            feltTopp,
            feltHoyre - feltVenstre,
            feltBunn - feltTopp
        );


        // Kryss: magnetfelt inn i skjermen

        const r = 4;

        for (let x = feltVenstre + 10;
                 x < feltHoyre;
                 x += 20) {

            for (let y = feltTopp + 10;
                     y < feltBunn;
                     y += 20) {

                tegnLinje(
                    ctx,
                    x - r, y - r,
                    x + r, y + r,
                    feltFarge, 1.2
                );

                tegnLinje(
                    ctx,
                    x - r, y + r,
                    x + r, y - r,
                    feltFarge, 1.2
                );
            }
        }


        // Symbol for magnetfeltet

        ctx.fillStyle = akseFarge;
        ctx.font = "italic 19px Georgia";

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillText(
            "B",
            feltHoyre - 10,
            feltTopp - 12
        );
    }


    // ----------------------------------------
    // TEGN AREALET INNE I MAGNETFELTET
    // ----------------------------------------

    function tegnOverlapp(t) {

        const x = sloyfeX(t);

        const bredde = overlapp(t);

        if (bredde <= 0) return;

        const venstre = Math.max(
            x,
            feltVenstre
        );

        simCtx.fillStyle =
            "rgba(37, 99, 235, 0.18)";

        simCtx.fillRect(
            venstre,
            sloyfeY,
            bredde,
            sloyfeHoyde
        );
    }


    // ----------------------------------------
    // TEGN LEDERSLØYFA
    // ----------------------------------------

    function tegnSloyfe(t) {

        const ctx = simCtx;

        const x = sloyfeX(t);

        ctx.strokeStyle = sloyfeFarge;
        ctx.lineWidth = 3.5;

        ctx.strokeRect(
            x,
            sloyfeY,
            sloyfeBredde,
            sloyfeHoyde
        );
    }


    // ----------------------------------------
    // TEGN FARTSPIL
    // ----------------------------------------

    function tegnFartspil(t) {

        const ctx = simCtx;

        const x = sloyfeX(t);

        const x1 = x + 15;
        const x2 = x + 65;

        const y = sloyfeY - 15;

        tegnLinje(
            ctx,
            x1, y,
            x2, y,
            akseFarge, 2
        );

        pilspiss(
            ctx,
            x2, y,
            0,
            akseFarge
        );

        ctx.fillStyle = akseFarge;
        ctx.font = "italic 18px Georgia";

        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";

        ctx.fillText(
            "v",
            (x1 + x2) / 2,
            y - 3
        );
    }


    // ----------------------------------------
    // TEGN SELVE SIMULERINGEN
    // ----------------------------------------

    function tegnSimulering() {

        simCtx.clearRect(0, 0, W, simH);

        tegnMagnetfelt();
        tegnOverlapp(tid);
        tegnSloyfe(tid);
        tegnFartspil(tid);
    }


    // ----------------------------------------
    // GRAFENES KOORDINATSYSTEM
    // ----------------------------------------

    const grafVenstre = 45;
    const grafHoyre = W - 20;

    const grafTopp = 15;
    const grafBunn = grafH - 15;


    function X(t) {

        return grafVenstre
            + t / totalTid
            * (grafHoyre - grafVenstre);
    }


    // Fluksgrafens vertikale koordinater

    function YFluks(phi) {

        return grafBunn - 10 - phi * 90;
    }


    // Spenningsgrafens vertikale koordinater

    function YSpenning(U) {

        return grafH / 2 - U * 45;
    }


    // ----------------------------------------
    // TEGN AKSER UTEN TALL
    // ----------------------------------------

    function tegnAkser(ctx, nullY, symbol) {

        // Horisontal akse

        tegnLinje(
            ctx,
            grafVenstre, nullY,
            grafHoyre, nullY,
            akseFarge, 1.3
        );


        // Vertikal akse

        tegnLinje(
            ctx,
            grafVenstre, grafBunn,
            grafVenstre, grafTopp,
            akseFarge, 1.3
        );


        // Pilspisser

        pilspiss(
            ctx,
            grafHoyre, nullY,
            0,
            akseFarge
        );

        pilspiss(
            ctx,
            grafVenstre, grafTopp,
            -Math.PI / 2,
            akseFarge
        );


        // Symboler på aksene

        ctx.fillStyle = akseFarge;
        ctx.font = "italic 19px Georgia";

        ctx.textAlign = "left";
        ctx.textBaseline = "middle";

        ctx.fillText(
            symbol,
            grafVenstre - 27,
            grafTopp + 8
        );

        ctx.fillText(
            "t",
            grafHoyre - 5,
            nullY + 16
        );
    }


    // ----------------------------------------
    // TEGN GRAF FOR MAGNETISK FLUKS
    // ----------------------------------------

    function tegnFluksgraf() {

        const ctx = fluksCtx;

        ctx.clearRect(0, 0, W, grafH);

        tegnAkser(
            ctx,
            YFluks(0),
            "Φ"
        );


        // Tegn bare grafen fram til nåværende tid

        if (tid <= 0) return;

        const tidspunkter = [
            0,
            t1,
            t2,
            t3,
            t4
        ].filter(t => t < tid);

        tidspunkter.push(tid);

        ctx.strokeStyle = fluksFarge;
        ctx.lineWidth = 2.8;

        ctx.beginPath();

        tidspunkter.forEach((t, i) => {

            const x = X(t);
            const y = YFluks(fluks(t));

            if (i === 0) {

                ctx.moveTo(x, y);

            } else {

                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();
    }


    // ----------------------------------------
    // TEGN GRAF FOR INDUSERT SPENNING
    // ----------------------------------------

    function tegnSpenningsgraf() {

        const ctx = spenningCtx;

        ctx.clearRect(0, 0, W, grafH);

        tegnAkser(
            ctx,
            YSpenning(0),
            "ℰ"
        );

        if (tid <= 0) return;


        // Tidspunkter der spenningen endres

        const overganger = [
            { t: t1, U: -1 },
            { t: t2, U: 0 },
            { t: t3, U: 1 },
            { t: t4, U: 0 }
        ];

        ctx.strokeStyle = spenningFarge;
        ctx.lineWidth = 2.8;

        ctx.beginPath();

        let forrigeU = 0;

        ctx.moveTo(
            X(0),
            YSpenning(0)
        );


        // Tegn horisontale og vertikale linjer

        for (const overgang of overganger) {

            if (overgang.t > tid) break;


            // Horisontal del

            ctx.lineTo(
                X(overgang.t),
                YSpenning(forrigeU)
            );


            // Vertikalt sprang

            ctx.lineTo(
                X(overgang.t),
                YSpenning(overgang.U)
            );

            forrigeU = overgang.U;
        }


        // Tegn fram til nåværende tidspunkt

        ctx.lineTo(
            X(tid),
            YSpenning(spenning(tid))
        );

        ctx.stroke();
    }


    // ----------------------------------------
    // TEGN ALT
    // ----------------------------------------

    function draw() {

        tegnSimulering();
        tegnFluksgraf();
        tegnSpenningsgraf();
    }


    // ----------------------------------------
    // ANIMASJON
    // ----------------------------------------

    function animate(timestamp) {

        if (starttid === null) {

            starttid = timestamp;
        }

        tid = Math.min(
            (timestamp - starttid) / 1000,
            totalTid
        );

        draw();

        if (tid < totalTid) {

            animasjon =
                requestAnimationFrame(animate);

        } else {

            animasjon = null;

            startKnapp.disabled = false;
        }
    }


    // ----------------------------------------
    // NULLSTILL
    // ----------------------------------------

    function nullstill() {

        if (animasjon !== null) {

            cancelAnimationFrame(animasjon);
        }

        animasjon = null;

        tid = 0;
        starttid = null;

        startKnapp.disabled = false;

        draw();
    }


    // ----------------------------------------
    // START
    // ----------------------------------------

    function start() {

        nullstill();

        startKnapp.disabled = true;

        animasjon =
            requestAnimationFrame(animate);
    }


    // ----------------------------------------
    // HENDELSER
    // ----------------------------------------

    startKnapp.addEventListener(
        "click",
        start
    );

    nullstillKnapp.addEventListener(
        "click",
        nullstill
    );


    // Starttilstand

    nullstill();

})();