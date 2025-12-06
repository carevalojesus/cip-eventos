# Constitución funcional narrativa del sistema de gestión de eventos (v6.1)

## 0. Visión narrativa del sistema

Imagina una plataforma que se llama, por ejemplo, **SIGE-Eventos**.

El objetivo del sistema es permitir que instituciones (colegios profesionales, universidades, empresas, entidades públicas, etc.) puedan:

-   Crear y publicar eventos (congresos, seminarios, talleres, cursos, charlas).
-   Vender y gestionar entradas e inscripciones.
-   Controlar asistencia presencial y virtual.
-   Gestionar evaluaciones académicas.
-   Emitir, corregir y reemitir certificados nominales.
-   Manejar pagos, comprobantes fiscales y reembolsos.
-   Tener trazabilidad y auditoría de todo lo que ocurre.

A lo largo del documento usaremos siempre a los mismos personajes de ejemplo:

-   **Ana** → ORG_ADMIN del Colegio de Ingenieros (organizadora).
-   **Luis** → participante persona natural (ingeniero).
-   **María** → responsable de una empresa que compra entradas para su equipo.
-   **Carlos** → ponente.
-   **Staff** → equipo que atiende puerta / streaming / notas (roles de staff).

Todo lo que sigue describe **cómo piensa y se comporta el sistema** frente a casos reales y casos borde.

---

## 1. Identidad, cuentas y personas

### 1.1. Personas vs Cuentas

El sistema diferencia claramente entre:

-   **Persona**: el individuo real que aparecerá en certificados, listas de asistencia, comprobantes, etc.
-   **CuentaUsuario**: el usuario que inicia sesión con email y contraseña y tiene roles asignados.

Una Persona puede existir sin que tenga una CuentaUsuario (inscripción sin cuenta). Si luego crea una cuenta con ese mismo correo, el sistema puede vincularla con su Persona existente.

#### Ejemplo

1. Luis entra al enlace del congreso, llena formulario, paga y recibe su ticket.
   No crea cuenta, solo se registra como Persona + Inscripción.
2. Meses después, Luis crea una CuentaUsuario usando el mismo correo.
   El sistema detecta la coincidencia de correo y vincula esa CuentaUsuario con la Persona existente.
   Desde su panel, Luis ve el historial de sus eventos, certificados y comprobantes.

### 1.2. Entidad Persona y duplicidades

**Persona** contiene los datos nominales:

-   Nombres y apellidos.
-   Tipo de documento: DNI / CE / PASAPORTE / OTRO.
-   Número de documento.
-   Correo principal.
-   Celular.
-   País.
-   Fecha de nacimiento.
-   Datos de tutor (si es menor de edad): nombre, documento, teléfono, archivo de autorización.
-   Flags:
    -   `flag_riesgo` (por ejemplo, si ha tenido contracargos o fraude).
    -   `flag_datos_observados` (si hay sospecha sobre la veracidad de sus datos).
-   Vinculación opcional a una CuentaUsuario.
-   Estado de la Persona:
    -   `ACTIVA`,
    -   `FUSIONADA` (si fue absorbida por otra).

#### Regla general de duplicidad

El sistema considera como posibles claves para detectar duplicados:

-   Correo.
-   Combinación tipo_documento + nro_documento.

Si llega una nueva inscripción con correo conocido, el sistema propone vincularla a la Persona ya existente.

### 1.3. Fusión de Personas (merge)

Puede ocurrir que una misma persona se haya registrado dos veces con datos distintos (por ejemplo, una vez con DNI y otra con pasaporte o con otro correo).

#### Ejemplo de duplicidad

-   Primera inscripción:
    -   Persona A: DNI 12345678, correo `luis@gmail.com`.
-   Segunda inscripción a otro evento:
    -   Persona B: PASAPORTE AB1234, correo `luis_travel@gmail.com`.

Ana (ORG_ADMIN) se da cuenta de que A y B son el mismo Luis y decide fusionarlos.

#### Proceso de fusión

1. Ana elige una Persona principal (A) y una Persona secundaria (B).
2. El sistema:
    - Reasigna todas las referencias de B a A en:
        - Inscripciones,
        - InscripcionBloque (inscripción a talleres),
        - Tickets,
        - Roles de participación,
        - Asistencias por sesión,
        - Notas de evaluación,
        - Pedidos de compra (como comprador_persona_id),
        - etc.
    - Actualiza certificados emitidos para que apunten a la Persona principal.
    - Opcionalmente, dispara reemisión de certificados para regenerar PDFs con los datos actualizados.
3. Persona B pasa a estado:
    - `estado_persona = FUSIONADA`,
    - `fusionada_a_persona_id = Persona A`.
4. Documentos fiscales ya emitidos (Boletas/Facturas):
    - **No se modifican** legalmente.
    - El sistema puede seguir referenciándolos al documento original, pero en los listados se puede agrupar por documento o por Persona principal.

