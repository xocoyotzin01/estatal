document.addEventListener('DOMContentLoaded', () => {

    const card       = document.getElementById('info-card');
    const titulo     = document.getElementById('card-titulo');
    const grid       = document.getElementById('datos-grid');
    const btnMasInfo = document.getElementById('btn-mas-info');
    const tooltip    = document.getElementById('tooltip');
    const panelHint  = document.getElementById('panel-hint');
    const panelContenido = document.getElementById('panel-contenido');
    const graficaArea  = document.getElementById('grafica-area');
    const graficaTitulo = document.getElementById('grafica-titulo');
    const graficaCanvas = document.getElementById('grafica-canvas');
    const contenedor = document.querySelector('.contenedor-mapa-interactivo');

    let infoActual = null;

    // ─── GRÁFICAS ────────────────────────────────────
    const GRAFICAS = [
        // 0: Población — barras comparando región
        (info) => ({
            titulo: 'Población vs estados vecinos (aprox.)',
            tipo: 'barras',
            labels: ['Este estado', 'Promedio nac.', 'Más poblado', 'Menos poblado'],
            valores: [
                parseFloat(info.resumen.poblacion.replace(/,/g,'')),
                3800000, 17000000, 700000
            ],
            color: '#C1B293'
        }),
        // 1: Desempleo — gauge simple
        (info) => ({
            titulo: 'Tasa de desempleo (%)',
            tipo: 'gauge',
            valor: parseFloat(info.resumen.desempleo),
            max: 8,
            color: '#C1B293'
        }),
        // 2: Exportaciones — barra horizontal vs importaciones
        (info) => ({
            titulo: 'Balanza comercial (MDD)',
            tipo: 'barrasH',
            labels: ['Exportaciones', 'Importaciones'],
            valores: [
                parseFloat(info.resumen.exportaciones.replace(/[^0-9.]/g,'')),
                parseFloat(info.resumen.importaciones.replace(/[^0-9.]/g,''))
            ],
            colores: ['#C1B293', '#2d6a4f']
        }),
        // 3: Importaciones — misma gráfica de balanza
        (info) => ({
            titulo: 'Balanza comercial (MDD)',
            tipo: 'barrasH',
            labels: ['Exportaciones', 'Importaciones'],
            valores: [
                parseFloat(info.resumen.exportaciones.replace(/[^0-9.]/g,'')),
                parseFloat(info.resumen.importaciones.replace(/[^0-9.]/g,''))
            ],
            colores: ['#C1B293', '#2d6a4f']
        }),
        // 4: Recaudación — donut recaudación vs gasto
        (info) => ({
            titulo: 'Recaudación vs Gasto (MDP)',
            tipo: 'barrasH',
            labels: ['Recaudación', 'Gasto'],
            valores: [
                parseFloat(info.resumen.recaudacion.replace(/[^0-9.]/g,'')),
                parseFloat(info.resumen.gasto.replace(/[^0-9.]/g,''))
            ],
            colores: ['#C1B293', '#2d6a4f']
        }),
        // 5: Gasto — mismo
        (info) => ({
            titulo: 'Recaudación vs Gasto (MDP)',
            tipo: 'barrasH',
            labels: ['Recaudación', 'Gasto'],
            valores: [
                parseFloat(info.resumen.recaudacion.replace(/[^0-9.]/g,'')),
                parseFloat(info.resumen.gasto.replace(/[^0-9.]/g,''))
            ],
            colores: ['#C1B293', '#2d6a4f']
        })
    ];

    function dibujarGrafica(idx, info) {
        const cfg = GRAFICAS[idx](info);
        graficaTitulo.textContent = cfg.titulo;
        graficaArea.style.display = 'block';

        const canvas = graficaCanvas;
        const W = canvas.offsetWidth || 220;
        canvas.width = W;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (cfg.tipo === 'barras') {
            const pad = 10, barW = (W - pad*2) / cfg.labels.length - 6;
            const max = Math.max(...cfg.valores);
            const H = canvas.height;
            cfg.valores.forEach((v, i) => {
                const x = pad + i * ((W - pad*2) / cfg.labels.length);
                const h = ((v / max) * (H - 30));
                ctx.fillStyle = i === 0 ? cfg.color : '#dde3e9';
                ctx.beginPath();
                ctx.roundRect(x, H - h - 20, barW, h, 4);
                ctx.fill();
                ctx.fillStyle = '#8a99a8';
                ctx.font = '8px sans-serif';
                ctx.textAlign = 'center';
                const label = cfg.labels[i].length > 8 ? cfg.labels[i].slice(0,8)+'…' : cfg.labels[i];
                ctx.fillText(label, x + barW/2, H - 4);
            });
        }

        if (cfg.tipo === 'barrasH') {
            const padL = 80, padR = 10, barH = 22, gap = 14;
            const max = Math.max(...cfg.valores);
            cfg.valores.forEach((v, i) => {
                const y = 16 + i * (barH + gap);
                const w = ((v / max) * (canvas.width - padL - padR));
                ctx.fillStyle = cfg.colores ? cfg.colores[i] : cfg.color;
                ctx.beginPath();
                ctx.roundRect(padL, y, w, barH, 4);
                ctx.fill();
                ctx.fillStyle = '#4a5568';
                ctx.font = '9px sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText(cfg.labels[i], padL - 4, y + barH/2 + 3);
                ctx.fillStyle = '#8a99a8';
                ctx.font = '8px sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText(v.toLocaleString(), padL + w + 4, y + barH/2 + 3);
            });
        }

        if (cfg.tipo === 'gauge') {
            const cx = canvas.width / 2, cy = canvas.height - 10;
            const r = Math.min(cx, cy) - 10;
            const pct = Math.min(cfg.valor / cfg.max, 1);
            const startA = Math.PI, endA = Math.PI + pct * Math.PI;
            // fondo
            ctx.beginPath();
            ctx.arc(cx, cy, r, Math.PI, 2*Math.PI);
            ctx.strokeStyle = '#dde3e9';
            ctx.lineWidth = 14;
            ctx.stroke();
            // valor
            ctx.beginPath();
            ctx.arc(cx, cy, r, startA, endA);
            ctx.strokeStyle = cfg.color;
            ctx.lineWidth = 14;
            ctx.lineCap = 'round';
            ctx.stroke();
            // texto
            ctx.fillStyle = '#1f2d3d';
            ctx.font = 'bold 20px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(cfg.valor + '%', cx, cy - 10);
            ctx.fillStyle = '#8a99a8';
            ctx.font = '9px sans-serif';
            ctx.fillText('0%', cx - r, cy + 14);
            ctx.fillText(cfg.max + '%', cx + r, cy + 14);
        }
    }

    const estados = document.querySelectorAll('.mapa-svg path');

    // ─── TOOLTIP ────────────────────────────────────
    estados.forEach(estado => {
        estado.addEventListener('mousemove', (e) => {
            const nombre = estado.getAttribute('data-estado') || estado.querySelector('title')?.textContent || 'Estado';
            tooltip.textContent = nombre;
            tooltip.style.display = 'block';
            const rect = contenedor.getBoundingClientRect();
            let x = e.clientX - rect.left + 12;
            let y = e.clientY - rect.top - 30;
            if (x + 180 > rect.width) x = e.clientX - rect.left - 190;
            tooltip.style.left = x + 'px';
            tooltip.style.top  = y + 'px';
        });

        estado.addEventListener('mouseleave', () => {
            tooltip.style.display = 'none';
        });
    });

    // ─── CLICK ──────────────────────────────────────
    let estadoActivo = null;

    estados.forEach(estado => {
        estado.addEventListener('click', () => {

            tooltip.style.display = 'none';

            // Si se clickea el mismo estado que ya está seleccionado → deseleccionar
            if (estadoActivo === estado) {
                estado.classList.remove('seleccionado');
                estadoActivo = null;
                card.classList.remove('visible');
                // Esperar a que termine la transición para ocultar contenido
                setTimeout(() => {
                    panelContenido.style.display = 'none';
                    panelHint.style.display = 'block';
                    graficaArea.style.display = 'none';
                }, 450);
                return;
            }

            estados.forEach(e => e.classList.remove('seleccionado'));
            estado.classList.add('seleccionado');
            estadoActivo = estado;

            const idEstado = estado.getAttribute('data-id');
            const info = DATABASE_SADE[idEstado];
            if (!info) return;
            infoActual = info;

            titulo.textContent = info.nombre;

            const d = info.detalles;

            const tarjetas = [
                {
                    label: 'Población',
                    valor: info.resumen.poblacion,
                    reversoTitulo: 'Demografía',
                    reversoTexto: d.demografia.join(' · ')
                },
                {
                    label: 'Desempleo',
                    valor: info.resumen.desempleo,
                    reversoTitulo: 'Contexto económico',
                    reversoTexto: d.economia.join(' · ')
                },
                {
                    label: 'Exportaciones',
                    valor: info.resumen.exportaciones,
                    reversoTitulo: 'Sector económico',
                    reversoTexto: d.economia.join(' · ')
                },
                {
                    label: 'Importaciones',
                    valor: info.resumen.importaciones,
                    reversoTitulo: 'Balanza comercial',
                    reversoTexto: `Exportaciones: ${info.resumen.exportaciones} · Importaciones: ${info.resumen.importaciones}`
                },
                {
                    label: 'Recaudación',
                    valor: info.resumen.recaudacion,
                    reversoTitulo: 'Ingresos públicos',
                    reversoTexto: d.recaudacion.join(' · ')
                },
                {
                    label: 'Gasto',
                    valor: info.resumen.gasto,
                    reversoTitulo: 'Destino del gasto',
                    reversoTexto: d.gasto.join(' · ')
                }
            ];

            grid.innerHTML = tarjetas.map(t => {
                const items = t.reversoTexto.split(' · ').map(item =>
                    `<div class="reverso-item">· ${item.trim()}</div>`
                ).join('');
                return `
                <div class="dato-box">
                    <div class="dato-frente">
                        <div class="dato-label">${t.label}</div>
                        <div class="dato-valor">${t.valor}</div>
                        <div class="flip-hint">click para más</div>
                    </div>
                    <div class="dato-reverso">
                        <div class="dato-reverso-titulo">${t.reversoTitulo}</div>
                        <div class="dato-reverso-texto">${items}</div>
                    </div>
                </div>`;
            }).join('');

            // Activar flip + gráfica por click en cada tarjeta
            grid.querySelectorAll('.dato-box').forEach((box, idx) => {
                box.addEventListener('click', () => {
                    const yaFlipped = box.classList.contains('flipped');
                    // Cerrar todas
                    grid.querySelectorAll('.dato-box').forEach(b => b.classList.remove('flipped'));
                    graficaArea.style.display = 'none';

                    if (!yaFlipped) {
                        box.classList.add('flipped');
                        dibujarGrafica(idx, infoActual);
                    }
                });
            });

            panelContenido.style.display = 'block';
            panelHint.style.display = 'none';
            // Pequeño delay para que la transición de width se vea suave
            requestAnimationFrame(() => card.classList.add('visible'));

            btnMasInfo.onclick = () => {
                window.location.href = `detalle.html?estado=${idEstado}`;
            };
        });
    });

});
