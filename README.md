# Giantuchi Animation 3D Studio

Estudio y visualizador web interactivo en 3D para tu personaje/mascota animada (`modelo.gltf`). Integra el escenario corporativo Giantucchi con iluminación ambiental y un piso con sombras y reflejos que combinan a la perfección con la imagen de fondo.

## Características

- **Modelo 3D GLTF Real (`modelo.gltf`)**: Renderizado en tiempo real con Three.js, materiales PBR, sombras dinámicas y control de postura.
- **18 Animaciones Integradas**: Selector interactivo con todas las animaciones del modelo (Danzas como *Joyful Dance*, *All Night Dance*, *Cherish Pop*, saludos, caminata, trote y poses).
- **Escenario Oficina Giantucchi**: Utiliza la imagen `Gemini_Generated_Image_.jpeg` como fondo inmersivo.
- **Piso Adaptado al Diseño**: Piso pulido que refleja la luz y sombras de contacto suaves donde se apoya el personaje, integrándolo de forma natural en el entorno de oficina.
- **Iluminación Coherente**: Luz solar cálida proveniente de las ventanas altas a la izquierda y reflejos neón púrpura procedentes de las pantallas holográficas Giantucchi.
- **Controles de Desplazamiento**: Mueve la mascota por el piso con las teclas de dirección (← ↑ ↓ →), teclas WASD o el D-pad táctil en pantalla. El personaje rota automáticamente hacia la dirección del movimiento y activa la animación de caminata.
- **Música y Efectos de Audio Dinámicos (Web Audio API)**:
  - 🎵 **Música Procedural Multi-Pista**:
    - *Giantucchi Cyber Groove* (Synthwave con bajo y arpegios)
    - *Ambiente Corporativo Futurista* (Chillout relajante)
    - *Fiesta Disco Pop* (Ritmo bailable y dinámico)
    - Opción para cargar tu propia música favorita en formato MP3 o WAV.
  - 🔊 **Efectos de Audio Contextuales (SFX)**:
    - Sonido de pasos acústicos sobre el piso pulido de la oficina al caminar.
    - Acordes musicales y ritmos al activar danzas.
    - Campanilla melódica brillante al saludar (*Wave*).
    - Fanfarria de celebración (*Cheer*).
    - Escaneo cibernético en posturas de alerta (*Alert*).
    - Swoosh de viento/acción en lanzamientos y puntería.
    - Clics táctiles en la interfaz.
  - Control de volumen independiente para música y efectos, botón de silencio instantáneo (🔊 / 🔇) y visualizador de onda musical en vivo.
- **Cámara 3D Orbitable**: Explora el modelo en 360° con el ratón o con los accesos directos de cámara (*Frontal*, *Cuerpo*, *Rostro*, *360° Libre*).
- **Exportación**:
  - 🎬 **Exportar GIF Animado**: Captura cuadro a cuadro la animación del modelo 3D directamente desde el navegador.
  - 📷 **Capturar Foto HD (PNG)**: Descarga una captura en alta resolución del personaje en la oficina.

## Cómo Ejecutar

Para permitir la carga de archivos locales como el modelo 3D (`modelo.gltf`) y la textura de fondo sin restricciones de seguridad del navegador, inicia un servidor local:

```bash
# Con Python 3:
python3 -m http.server 8080
```

Luego abre tu navegador en:
```
http://localhost:8080/
```