Con esto, todo el historial de Luis queda consolidado en una sola Persona, sin perder trazabilidad.

### 1.4. CuentaUsuario y roles

**CuentaUsuario** maneja autenticación y permisos:

-   Email (para login).
-   Contraseña cifrada.
-   Estado (activo, bloqueado, eliminado).
-   Uno o varios roles del sistema.

#### Roles típicos

-   **SUPER_ADMIN**

    -   Administra la plataforma completa.
    -   Ve todos los organizadores, eventos y métricas globales.
    -   Interviene en casos especiales (fraude, soporte avanzado).

-   **ORG_ADMIN** (ej. Ana)

    -   Administra un organizador específico.
    -   Crea, edita y publica eventos.
    -   Define tipos de entrada, bloques, cupones, políticas, plantillas de certificado.
    -   Ve todos los reportes del organizador.
    -   Autoriza reembolsos dentro de ciertas reglas.
    -   Revoca certificados cuando corresponde.

-   **ORG_STAFF_ACCESO**

    -   Staff de puerta o acreditación.
    -   Puede escanear QRs, marcar asistencia.
    -   No ve montos, pagos ni datos sensibles más allá de lo necesario para identificar al asistente.

-   **ORG_STAFF_ACADEMICO**

    -   Gestiona asistencias académicas detalladas y notas.
    -   Puede crear y modificar:
        -   AsistenciaSesion,
        -   NotaParticipante.
    -   Todos sus cambios quedan registrados en el Log de Auditoría.

-   **ORG_FINANZAS**

    -   Ve pagos, reembolsos, facturas, notas de crédito.
    -   Gestiona conciliación con la pasarela de pagos.
    -   No modifica agenda ni evaluaciones, pero sí los estados financieros y comprobantes.

-   **PONENTE** (opcional)

    -   Si se le da acceso, puede ver sus sesiones, subir material, ver asistencia a sus charlas.
    -   No ve datos financieros ni notas de otros.

-   **PARTICIPANTE (con cuenta)**
    -   Puede actualizar su perfil.
    -   Ver su historial de eventos.
    -   Descargar certificados.
    -   Ver comprobantes fiscales donde es receptor.

---

## 2. Organizador, configuración general y zona horaria

### 2.1. Organizador

El **Organizador** representa a la entidad que gestiona eventos:

-   Nombre, RUC, razón social, dirección fiscal.
-   Logo institucional.
-   Si emite o no comprobantes fiscales.
-   Moneda base (PEN, USD, etc.).
-   Textos base de:
    -   Términos y Condiciones,
    -   Política de Privacidad.

#### Ejemplo

El Colegio de Ingenieros del Perú – CD Loreto se registra como Organizador:

-   RUC: 20123456789.
-   Razón social: “COLEGIO DE INGENIEROS DEL PERÚ – CD LORETO”.
-   Moneda base: PEN.
-   Emite comprobantes: sí.
-   Integra con un proveedor de facturación electrónica.

### 2.2. Coorganizadores

Un mismo evento puede tener coorganizadores.

-   **CoorganizadorEvento**:
    -   evento_id,
    -   organizador_id,
    -   rol (coorganizador académico, patrocinador, etc.).

Esto sirve para visibilidad, logos en certificados y reportes, pero normalmente la recaudación principal se asocia al organizador principal.

### 2.3. Zona horaria del evento

Cada evento define un `timezone_evento` (ej. `America/Lima`).

-   Todas las fechas/horas se guardan internamente en UTC.
-   Para mostrar agenda y horarios:
    -   al organizador y a participantes se muestran en la hora local del evento:
        -   “10:00–12:00 (hora de Lima, UTC-5)”.

En una versión posterior, se puede mostrar también la equivalencia en la zona horaria del participante (detectar por navegador).

---

## 3. Diseño del evento: estructura, sesiones y bloques

### 3.1. Entidad Evento

Un Evento tiene, entre otros:

-   Organizador principal.
-   Código interno.
-   Título.
-   Descripción pública.
-   Modalidad: PRESENCIAL / VIRTUAL / MIXTA.
-   Fechas de inicio y fin (UTC, convertidas según timezone_evento).
-   Ubicación si es presencial.
-   Indicador si es de pago o gratuito.
-   Moneda base.
-   Estados del evento:
    -   `borrador`,
    -   `publicado`,
    -   `en_curso`,
    -   `finalizado`,
    -   `cancelado`,
    -   `archivado`.
-   Configuración de menores:
    -   si se permiten,
    -   si requieren autorización.

### 3.2. Días y sesiones

Ana crea el “Congreso Amazónico de Ingeniería 2025”:

-   Evento: 15 al 17 de agosto.
-   Modalidad: MIXTO (presencial y virtual).

Lo divide en días:

