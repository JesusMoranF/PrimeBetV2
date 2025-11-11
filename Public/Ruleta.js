document.addEventListener('DOMContentLoaded', () => {
    const ruletaImg = document.querySelector('.ruleta-imagen-pequena');
    const spinButton = document.querySelector('.btn-spin');
    const statusText = document.querySelector('.balance-status:nth-child(2)');

    // El orden de los números en la ruleta europea (para calcular la posición final)
    const ruletaNumbers = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];

    // Función principal para iniciar el giro
    spinButton.addEventListener('click', async () => {
        // 1. Deshabilitar botón para evitar clics múltiples
        spinButton.disabled = true;
        spinButton.textContent = 'GIRANDO...';
        statusText.textContent = 'Giro en curso';
        
        // ** (Aquí iría la lógica para obtener la apuesta del usuario en un juego real) **
        // Por ahora, solo enviamos una simulación.
        const apuestaSimulada = {
            monto: 1, // Ejemplo de monto
            tipo: 'rojo' // Ejemplo de tipo de apuesta
        };

        try {
            // 2. Llamada al Backend para obtener el resultado real
            const response = await fetch('/apuesta', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Enviar la apuesta del usuario al servidor
                body: JSON.stringify(apuestaSimulada) 
            });

            if (!response.ok) {
                const errorData = await response.json();
                statusText.textContent = `Error: ${errorData.error}`;
                spinButton.disabled = false;
                spinButton.textContent = 'INICIAR APUESTA';
                return;
            }

            const data = await response.json();
            const numeroGanador = data.resultado.numero;

            // 3. Calcular la posición final de la ruleta
            const index = ruletaNumbers.indexOf(numeroGanador);
            // Cada número ocupa 360 / 37 grados. El factor 0.5 ajusta el centro del segmento.
            const gradosPorSegmento = 360 / 37;
            const targetGrados = 360 - (index * gradosPorSegmento) - (gradosPorSegmento / 2);

            // 4. Aplicar la animación CSS para el giro
            // Se añade un número grande de giros (e.g., 5 * 360) para un efecto visual dramático.
            const girosCompletos = 5 * 360; 
            const finalRotation = girosCompletos + targetGrados;

            ruletaImg.style.transition = 'transform 6s cubic-bezier(0.2, 0.8, 0.4, 1)'; // Animación lenta de entrada y frenada
            ruletaImg.style.transform = `rotate(${finalRotation}deg)`;
            
            // 5. Esperar que termine la animación
            setTimeout(() => {
                // Actualizar el estado con el resultado
                statusText.textContent = `¡GANADOR: ${numeroGanador} (${data.resultado.color})!`;

                // Recargar la página para reflejar el nuevo saldo y actualizar la tabla de resultados
                // En un proyecto más avanzado, se actualizaría el saldo vía AJAX, pero recargar es más simple.
                // alert(`Has ganado/perdido. Tu nuevo saldo es: $${data.saldo}`); 
                window.location.reload(); 
            }, 6000); // Tiempo de la animación
            
        } catch (error) {
            console.error('Error en el proceso de apuesta:', error);
            statusText.textContent = 'Error de conexión con el servidor.';
            spinButton.disabled = false;
            spinButton.textContent = 'INICIAR APUESTA';
        }
    });
});