(() => {

    const root = document.querySelector("#fartsvelger");
    if (!root) return;

    const canvas = root.querySelector("#fvCanvas");
    const ctx = canvas.getContext("2d");

    const fartSlider = root.querySelector("#fvFart");
    const fartVerdi = root.querySelector("#fvFartVerdi");

    const momentanfartVerdi =
    root.querySelector("#fvMomentanfart");

    const skytKnapp = root.querySelector("#fvSkyt");

    const FEVerdi = root.querySelector("#fvFE");
    const FBVerdi = root.querySelector("#fvFB");

    const status = root.querySelector("#fvStatus");


    // Canvas med høy oppløsning

    const scale = 2;

    const W = canvas.width / scale;
    const H = canvas.height / scale;

    ctx.scale(scale, scale);


    // ----------------------------------------
    // FYSISKE KONSTANTER
    // ----------------------------------------

    const q = 1.602176634e-19;

    const u = 1.66053906660e-27;

    // Ionemasse: 20 u
    const m = 20 * u;

    const E = 52.4e3;
    const B = 0.75;

    const omega = q * B / m;

    // Farten som gir kraftbalanse
    const balansefart = E / B;


    // ----------------------------------------
    // GEOMETRI
    // ----------------------------------------

    const pxPerMeter = 10000;

    const feltStart = 100;
    const feltSlutt = 500;

    const plateTopp = 35;
    const plateBunn = 265;

    const midtY = (plateTopp + plateBunn) / 2;

    const startX = 25;

    const sluttX = 575;

    // Halvparten av åpningens høyde
    const spalte = 6;


    // ----------------------------------------
    // FARGER
    // ----------------------------------------

    const elektriskFarge = "#dc2626";
    const magnetiskFarge = "#2563eb";

    const ionFarge = "#d97706";

    const plateFarge = "#475569";


    // ----------------------------------------
    // ANIMASJON
    // ----------------------------------------

    let animasjon = null;

    let bane = [];
    let banetid = 0;

    let starttid = null;

    let ionX = startX;
    let ionY = midtY;

    let sluttstatus = "";


    // ----------------------------------------
    // FORMATER TALL
    // ----------------------------------------

    function formatTall(tall) {

        return tall.toLocaleString("nb-NO", {
            maximumFractionDigits: 1
        });
    }

    function formatKraft(tall) {

        const koeffisient = tall / 1e-15;

        return koeffisient.toLocaleString("nb-NO", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) + " · 10⁻¹⁵";
    }


    // ----------------------------------------
    // TEGN LINJE
    // ----------------------------------------

    function tegnLinje(x1, y1, x2, y2, farge, bredde) {

        ctx.strokeStyle = farge;
        ctx.lineWidth = bredde;

        ctx.beginPath();

        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);

        ctx.stroke();
    }


    // ----------------------------------------
    // TEGN ELEKTRISK FELT
    // ----------------------------------------

    function tegnElektriskFelt() {

        ctx.save();

        ctx.globalAlpha = 0.65;

        for (let x = feltStart + 30;
                 x < feltSlutt;
                 x += 60) {

            for (let y = plateTopp + 20;
                     y < plateBunn - 30;
                     y += 75) {

                const lengde = 30;

                tegnLinje(
                    x, y,
                    x, y + lengde,
                    elektriskFarge, 1.5
                );

                ctx.fillStyle = elektriskFarge;

                ctx.beginPath();

                ctx.moveTo(x, y + lengde);

                ctx.lineTo(
                    x - 4,
                    y + lengde - 8
                );

                ctx.lineTo(
                    x + 4,
                    y + lengde - 8
                );

                ctx.closePath();
                ctx.fill();
            }
        }

        ctx.restore();
    }


    // ----------------------------------------
    // TEGN MAGNETISK FELT
    // ----------------------------------------

    function tegnMagnetiskFelt() {

        ctx.save();

        ctx.globalAlpha = 0.55;

        const r = 4;

        for (let x = feltStart + 15;
                 x < feltSlutt;
                 x += 40) {

            for (let y = plateTopp + 15;
                     y < plateBunn;
                     y += 40) {

                tegnLinje(
                    x - r, y - r,
                    x + r, y + r,
                    magnetiskFarge, 1.3
                );

                tegnLinje(
                    x - r, y + r,
                    x + r, y - r,
                    magnetiskFarge, 1.3
                );
            }
        }

        ctx.restore();
    }


    // ----------------------------------------
    // TEGN KONDENSATORPLATER
    // ----------------------------------------

    function tegnPlater() {

        // Positiv plate

        tegnLinje(
            feltStart, plateTopp,
            feltSlutt, plateTopp,
            plateFarge, 5
        );

        // Negativ plate

        tegnLinje(
            feltStart, plateBunn,
            feltSlutt, plateBunn,
            plateFarge, 5
        );


        ctx.font = "19px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        for (let x = feltStart + 20;
                 x < feltSlutt;
                 x += 40) {

            ctx.fillStyle = elektriskFarge;

            ctx.fillText(
                "+",
                x,
                plateTopp - 15
            );

            ctx.fillStyle = magnetiskFarge;

            ctx.fillText(
                "−",
                x,
                plateBunn + 15
            );
        }
    }


    // ----------------------------------------
    // TEGN SPALTE
    // ----------------------------------------

    function tegnSpalte() {

        tegnLinje(
            feltSlutt, plateTopp,
            feltSlutt, midtY - spalte,
            plateFarge, 5
        );

        tegnLinje(
            feltSlutt, midtY + spalte,
            feltSlutt, plateBunn,
            plateFarge, 5
        );
    }


    // ----------------------------------------
    // BEREGN IONETS BANE
    // ----------------------------------------

    function beregnBane(v0) {

        const punkter = [];

        sluttstatus = "";

        const dt = 2e-9;

        const innflygingstid =
            (feltStart - startX) / pxPerMeter / v0;


        // Rettlinjet bevegelse før feltet

        punkter.push({
            x: startX,
            y: midtY,
            t: 0
        });

        punkter.push({
            x: feltStart,
            y: midtY,
            t: innflygingstid
        });


        // Analytisk løsning i kryssede felt

        const deltaV = v0 - balansefart;

        let forrige = punkter[punkter.length - 1];

        for (let i = 1; i <= 100000; i++) {

            const t = i * dt;

            const xMeter =
                balansefart * t
                + deltaV / omega
                * Math.sin(omega * t);

            const yMeter =
                deltaV / omega
                * (1 - Math.cos(omega * t));


            const x =
                feltStart + xMeter * pxPerMeter;

            const y =
                midtY - yMeter * pxPerMeter;


            const punkt = {
                x: x,
                y: y,
                t: innflygingstid + t
            };


            // Finn første kollisjon med en grense

            let treff = null;

            function sjekkTreff(akse, grense, type) {

                const forskjell =
                    punkt[akse] - forrige[akse];

                if (forskjell === 0) return;

                const s =
                    (grense - forrige[akse]) / forskjell;

                if (s < 0 || s > 1) return;

                if (treff === null || s < treff.s) {

                    treff = {
                        s: s,
                        type: type
                    };
                }
            }


            if (y <= plateTopp) {

                sjekkTreff(
                    "y", plateTopp, "topp"
                );
            }

            if (y >= plateBunn) {

                sjekkTreff(
                    "y", plateBunn, "bunn"
                );
            }

            if (x >= feltSlutt) {

                sjekkTreff(
                    "x", feltSlutt, "slutt"
                );
            }

            if (x < feltStart) {

                sjekkTreff(
                    "x", feltStart, "tilbake"
                );
            }


            if (treff !== null) {

                const s = treff.s;

                const treffpunkt = {

                    x: forrige.x
                       + s * (punkt.x - forrige.x),

                    y: forrige.y
                       + s * (punkt.y - forrige.y),

                    t: forrige.t
                       + s * (punkt.t - forrige.t)
                };

                punkter.push(treffpunkt);


                if (treff.type === "topp") {

                    sluttstatus =
                        "Ionet treffer øvre plate.";

                } else if (treff.type === "bunn") {

                    sluttstatus =
                        "Ionet treffer nedre plate.";

                } else if (treff.type === "tilbake") {

                    sluttstatus =
                        "Ionet forlater feltet mot venstre.";

                } else {

                    // Undersøk om ionet treffer spalten

                    if (Math.abs(treffpunkt.y - midtY)
                        <= spalte) {

                        sluttstatus =
                            "Ionet passerer gjennom spalten.";


                        // Hastighetskomponenter ved utgangen

                        const tidIFelt =
                            treffpunkt.t - innflygingstid;

                        const vx =
                            balansefart
                            + deltaV
                            * Math.cos(omega * tidIFelt);

                        const vy =
                            deltaV
                            * Math.sin(omega * tidIFelt);


                        // Rettlinjet bevegelse etter feltet

                        if (vx > 0) {

                            const ekstraTid =
                                (sluttX - feltSlutt)
                                / pxPerMeter / vx;

                            punkter.push({

                                x: sluttX,

                                y: treffpunkt.y
                                   - vy * ekstraTid
                                   * pxPerMeter,

                                t: treffpunkt.t + ekstraTid
                            });
                        }

                    } else {

                        sluttstatus =
                            "Ionet treffer veggen ved spalten.";
                    }
                }

                break;
            }


            punkter.push(punkt);

            forrige = punkt;
        }

        if (!sluttstatus) {

            sluttstatus =
                "Beregningen er avsluttet.";
        }

        return punkter;
    }


    // ----------------------------------------
    // TEGN FORVENTET BANE
    // ----------------------------------------

    function tegnBane() {

        if (bane.length < 2) return;

        ctx.save();

        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = 1.5;

        ctx.setLineDash([5, 5]);

        ctx.beginPath();

        ctx.moveTo(bane[0].x, bane[0].y);

        for (let i = 1; i < bane.length; i++) {

            ctx.lineTo(
                bane[i].x,
                bane[i].y
            );
        }

        ctx.stroke();

        ctx.restore();
    }


    // ----------------------------------------
    // TEGN ION
    // ----------------------------------------

    function tegnIon() {

        ctx.fillStyle = ionFarge;

        ctx.beginPath();

        ctx.arc(
            ionX,
            ionY,
            5,
            0,
            2 * Math.PI
        );

        ctx.fill();


        // Positiv ladning

        ctx.fillStyle = "white";

        ctx.font = "bold 9px Arial";

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillText(
            "+",
            ionX,
            ionY
        );
    }


    // ----------------------------------------
    // TEGN HELE SIMULERINGEN
    // ----------------------------------------

    function draw() {

        ctx.clearRect(0, 0, W, H);


        // Svak bakgrunn i feltområdet

        ctx.fillStyle = "#f8fafc";

        ctx.fillRect(
            feltStart,
            plateTopp,
            feltSlutt - feltStart,
            plateBunn - plateTopp
        );


        tegnMagnetiskFelt();
        tegnElektriskFelt();

        tegnPlater();
        tegnSpalte();

        tegnBane();
        tegnIon();
    }


    // ----------------------------------------
    // FINN POSISJON VED GITT TID
    // ----------------------------------------

    function posisjonVedTid(t) {

        let lav = 0;
        let hoy = bane.length - 1;

        while (hoy - lav > 1) {

            const midt = Math.floor(
                (lav + hoy) / 2
            );

            if (bane[midt].t <= t) {

                lav = midt;

            } else {

                hoy = midt;
            }
        }

        const p1 = bane[lav];
        const p2 = bane[hoy];

        const s = p2.t === p1.t
            ? 0
            : (t - p1.t) / (p2.t - p1.t);

        ionX = p1.x + s * (p2.x - p1.x);
        ionY = p1.y + s * (p2.y - p1.y);
    }





    function oppdaterMomentanfart(t) {

    const v0 = Number(fartSlider.value) * 1000;

    const innflygingstid =
        (feltStart - startX) / pxPerMeter / v0;

    let v = v0;

    if (t > innflygingstid) {

        // Finn tidspunktet da ionet forlater feltet
        // eller treffer en av grensene

        const sistePunktIFelt = bane.find(p =>
            p.x >= feltSlutt ||
            p.y <= plateTopp ||
            p.y >= plateBunn
        );

        let tidIFelt = t - innflygingstid;

        if (sistePunktIFelt) {

            tidIFelt = Math.min(
                tidIFelt,
                sistePunktIFelt.t - innflygingstid
            );
        }

        const deltaV = v0 - balansefart;

        const vx =
            balansefart
            + deltaV * Math.cos(omega * tidIFelt);

        const vy =
            deltaV * Math.sin(omega * tidIFelt);

        v = Math.hypot(vx, vy);
    }

    momentanfartVerdi.textContent =
        (v / 1000).toLocaleString("nb-NO", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
}


    // ----------------------------------------
    // ANIMER IONET
    // ----------------------------------------

    function animate(timestamp) {

        if (starttid === null) {

            starttid = timestamp;
        }

        const tidSekunder =
            (timestamp - starttid) / 1000;


        // Vis bevegelsen i sakte film

        const tidsfaktor = 2e-7;

        const t = Math.min(
            tidSekunder * tidsfaktor,
            banetid
        );

        posisjonVedTid(t);

        oppdaterMomentanfart(t);

        draw();


        if (t < banetid) {

            animasjon =
                requestAnimationFrame(animate);

        } else {

            animasjon = null;

            status.textContent = sluttstatus;
        }
    }


    // ----------------------------------------
    // OPPDATER VED ENDRING AV GLIDER
    // ----------------------------------------

    function oppdater() {

        if (animasjon !== null) {

            cancelAnimationFrame(animasjon);

            animasjon = null;
        }

        const fart = Number(fartSlider.value);

        const v0 = fart * 1000;


        // Oppdater fart og krefter

        fartVerdi.textContent =
            formatTall(fart);

        FEVerdi.textContent =
            formatKraft(q * E);

        FBVerdi.textContent =
            formatKraft(q * v0 * B);


        // Beregn ny bane

        bane = beregnBane(v0);

        banetid = bane[bane.length - 1].t;


        // Tilbakestill ionet

        ionX = startX;
        ionY = midtY;

        starttid = null;

        status.textContent = "";

        oppdaterMomentanfart(0);

        draw();
    }


    // ----------------------------------------
    // SKYT ION
    // ----------------------------------------

    function skytIon() {

        oppdater();

        animasjon =
            requestAnimationFrame(animate);
    }


    // ----------------------------------------
    // HENDELSER
    // ----------------------------------------

    fartSlider.addEventListener(
        "input",
        oppdater
    );

    skytKnapp.addEventListener(
        "click",
        skytIon
    );

    oppdater();

})();