-   Día 1 (15/08):

    -   Sesión: Inauguración.
    -   Sesión: Conferencia Magistral 1.
    -   Sesión: Mesa Redonda.

-   Día 2 (16/08):

    -   Sesión: Taller de Ciberseguridad (mañana).
    -   Sesión: Taller de BIM (tarde).

-   Día 3 (17/08):
    -   Sesión: Panel de Innovación.
    -   Sesión: Clausura.

Cada **Sesion** incluye:

-   Título, descripción.
-   Fecha, hora de inicio y fin.
-   Sala (si presencial).
-   Enlace base de streaming (si virtual).
-   Modalidad de la sesión: PRESENCIAL / VIRTUAL / MIXTA.
-   Indicador de si pertenece a un bloque evaluable.
-   Estado: programada, en_curso, finalizada, cancelada.

#### Caso: sesión cancelada

Supongamos que se cancela la “Mesa Redonda”:

-   Esa Sesión pasa a estado `cancelada`.
-   Al calcular horas totales del evento para % de asistencia:
    -   esa sesión ya no se cuenta.
-   Si estaba marcada como “sesión clave” y existe una política de reembolso parcial:
    -   el sistema puede ofrecer reembolsos parciales a los inscritos que tenían derecho a esa sesión.

### 3.3. Bloques evaluables (talleres, cursos, módulos)

Los **Bloques Evaluables** agrupan sesiones que comparten reglas de asistencia y evaluación (por ejemplo un taller de varios días).

Un BloqueEvaluable incluye:

-   Nombre y descripción.
-   Tipo de bloque: TALLER / CURSO / MÓDULO opcional.
-   Sus sesiones asociadas.
-   Configuración de evaluación específica:
    -   nota mínima para aprobar,
    -   cómo se combinan las notas,
    -   porcentaje mínimo de asistencia para obtener certificado de aprobación.

#### Ejemplo: Taller de Ciberseguridad

-   Bloque 1: “Taller de Ciberseguridad”.
-   Incluye dos sesiones:
    -   Día 2, mañana,
    -   Día 3, mañana.
-   ConfigEvaluación del bloque:
    -   Esquema: COMPUESTO.
    -   Nota mínima: 14.
    -   Fórmula: Trabajo (30%) + Examen Final (70%).

Una persona puede:

-   Tener certificado general de participación del Congreso.
-   Y además tener certificado de aprobación del Taller de Ciberseguridad si cumple asistencia y nota.

### 3.4. Ponentes y cortesías

Los ponentes se asocian a sesiones específicas:

-   **SesionPonente**:
    -   sesion_id,
    -   persona_id (del ponente),
    -   rol: PONENTE_PRINCIPAL / CO_PONENTE / MODERADOR / PANELISTA.

Ejemplo:

-   Carlos Pérez es PONENTE_PRINCIPAL en la “Conferencia Magistral 1”.
-   También es CO_PONENTE en el “Taller de Ciberseguridad”.

A la vez, Ana puede darle una **cortesía de ponente**:

-   A nivel de evento:
    -   le da acceso completo sin pagar (`alcance_cortesia = EVENTO_COMPLETO`),
-   O solo a algunas sesiones o bloques:
    -   `alcance_cortesia = SOLO_SESIONES_ASIGNADAS` o a ciertos talleres.

Con esa cortesía:

-   El sistema crea una Inscripción al evento por S/ 0 (si aplica),
-   O una InscripcionBloque por S/ 0 (si la cortesía es solo para un taller).
-   No se genera pago ni comprobante fiscal.

---

## 4. Entradas, cupones, lista de espera y cortesías

### 4.1. Tipos de entrada (TipoEntrada)

Los **Tipos de Entrada** son los productos que se venden (o reservan) al participante.

Ejemplos configurados por Ana:

1. **Pase Completo – General**

    - Alcance: EVENTO_COMPLETO.
    - Precio: S/ 200.
    - Cupo máximo: 200.

2. **Pase Completo – Estudiante**

    - Alcance: EVENTO_COMPLETO.
    - Precio: S/ 120.
    - Cupo máximo: 100.
    - Requiere validación de condición de estudiante.

3. **Pase Virtual**

    - Alcance: EVENTO_COMPLETO.
    - Modalidad: solo virtual.
    - Precio: S/ 100.

4. **Pase Día 1**

    - Alcance: POR_DIA.
    - Referencia a `dia_evento_id` del Día 1.
    - Precio: S/ 80.

5. **Entrada Conferencia Magistral**
    - Alcance: POR_SESION.
    - Referencia a la sesión de la conferencia.
    - Precio: S/ 40.

El alcance define a qué sesiones y qué tipo de certificado puede aspirar la persona.

#### Caso: entrada por sesión

Si alguien compra solo la “Entrada Conferencia Magistral”:

-   Podrá asistir solo a esa sesión.
-   No recibirá certificado general del congreso.
-   Si el evento habilita `permite_certificados_por_sesion`, podrá recibir un certificado de participación por esa sesión específica.

