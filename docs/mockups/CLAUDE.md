# EMPROVISA — Helpdesk/ITSM (mockups hi-fi)

Sistema web interno de mesa de ayuda. Empresa de seguridad y vigilancia privada, Nicaragua.
Sedes: Managua, Rivas, León. 63 usuarios.

## Roles
Usuario solicitante · Analista N1 · Especialista N2 (infraestructura/desarrollo) · Jefe de TI · Auditor interno (solo lectura).
Campo = teléfono; TI = escritorio.

## Idioma y formatos
Español de Nicaragua. Fechas dd/mm/aaaa. Hora 24h.

## Paleta
- #0B2545 azul marino — barra superior, encabezados, botones primarios
- #13315C azul corporativo — enlaces, ítem activo de navegación
- #10B981 verde — en plazo, confirmaciones, resueltos
- #F59E0B ámbar — SLA en riesgo (>50% consumido)
- #DC2626 rojo — SLA vencido, P1, errores de validación
- #94A3B8 gris — SLA en pausa, texto secundario, deshabilitado
- Fondo #F8FAFC · tarjetas blancas, borde #E2E8F0, radio 8px

## Tipografía y espaciado
Inter. Cuerpo 14px, títulos 20–28px, tablas 13px. Retícula de 8px.
Sobrio, corporativo, denso. Sin degradados, sombras fuertes ni ilustraciones decorativas.

## Reglas obligatorias
1. Color nunca es el único indicador: todo semáforo lleva etiqueta (En plazo / En riesgo / Vencido / En pausa).
2. Contraste mínimo 4.5:1.
3. Botones ≥40px de alto.
4. Responsive funcional desde 360px.
5. Datos de ejemplo realistas en español: nombres nicaragüenses, sedes Managua/Rivas/León, activos tipo EMP-PC-0142, categorías "Impresora sin conexión", "Alta de usuario en dominio", "Falla de cámara CCTV", "Correo no sincroniza".
6. Sin Lorem ipsum.

## Layout base
- Barra superior azul marino: nombre del sistema (izq), buscador global (centro), campana + avatar con menú (der).
- Navegación lateral izquierda colapsable, ítems según el rol de la pantalla.
- Contenido: título de página, acciones principales arriba a la derecha, migas de pan si hay más de un nivel.

## Método de trabajo
El usuario pide las pantallas de una en una. No adelantarse.
