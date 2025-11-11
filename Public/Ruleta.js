document.addEventListener('DOMContentLoaded', () => {
    
    // --- ELEMENTOS DEL JUEGO ---
    const ruletaImg = document.querySelector('.ruleta-imagen-pequena');
    const spinButton = document.querySelector('.btn-spin');
    const statusText = document.getElementById('estado-apuesta');
    const fichas = document.querySelectorAll('.ficha-mejorada');
    const tapeteRuleta = document.getElementById('tapete-ruleta'); // ✅ CAMBIO: Usar la tabla directamente

    // El orden de los números en la ruleta europea (para calcular la posición final)
    const ruletaNumbers = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
    
    // --- ESTADO Y MAPEO ---
    
    const MAPEO_APUESTAS = {
        'n0': { tipo: 'numero', valor: 0 }, 'n1': { tipo: 'numero', valor: 1 }, 'n2': { tipo: 'numero', valor: 2 }, 'n3': { tipo: 'numero', valor: 3 }, 'n4': { tipo: 'numero', valor: 4 }, 
        'n5': { tipo: 'numero', valor: 5 }, 'n6': { tipo: 'numero', valor: 6 }, 'n7': { tipo: 'numero', valor: 7 }, 'n8': { tipo: 'numero', valor: 8 }, 'n9': { tipo: 'numero', valor: 9 }, 
        'n10': { tipo: 'numero', valor: 10 }, 'n11': { tipo: 'numero', valor: 11 }, 'n12': { tipo: 'numero', valor: 12 }, 'n13': { tipo: 'numero', valor: 13 }, 'n14': { tipo: 'numero', valor: 14 }, 
        'n15': { tipo: 'numero', valor: 15 }, 'n16': { tipo: 'numero', valor: 16 }, 'n17': { tipo: 'numero', valor: 17 }, 'n18': { tipo: 'numero', valor: 18 }, 'n19': { tipo: 'numero', valor: 19 }, 
        'n20': { tipo: 'numero', valor: 20 }, 'n21': { tipo: 'numero', valor: 21 }, 'n22': { tipo: 'numero', valor: 22 }, 'n23': { tipo: 'numero', valor: 23 }, 'n24': { tipo: 'numero', valor: 24 }, 
        'n25': { tipo: 'numero', valor: 25 }, 'n26': { tipo: 'numero', valor: 26 }, 'n27': { tipo: 'numero', valor: 27 }, 'n28': { tipo: 'numero', valor: 28 }, 'n29': { tipo: 'numero', valor: 29 }, 
        'n30': { tipo: 'numero', valor: 30 }, 'n31': { tipo: 'numero', valor: 31 }, 'n32': { tipo: 'numero', valor: 32 }, 'n33': { tipo: 'numero', valor: 33 }, 'n34': { tipo: 'numero', valor: 34 }, 
        'n35': { tipo: 'numero', valor: 35 }, 'n36': { tipo: 'numero', valor: 36 }, 
        'rojo': { tipo: 'color', valor: 'rojo' }, 'negro': { tipo: 'color', valor: 'negro' },
        'par': { tipo: 'paridad', valor: 'par' }, 'impar': { tipo: 'paridad', valor: 'impar' },
        '1a18': { tipo: 'grupo', valor: 'bajo' }, '19a36': { tipo: 'grupo', valor: 'alto' },
        '1st12': { tipo: 'docena', valor: 1 }, '2nd12': { tipo: 'docena', valor: 2 }, '3rd12': { tipo: 'docena', valor: 3 },
        '2to1_1': { tipo: 'columna', valor: 1 }, '2to1_2': { tipo: 'columna', valor: 2 }, '2to1_3': { tipo: 'columna', valor: 3 }  
    };

    let apuestasActuales = {};

    // --- UTILERÍAS ---
    
    function obtenerDinero() {
        const dineroTexto = document.getElementById('dinero-disponible').textContent.replace('$', '').trim();
        const dineroLimpio = dineroTexto.replace(/\./g, '').replace(',', '.'); 
        return Number(dineroLimpio); 
    }

    function actualizarDinero(nuevoMonto) {
        const formatter = new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0
        });
        document.getElementById('dinero-disponible').textContent = formatter.format(nuevoMonto).replace('USD', '$').trim();
    }

    function limpiarApuestasVisuales() {
        const zonasApuesta = tapeteRuleta.querySelectorAll('td');
        zonasApuesta.forEach(celda => {
            const fichasVisuales = celda.querySelectorAll('.ficha-visual-normal, .ficha-visual-allin');
            fichasVisuales.forEach(ficha => ficha.remove());
        });
        apuestasActuales = {}; 
    }
    
    // --- DRAG AND DROP HANDLERS ---
    
    function dragStart(e) {
    // Buscar el contenedor .ficha-mejorada más cercano
    const fichaContainer = e.target.closest('.ficha-mejorada');
    if (!fichaContainer) return;
    
    const valor = fichaContainer.getAttribute('data-valor');
    const tipo = fichaContainer.getAttribute('data-tipo');
    e.dataTransfer.setData('text/plain', JSON.stringify({ valor, tipo }));
    e.dataTransfer.effectAllowed = 'copy';
    
    fichaContainer.style.opacity = '0.5';
}

    function dragEnd(e) {
    const fichaContainer = e.target.closest('.ficha-mejorada');
    if (fichaContainer) {
        fichaContainer.style.opacity = '1';
    }
}

    function dragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
    }

    function dragEnter(e) {
        e.preventDefault();
    }

    function drop(e) {
        e.preventDefault();
        e.stopPropagation();

        const data = e.dataTransfer.getData('text/plain');
        if (!data) {
            console.log('❌ No hay datos en el drop');
            return;
        }

        let fichaInfo;
        try {
            fichaInfo = JSON.parse(data);
        } catch (err) {
            console.error('❌ Error parseando datos:', err);
            return;
        }
        
        const celda = e.target.closest('td');

        if (!celda || !celda.id) {
            console.log('❌ No se encontró celda válida');
            return;
        }
        
        const celdaId = celda.id;
        console.log('✅ Drop en celda:', celdaId);

        if (!MAPEO_APUESTAS[celdaId]) {
            console.log('❌ Celda no válida para apostar');
            statusText.textContent = '⚠️ Zona no válida para apostar';
            statusText.style.color = 'var(--color-danger)';
            setTimeout(() => {
                statusText.style.color = '';
                statusText.textContent = 'Esperando apuesta';
            }, 2000);
            return;
        }

        if (apuestasActuales[celdaId]) {
            console.log('⚠️ Ya hay apuesta en esta celda');
            statusText.textContent = '⚠️ Ya hay una apuesta aquí';
            statusText.style.color = 'var(--color-warning)';
            setTimeout(() => {
                statusText.style.color = '';
                statusText.textContent = 'Esperando apuesta';
            }, 2000);
            return;
        }
        
        let valorApuesta = 0;
        let dineroActual = obtenerDinero(); 

        if (fichaInfo.tipo === 'allin') {
            valorApuesta = dineroActual;
            if (valorApuesta <= 0) {
                statusText.textContent = '⚠️ No tienes dinero para All-In';
                statusText.style.color = 'var(--color-danger)';
                setTimeout(() => {
                    statusText.style.color = '';
                    statusText.textContent = 'Esperando apuesta';
                }, 2000);
                return;
            }
        } else {
            valorApuesta = parseInt(fichaInfo.valor);
        }

        if (dineroActual < valorApuesta) {
            console.log('❌ Saldo insuficiente');
            statusText.textContent = '⚠️ Saldo insuficiente';
            statusText.style.color = 'var(--color-danger)';
            setTimeout(() => {
                statusText.style.color = '';
                statusText.textContent = 'Esperando apuesta';
            }, 2000);
            return;
        }

        apuestasActuales[celdaId] = valorApuesta;
        const nuevoMonto = dineroActual - valorApuesta;
        actualizarDinero(nuevoMonto); 
        
        console.log('✅ Apuesta registrada:', celdaId, valorApuesta);
        
        const fichaVisual = document.createElement('div');
        fichaVisual.className = fichaInfo.tipo === 'allin' ? 'ficha-visual-allin' : 'ficha-visual-normal';
        fichaVisual.innerText = fichaInfo.tipo === 'allin' ? 'A' : fichaInfo.valor; 
        fichaVisual.dataset.valor = valorApuesta; 
        
        celda.appendChild(fichaVisual);

        statusText.textContent = `✅ Apuesta de $${valorApuesta.toLocaleString('es-CL')} registrada`;
        statusText.style.color = 'var(--color-success)';
        setTimeout(() => {
            statusText.style.color = '';
        }, 1500);
    }

    fichas.forEach(ficha => {
        ficha.addEventListener('dragstart', dragStart);
        ficha.addEventListener('dragend', dragEnd);
    });
    
    if (tapeteRuleta) {
        const todasLasCeldas = tapeteRuleta.querySelectorAll('td');
        todasLasCeldas.forEach(celda => {
            celda.addEventListener('dragover', dragOver);
            celda.addEventListener('dragenter', dragEnter);
            celda.addEventListener('drop', drop);
        });
        console.log(`✅ Eventos de drop agregados a ${todasLasCeldas.length} celdas`);
    } else {
        console.error('❌ No se encontró el tapete de ruleta');
    }
    
    window.iniciarApuesta = async function() {
        if (Object.keys(apuestasActuales).length === 0) {
            alert("¡No hay fichas apostadas para iniciar el giro!");
            return;
        }
        
        const apuestasParaEnviar = Object.keys(apuestasActuales).map(celdaId => {
            const info = MAPEO_APUESTAS[celdaId];
            return {
                tipo: info.tipo,      
                valor: info.valor,    
                monto: apuestasActuales[celdaId] 
            };
        });
        
        console.log('🎰 Enviando apuestas:', apuestasParaEnviar);
        
        spinButton.disabled = true;
        spinButton.textContent = 'GIRANDO...';
        statusText.textContent = '🎰 Giro en curso...';

        try {
            const response = await fetch('/apuesta', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apuestas: apuestasParaEnviar })
            });

            const data = await response.json();
            console.log('📥 Respuesta del servidor:', data);
            
            if (!response.ok || !data.success) {
                statusText.textContent = `❌ Error: ${data.error || 'Desconocido'}`;
                statusText.style.color = 'var(--color-danger)';
                if (data.saldo) {
                    actualizarDinero(Number(data.saldo.replace('$', '').replace(/\./g, '').replace(',', '.'))); 
                }
                spinButton.disabled = false;
                spinButton.textContent = 'INICIAR APUESTA';
                limpiarApuestasVisuales(); 
                return;
            }

            const numeroGanador = data.resultado.numero;

            const index = ruletaNumbers.indexOf(numeroGanador);
            if (index === -1) {
                console.error('❌ Número ganador no encontrado en ruletaNumbers');
                return;
            }

            const gradosPorSegmento = 360 / 37;
            const targetGrados = 360 - (index * gradosPorSegmento) - (gradosPorSegmento / 2);

            const girosCompletos = 5 * 360; 
            const finalRotation = girosCompletos + targetGrados;

            console.log('🎡 Rotando ruleta a:', finalRotation, 'grados');

            if (!ruletaImg) {
                console.error('❌ No se encontró la imagen de la ruleta');
                return;
            }

            ruletaImg.style.transition = 'transform 6s cubic-bezier(0.2, 0.8, 0.4, 1)'; 
            ruletaImg.style.transform = `rotate(${finalRotation}deg)`;
            
            setTimeout(() => {
                const signo = data.gananciaNeta >= 0 ? '+' : '';
                statusText.textContent = `🎉 GANADOR: ${numeroGanador} (${data.resultado.color}). Neto: ${signo}$${Math.abs(data.gananciaNeta).toLocaleString('es-CL')}`;
                statusText.style.color = data.gananciaNeta >= 0 ? 'var(--color-success)' : 'var(--color-danger)';

                setTimeout(() => {
                    limpiarApuestasVisuales();
                    spinButton.disabled = false;
                    spinButton.textContent = 'INICIAR APUESTA';
                }, 3000);
            }, 6000); 
            
        } catch (error) {
            console.error('❌ Error en el proceso de apuesta:', error);
            statusText.textContent = '❌ Error de conexión con el servidor';
            statusText.style.color = 'var(--color-danger)';
            spinButton.disabled = false;
            spinButton.textContent = 'INICIAR APUESTA';
        }
    }

    window.limpiarApuestas = function() {
        let dineroADevolver = 0;
        Object.values(apuestasActuales).forEach(monto => {
            dineroADevolver += monto;
        });
        
        if (dineroADevolver > 0) {
            const dineroActual = obtenerDinero();
            actualizarDinero(dineroActual + dineroADevolver);
        }
        
        limpiarApuestasVisuales();
        statusText.textContent = '🗑️ Apuestas limpiadas';
        console.log('✅ Apuestas limpiadas, dinero devuelto:', dineroADevolver);
    }

    console.log('✅ Sistema de ruleta inicializado correctamente');
});