### 4.2. Cupones de descuento

Ana puede crear cupones, por ejemplo:

1. **COLEGIADO20**

    - Tipo: porcentaje (20%).
    - Aplica a: Pase Completo – General.
    - Condición: solo para usuarios que marquen “Soy colegiado” (y si se valida CIP).
    - Máx. 200 usos totales.
    - Máx. 1 uso por Persona.

2. **EARLYBIRD50**
    - Tipo: monto fijo (S/ 50 de descuento).
    - Aplica a: cualquier tipo de entrada.
    - Validez: hasta el 30 de junio.
    - No se acumula con otros cupones.

Reglas generales:

-   Por defecto, solo un cupón por PedidoCompra.
-   El descuento se aplica sobre el monto antes de IGV (si corresponde).
-   Si un cupón expira mientras el usuario está pagando, el sistema recalcula el monto sin cupón y notifica el cambio antes de finalizar.

### 4.3. Lista de espera

Supongamos que el cupo del Pase Completo se agota (200/200 vendidos).

Ana activó `permite_lista_espera` para ese TipoEntrada.

Flujo:

1. Pedro llega cuando ya no hay cupos de Pase Completo.
2. La plataforma le ofrece unirse a la lista de espera.
3. Pedro acepta y queda en estado `en_espera` con un orden de prioridad.
4. Más tarde, un pedido de otro usuario expira (no pagó a tiempo) y se libera 1 cupo.
5. El sistema toma al primer `en_espera`:
    - cambia su estado a `invitado_a_comprar`,
    - genera un link de compra válido, por ejemplo, 24 horas.
6. Pedro recibe un correo con el link.
    - Si compra a tiempo → `convertido_en_inscripcion`.
    - Si no compra dentro del plazo → `vencido` y la oportunidad pasa al siguiente en la lista.

### 4.4. Cortesías (CortesiaEvento)

Las cortesías permiten dar acceso sin costo a ciertas personas:

Ejemplos:

-   Carlos (ponente):
    -   recibe cortesía tipo PONENTE para evento completo.
-   Una autoridad:
    -   recibe cortesía tipo VIP para Pase Completo.
-   Prensa:
    -   puede recibir cortesía específica para sesiones de interés.

Cuando se otorga una cortesía:

-   El sistema crea una Inscripción y/o InscripcionBloque con:
    -   `origen = cortesia`,
    -   monto pagado = 0,
    -   sin generar Pago ni ComprobanteFiscal.

Estas personas se cuentan como inscritas y pueden asistir y recibir certificados según reglas, igual que si hubieran pagado.

---

## 5. Inscripciones, pedidos, pagos y comprobantes

### 5.1. Flujo de inscripción sin cuenta

1. Luis entra a la landing del congreso.
2. Elige la entrada “Pase Completo – General”.
3. Llena el formulario:
    - nombres, apellidos, DNI, correo, celular.
4. Ve y marca el checkbox:
    - “He leído y acepto los Términos y Condiciones y la Política de Privacidad”.
5. El sistema crea:
    - una **Persona** (si no existía),
    - una **Inscripcion** con estado `pendiente_pago`,
    - un **PedidoCompra** con estado `pendiente_pago`.

Mientras el PedidoCompra está en `pendiente_pago`:

-   Se reserva un cupo para Luis en ese TipoEntrada.
-   Se define una `fecha_limite_pago` (ejemplo: 20 minutos u otro valor configurado).

#### Si Luis no paga a tiempo

-   El PedidoCompra pasa a `expirado`.
-   La Inscripcion pasa a `cancelada_por_expiracion`.
-   El cupo reservado se libera.
-   Si hay lista de espera, se dispara el flujo de invitación al siguiente de la lista.

### 5.2. Intentos de pago e integración con pasarela

Cuando Luis hace clic en “Pagar”:

1. El sistema crea un **IntentoPago** con estado `iniciado`.
2. Redirige a la pasarela (Niubiz, Izipay u otra).
3. Posibles resultados:
    - Aprobado:
        - IntentoPago → `aprobado`.
        - Se crea un **Pago** con estado `aprobado`.
        - PedidoCompra → `pagado`.
        - Inscripcion → `confirmada`.
    - Rechazado:
        - IntentoPago → `rechazado`.
        - PedidoCompra sigue `pendiente_pago` (si el tiempo no ha expirado).
        - Luis puede reintentar con otra tarjeta.
    - Error técnico:
        - IntentoPago → `error_tecnico`.
        - Se notifica a Luis para que reintente.

Un PedidoCompra puede tener varios IntentoPago, pero solo un Pago final aprobado.

### 5.3. Comprobantes fiscales y compras posteriores (add-ons)

Si el Organizador emite comprobantes:

