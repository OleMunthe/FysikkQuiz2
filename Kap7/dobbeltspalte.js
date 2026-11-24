(() => {

    const root = document.querySelector("#dobbeltspalte-simulering");
    if (!root) return;

    const canvas = root.querySelector("#dsCanvas");
    const ctx = canvas.getContext("2d");

    const tidSlider = root.querySelector("#dsTid");
    const lambdaSlider = root.querySelector("#dsLambda");


    const lambdaVerdi = root.querySelector("#dsLambdaVerdi");

    const scale = 2;

    const W = canvas.width / scale;
    const H = canvas.height / scale;

    ctx.scale(scale, scale);

    // Geometri
    const cx = W / 2;

    const skjermY = 30;
    const spalteY = 175;

    const spalteAvstand = 70;
    const spalteBredde = 12;

    const spalte1X = cx - spalteAvstand / 2;
    const spalte2X = cx + spalteAvstand / 2;

    const veggTykkelse = 12;

    const c = 299792458;

    // Bølgelengden skaleres for visualisering
    const pxPerNm = 0.045;


    // ------------------------------------------
    // FARGE SOM FUNKSJON AV BØLGELENGDE
    // ------------------------------------------

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


    // ------------------------------------------
    // TEGN EN BØLGEFRONT
    // ------------------------------------------

    function tegnSirkel(x, y, radius, farge, alpha) {

        if (radius <= 0) return;

        ctx.beginPath();

        // Øvre halvsirkel
        ctx.arc(
            x,
            y,
            radius,
            Math.PI,
            2 * Math.PI
        );

        ctx.strokeStyle = farge;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 2.5;

        ctx.stroke();

        ctx.globalAlpha = 1;
    }


    // ------------------------------------------
    // TEGN SKJERM OG MAKSIMUM
    // ------------------------------------------

    function tegnSkjerm(lambdaPx, farge) {

        const L = spalteY - skjermY;

        // Skjermen
        ctx.fillStyle = "#111111";

        ctx.fillRect(
            0,
            skjermY - 8,
            W,
            8
        );

        // Maksimum av orden m:
        // d sin(theta) = m lambda

        for (let m = -3; m <= 3; m++) {

            const sinTheta =
                m * lambdaPx / spalteAvstand;

            if (Math.abs(sinTheta) >= 1) continue;

            const theta = Math.asin(sinTheta);

            const x = cx + L * Math.tan(theta);

            if (x < 0 || x > W) continue;

            // Lysende punkt på skjermen
            ctx.fillStyle = farge;

            ctx.beginPath();

            ctx.arc(
                x,
                skjermY - 4,
                5,
                0,
                2 * Math.PI
            );

            ctx.fill();

            
        }

        ctx.textAlign = "left";
    }


    // ------------------------------------------
    // TEGN VEGG MED TO SPALTER
    // ------------------------------------------

    function tegnVegg() {

        const gap = spalteBredde / 2;

        const venstre1 = spalte1X - gap;
        const hoyre1 = spalte1X + gap;

        const venstre2 = spalte2X - gap;
        const hoyre2 = spalte2X + gap;

        ctx.fillStyle = "#111111";

        // Venstre vegg
        ctx.fillRect(
            0,
            spalteY,
            venstre1,
            veggTykkelse
        );

        // Midtre vegg
        ctx.fillRect(
            hoyre1,
            spalteY,
            venstre2 - hoyre1,
            veggTykkelse
        );

        // Høyre vegg
        ctx.fillRect(
            hoyre2,
            spalteY,
            W - hoyre2,
            veggTykkelse
        );
    }


    // ------------------------------------------
    // TEGN INNKOMMENDE BØLGER
    // ------------------------------------------

  function tegnInnkommendeBolger(lambdaPx, tid, farge) {

    // Bølgene skal bevege seg OPPOVER.
    // I canvas øker y-koordinaten nedover.
    // Derfor må y avta når tiden øker.

    const fase = tid * lambdaPx;

    ctx.strokeStyle = farge;
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = 0.45;

    for (let n = -30; n <= 30; n++) {

        const y = spalteY + n * lambdaPx - fase;

        if (y < spalteY + 15 || y > H) {
            continue;
        }

        ctx.beginPath();
        ctx.moveTo(20, y);
        ctx.lineTo(W - 20, y);
        ctx.stroke();
    }

    ctx.globalAlpha = 1;
}


    // ------------------------------------------
    // TEGN INTERFERENSBØLGER
    // ------------------------------------------

    function tegnInterferens(lambdaPx, tid, farge) {

        const fase = tid * lambdaPx;

        const maxRadius = 260;

        for (let n = 0; n < 30; n++) {

            const radius =
                n * lambdaPx + fase;

            if (radius > maxRadius) continue;

            const alpha =
                0.25 + 0.45 *
                (1 - radius / maxRadius);

            tegnSirkel(
                spalte1X,
                spalteY,
                radius,
                farge,
                alpha
            );

            tegnSirkel(
                spalte2X,
                spalteY,
                radius,
                farge,
                alpha
            );
        }
    }


    // ------------------------------------------
    // TEGN ALT
    // ------------------------------------------

    function draw() {

        ctx.clearRect(0, 0, W, H);

        const lambda = Number(lambdaSlider.value);
        const tid = Number(tidSlider.value) / 100;

        const lambdaPx = lambda * pxPerNm;

        const farge = wavelengthToColor(lambda);

        lambdaVerdi.textContent = lambda;
        

        // Bølgefronter
        tegnInnkommendeBolger(
            lambdaPx,
            tid,
            farge
        );

        tegnInterferens(
            lambdaPx,
            tid,
            farge
        );

        // Vegg og skjerm tegnes oppå bølgene
        tegnVegg();

        tegnSkjerm(
            lambdaPx,
            farge
        );
    }


    // ------------------------------------------
    // GLIDEBRYTERE
    // ------------------------------------------

    tidSlider.addEventListener("input", draw);
    lambdaSlider.addEventListener("input", draw);

    draw();

})();