-   Cada **Pago aprobado** genera un **ComprobanteFiscal**:
    -   BOLETA o FACTURA,
    -   con datos de receptor (DNI o RUC + nombre/razón social),
    -   con serie y correlativo,
    -   con estado (emitido, anulado, etc.).

#### Caso de María – Compras en momentos distintos

1. María, representante de “INGESOFT SAC”, compra 5 pases completos para sus ingenieros:
    - PedidoCompra A → Pago A → Factura A (con datos de la empresa).
2. Dos semanas después, decide que los mismos ingenieros tomen también el “Taller de Ciberseguridad”:
    - PedidoCompra B → Pago B → Factura B.

No se edita la Factura A para “completarla”; cada pedido genera su propio comprobante.

En el panel de ORG_FINANZAS:

-   Se ve la recaudación total del evento,
-   y el detalle por Factura/Boleta.

### 5.4. Reembolsos, notas de crédito y contracargos

#### Reembolso a solicitud del participante

Supongamos que Luis pide reembolso antes del evento:

-   Ana revisa las políticas de reembolso configuradas:
    -   Por ejemplo:
        -   Más de 30 días antes: 80% de devolución.
        -   Entre 7 y 30 días antes: 50%.
        -   Menos de 7 días: 0%.
-   Si está dentro del plazo y aplica reembolso:
    -   Pago pasa a estado `reembolsado_total` o `reembolsado_parcial`.
    -   ORG_FINANZAS emite la nota de crédito correspondiente al comprobante fiscal.
    -   La Inscripcion se marca como `reembolsada` o `cancelada_por_organizador` según el caso.
    -   Si ya se hubieran emitido certificados (caso de un curso largo):
        -   esos certificados se revocan.

#### Contracargo bancario (chargeback)

Si el banco de Luis revierte el pago (contracargo):

-   ORG_FINANZAS marca el Pago como `contracargo`.
-   La Inscripcion pasa a estado `inscripcion_en_disputa` o `cancelada_por_contracargo`.
-   Cualquier certificado relacionado a esa inscripción se marca como `revocado`.
-   La Persona puede marcarse con `flag_riesgo` para que el organizador tenga cuidado en futuros eventos.

### 5.5. Transferencia de tickets

Si Juan compró una entrada pero no puede asistir y la quiere transferir a Ana:

Condiciones para permitir transferencia:

-   El evento tiene `permite_transferencia_ticket = true`.
-   Se hace antes de la `fecha_limite_transferencias`.
-   No existe asistencia registrada con ese ticket en ninguna sesión.

Flujo:

1. Juan inicia el proceso de transferencia y proporciona los datos de Ana.
2. Si Ana no existe en el sistema, se crea una Persona para ella.
3. El sistema cambia el titular del ticket y de la inscripción:
    - `ticket.persona_id = Ana`,
    - `inscripcion.persona_id = Ana`.
4. Registra una entrada en `TransferenciaTicket` (con quién transfirió, cuándo, quién lo autorizó).
5. Ana podrá asistir y recibir certificados si cumple con las reglas.

---

## 6. Asistencia presencial y virtual

### 6.1. Asistencia presencial

El día del evento, en la puerta del auditorio, el personal de acreditación (ORG_STAFF_ACCESO) utiliza una pantalla especial:

-   Escanea el QR del ticket de Luis.
-   El sistema verifica:
    -   que el ticket exista,
    -   que esté activo,
    -   que corresponda al evento y tipo de acceso correcto para esa sesión.

Si es válido:

-   Registra un `AsistenciaSesion` para Luis:
    -   modalidad = PRESENCIAL,
    -   tipo_asistencia = ASISTENTE,
    -   hora_entrada = momento del escaneo.

Modo simple:

-   Solo se marca entrada, se asume asistencia completa a la sesión.

Modo avanzado:

-   También se puede registrar salida:
    -   al salir, se vuelve a escanear,
    -   el sistema calcula `minutos_asistidos`,
    -   compara con la duración programada de la sesión,
    -   y marca asistencia como completa, parcial o mínima no cumplida.

#### Caso: intento de reutilizar un QR

Si alguien intenta entrar con un QR ya usado:

-   El sistema muestra algo como:
    -   “Este ticket fue usado a las 9:05.”
-   El staff decide si permite reingreso (por ejemplo, si la persona salió al baño y vuelve) o no.

### 6.2. Asistencia virtual

Para las sesiones virtuales o híbridas:

-   El sistema genera un token único de streaming por Persona y por Sesión cuando corresponde.
-   El enlace que recibe Luis incluye ese token.

Cuando Luis se conecta:

-   La plataforma de streaming reporta al sistema:
    -   hora de entrada,
    -   hora de salida,
    -   reconexiones, etc.

El sistema consolida esa información en `AsistenciaSesion`:

-   `modalidad_registro = VIRTUAL`,
-   `minutos_asistidos` = suma de todos los intervalos (hasta el máximo de la duración de la sesión),
-   si supera el mínimo configurado (por ejemplo 70% de la sesión), marca asistencia como `completa`,
-   si es menor pero > 0, puede marcarse como `parcial`,
-   si es 0, `minima_no_cumplida`.

#### Caso: compartir el link de streaming

Si Luis comparte su enlace y se conectan varias personas a la vez con el mismo token:

-   El sistema puede limitar `max_conexiones_simultaneas_por_token`.
-   Si detecta más conexiones de las permitidas:
    -   corta las adicionales,
    -   registra el evento en el log,
    -   opcionalmente marca el caso como sospechoso.

### 6.3. Cálculo del porcentaje de asistencia

Para calcular si una Persona tiene suficiente asistencia para un **evento completo** o un **bloque**:

1. Se suman las horas programadas de todas las sesiones relevantes (que no fueron canceladas).
2. Se suman las horas (o minutos convertidos a horas) asistidas por la Persona.
3. Se calcula:

    - `% asistencia = horas_asistidas / horas_totales_relevantes`.

En función de este porcentaje y de las reglas del evento (min_asistencia_participacion, min_asistencia_aprobacion), se determina si:

-   tiene derecho a certificado de participación,
-   cumple o no el requisito de asistencia para un certificado de aprobación.

---

## 7. Evaluaciones y notas

### 7.1. Configuración de evaluaciones

Para cada evento o bloque evaluable, Ana puede definir una **ConfigEvaluacion** con:

-   Esquema de cálculo:
    -   SIMPLE (una sola nota),
    -   COMPUESTO (varias evaluaciones ponderadas).
-   Nota mínima de aprobación.
-   Política de recuperación (si admite exámenes de recuperación, cuántos intentos, etc.).
-   Descripción de la fórmula (texto).

#### Ejemplo: Taller de Ciberseguridad

ConfigEvaluacion del bloque:

-   Esquema: COMPUESTO.
-   Nota mínima: 14.
-   Fórmula: Trabajo (30%) + Examen final (70%).

Se definen las Evaluaciones:

1. Evaluación “Trabajo práctico”:

    - peso 30%,
    - nota máxima 20.

2. Evaluación “Examen final”:

    - peso 70%,
    - nota máxima 20.

3. Evaluación “Examen de recuperación” (opcional):
    - es_recuperacion = true,
    - con regla, por ejemplo:
        - si la nota de recuperación es mayor que la del examen final, la reemplaza.

### 7.2. Registro y modificación de notas

Rosa (ORG_STAFF_ACADEMICO) entra a la vista de notas del taller:

-   Ve el listado de personas inscritas al bloque.
-   Ingresa las notas de trabajo y examen para cada una.

Cada nota registrada crea un registro de **NotaParticipante**.

Si Rosa comete un error y corrige la nota:

-   El sistema registra un Log de Auditoría indicando:
    -   nota anterior,
    -   nota nueva,
    -   quién hizo el cambio,
    -   fecha y hora,
    -   IP (si se captura).

### 7.3. Cálculo de nota final y aprobación

Para cada participante:

-   La nota final se calcula según la fórmula definida.

Ejemplo con Trabajo (30%) y Examen (70%):

-   Trabajo: 16/20 → 0.8 \* 30% = 24%.
-   Examen: 15/20 → 0.75 \* 70% = 52.5%.
-   Nota final (sobre 20): 24% + 52.5% = 76.5% de 100% → 15.3 ≈ 15.

Si la nota final es ≥ 14 y cumple la asistencia mínima del bloque:

-   el participante es “APROBADO” en ese taller,
-   podrá recibir certificado de aprobación de bloque.

---

## 8. Certificados: tipos, emisión, reemisión

### 8.1. Plantillas y diseño

Ana configura plantillas de certificado para cada tipo:

-   Participación del evento completo.
-   Aprobación del evento (si aplica).
-   Participación de bloque (taller/curso).
-   Aprobación de bloque.
-   Participación por sesión (si se desea).
-   Ponente, organizador, staff.

Cada plantilla define:

-   Imagen de fondo (diseño).
-   Posición del nombre, nombre del evento, rol, horas.
-   Posición del código QR.
-   Una lista de firmantes (nombre, cargo, firmas e imágenes de sello).

### 8.2. Emisión por tipo de certificado

#### a) Certificado de participación general (evento)

Para Luis, que compró Pase Completo:

-   Tiene Inscripción confirmada,
-   Pago aprobado (o cortesía válida),
-   % de asistencia al evento ≥ min_asistencia_participacion.

El sistema crea un Certificado:

-   tipo = PARTICIPACION,
-   referencia al evento,
-   horas (total o asistidas, según la configuración),
-   código único de certificado,
-   versión 1.

#### b) Certificado de aprobación de bloque (taller)

Para alguien inscrito y evaluado en el Taller de Ciberseguridad:

-   InscripcionBloque con estado inscrito (no cancelado, no reembolsado),
-   asistencia al bloque ≥ mínimo definido,
-   nota_final ≥ nota_minima_aprobacion.

Se emite Certificado:

-   tipo = APROBACION_BLOQUE,
-   referencia al bloque,
-   horas del bloque,
-   código de certificado.

#### c) Certificados por sesión individual

Si el evento habilita `permite_certificados_por_sesion` y define una plantilla específica:

-   Una persona que compró solo Entrada a la Conferencia Magistral,
-   y asistió completamente a esa sesión,

puede recibir un certificado:

-   tipo = PARTICIPACION_SESION,
-   que menciona el título de la sesión y sus horas.

#### d) Certificados por rol (ponente, organizador, staff)

Según lo que esté configurado:

-   Ponentes pueden recibir certificado tipo PONENTE,
-   Organizadores, tipo ORGANIZADOR,
-   Staff, tipo STAFF.

Se basan en:

-   RolParticipacionEvento,
-   y, opcionalmente, asistencia registrada como PONENTE/STAFF.

No hay límite en cuántos certificados diferentes puede recibir una misma Persona para un mismo evento (participación, aprobación de varios bloques, ponencia, etc.).

### 8.3. Reemisión, correcciones y versiones

Si Luis escribió mal su nombre (“Luiis”) y no lo corrigió a tiempo antes de la emisión:

1. Luego pide corrección de certificado.
2. Ana revisa y corrige los datos de la Persona (nombre correcto).
3. El sistema:
    - incrementa la `version` del certificado (por ejemplo, versión 2),
    - regenera el PDF con el nombre corregido,
    - mantiene el mismo `codigo_certificado` para la verificación.

Cuando alguien escanea el QR o busca por código:

-   el sistema muestra siempre la versión más reciente del certificado.

Si un certificado se revoca (por ejemplo, por contracargo o fraude):

-   `estado_certificado = revocado`,
-   el verificador indica que el certificado fue revocado y el motivo, sin mostrarlo como válido.

---

## 9. Privacidad, datos personales y eliminación de cuenta

### 9.1. Consentimiento informado

En cada formulario de inscripción, el sistema exige que la Persona marque un checkbox:

> “He leído y acepto los Términos y Condiciones y la Política de Privacidad”.

Sin esto, no se puede completar la inscripción.

El sistema guarda:

-   la fecha y hora de aceptación,
-   la versión de los Términos y la Política aceptados,
-   opcionalmente, la IP.

### 9.2. Eliminación de cuenta y conservación de datos

Si Luis solicita eliminar su CuentaUsuario:

-   Se marca la cuenta como eliminada/baja (no puede volver a iniciar sesión con esa cuenta).
-   La Persona asociada puede ser pseudonimizada si lo exige la ley.

Sin embargo, por obligaciones legales y académicas:

-   se conservan:
    -   registros de inscripciones,
    -   asistencias,
    -   notas,
    -   certificados emitidos,
    -   comprobantes fiscales,
-   con los datos mínimos necesarios para que:
    -   el organizador pueda demostrar la prestación del servicio,
    -   y cumplir obligaciones tributarias.

---

## 10. Seguridad, límites y antifraude

### 10.1. Rate limiting en reservas

Para evitar que alguien bloquee cupos creando muchos pedidos pendientes sin pagar, el sistema define límites:

-   Máximo de pedidos pendientes por Persona.
-   Máximo de pedidos pendientes por IP.

Si se supera el límite:

-   se bloquea la creación de nuevos pedidos pendientes,
-   se invita al usuario a pagar o cancelar los pedidos actuales,
-   se puede requerir CAPTCHA para evitar bots.

### 10.2. Validación de identidad (opcional)

El sistema puede integrarse con servicios de validación de documentos (por ejemplo, RENIEC) para:

-   verificar si el nombre ingresado coincide con el DNI.

Si no coincide o el servicio no responde:

-   se marca la Persona con `flag_datos_observados`,
-   el organizador puede decidir si admite o no esa inscripción.

### 10.3. Seguridad en streaming

Para los accesos virtuales, los tokens de acceso a streaming:

-   son únicos por Persona y por Sesión,
-   tienen ventana de validez (por ejemplo, desde 15 minutos antes de la sesión hasta 30 minutos después),
-   pueden limitar cuántas conexiones simultáneas permite cada token,
-   si se genera un nuevo token (por pérdida o problema), el anterior se invalida.

Todo esto se registra en el Log de Auditoría.

---

## 11. Auditoría (LogAuditoria)

Cualquier cambio relevante en el sistema genera registros de auditoría:

-   Cambios de notas.
-   Cambios de asistencia.
-   Reemisión de certificados.
-   Transferencias de tickets.
-   Fusión de Personas.
-   Cambios en estados de pagos, reembolsos, etc.

Cada registro de auditoría incluye:

-   Entidad afectada (Certificado, Nota, Inscripción, etc.).
-   ID de esa entidad.
-   Acción (CREATE, UPDATE, DELETE).
-   Valores anteriores y nuevos (en JSON o similar).
-   Usuario que hizo el cambio (CuentaUsuario).
-   Fecha y hora.
-   IP (opcional).

Esto permite reconstruir el historial de cualquier dato importante y dar transparencia en caso de reclamos o auditorías externas.

---

## 12. Notificaciones y canales

El sistema maneja una lógica de notificaciones basadas en eventos (triggers).

### 12.1. Tipos de notificación comunes

Ejemplos de situaciones que generan notificaciones:

-   Creación de Inscripción pendiente:
    → se envía correo con resumen del pedido y link de pago.

-   Pago aprobado:
    → se envía correo con confirmación, ticket (QR) y comprobante fiscal (si aplica).

-   Reserva de pedido por expirar (pocos minutos antes):
    → correo recordatorio para pagar antes del vencimiento.

-   Reserva expirada:
    → correo informando que la reserva venció y los cupos se liberaron.

-   Cambio en la agenda (cancelación o reprogramación de una sesión):
    → correo a las Personas afectadas con el detalle del cambio.

-   Certificado disponible:
    → correo con link de descarga de los certificados.

-   Reembolso aprobado:
    → correo indicando importe devuelto y documento relacionado.

### 12.2. Canales actuales y futuros

Por diseño:

-   Canal base (implementado desde la primera versión): **EMAIL**.

El modelo de notificaciones está preparado para ampliar a:

-   SMS (recordatorios críticos).
-   WhatsApp (notificaciones conversacionales).
-   Push notifications (si se desarrolla app móvil).

---

## 13. Reportes y métricas (visión para el equipo)

El sistema no solo ejecuta procesos, también debe entregar información útil.

### 13.1. Reportes para ORG_ADMIN (Ana)

-   Total de inscritos por tipo de entrada, con desglose por estado (confirmados, pendientes, cancelados).
-   Inscritos por rol (asistente, ponente, staff, etc.).
-   Asistencia por sesión (presencial y virtual).
-   Asistencia por bloque evaluable (quién cumple el mínimo y quién no).
-   Número de certificados emitidos vs número de certificados efectivamente descargados.
-   Tasa de conversión:
    -   visitas a la página → inscripciones → pagos aprobados.

### 13.2. Reportes para ORG_FINANZAS

-   Recaudación por evento, por tipo de entrada y por bloque.
-   Pagos por método de pago (tarjeta, depósito, etc.).
-   Comprobantes emitidos vs anulados.
-   Reembolsos y notas de crédito emitidas.
-   Conciliación entre lo que reporta la pasarela de pagos y lo registrado en el sistema.

### 13.3. Reportes para ORG_STAFF_ACADEMICO

-   Listados de participantes “aptos” y “no aptos” para certificados de aprobación.
-   Distribución de notas por bloque o evaluación.
-   Reportes de asistencia detallada para verificar criterios académicos.

### 13.4. Reportes para SUPER_ADMIN

-   Número de eventos por organizador.
-   Volumen de transacciones global.
-   Organizadores con mayor número de contracargos o reembolsos.
-   Detección de patrones de riesgo.

### 13.5. Formatos y entrega

Los reportes se pueden:

-   Visualizar en paneles (dashboards).
-   Exportar en:
    -   CSV,
    -   Excel,
    -   algunos resúmenes en PDF.
-   Programar para envío automático por correo (ej. resumen diario durante un congreso grande).

---

## 14. Resumen para el equipo

Esta “Constitución funcional narrativa v6.1” describe:

-   **Quiénes intervienen**: organizadores, staff, participantes, ponentes, finanzas, admins.
-   **Qué entidades maneja el sistema**: eventos, días, sesiones, bloques, personas, cuentas, inscripciones, pedidos, pagos, comprobantes, asistencias, evaluaciones, certificados, cupones, listas de espera, cortesías, etc.
-   **Cómo se comporta el sistema** en los flujos normales:
    -   inscripción,
    -   pago,
    -   asistencia,
    -   evaluación,
    -   emisión de certificados,
    -   facturación y reembolsos.
-   **Qué pasa en casos borde**:
    -   expiración de reservas,
    -   reembolsos,
    -   contracargos,
    -   sesiones canceladas,
    -   fusión de personas,
    -   corrección de datos,
    -   revocación de certificados,
    -   abuso de reservas,
    -   seguridad en streaming.

Con este documento, el equipo puede:

-   Construir historias de usuario,
-   Definir prioridades de implementación,
-   Pasar al diseño técnico (modelo entidad–relación, API, arquitectura),
-   Sin perder de vista la lógica de negocio y las casuísticas reales que el sistema debe soportar.
