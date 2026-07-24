async function cargarForoAlumno() {

    const respuesta =
    await fetch(
        "http://localhost:3000/foros"
    );

    const foros =
    await respuesta.json();

    let contenedor =
        document.getElementById(
            "contenedorForoAlumno"
        );

    contenedor.innerHTML = "";

    if(foros.length === 0){

        contenedor.innerHTML = `
            <p style="
                text-align:center;
                color:#888;
                font-style:italic;
            ">
                No hay debates disponibles.
            </p>
        `;

        return;
    }

        for (const f of [...foros].reverse()) {
        let respuestasHTML = "";

const respuestaRespuestas =
    await fetch(
        `http://localhost:3000/respuestas-foro/${f.id}`
    );

const respuestas =
    await respuestaRespuestas.json();

respuestas.forEach(r => {

    respuestasHTML += `
    <div class="foro-respuesta">

        <strong>
            👨‍🎓 ${r.alumno}
        </strong>

        <p>
            ${escaparHTML(r.texto)}
        </p>

    </div>
`;
});

        let div =
            document.createElement("div");

        div.className =
            "foro-publicacion";

        div.innerHTML = `

            <div class="foro-meta">

                <span>
                    👨‍🏫 Docente:
                    <strong>${f.docente}</strong>
                </span>

                <span>
                    📅 ${f.fecha}
                </span>

            </div>

            <div class="foro-texto">
                ${escaparHTML(f.pregunta)}
            </div>

            <div style="margin-top:15px;">

                <input
                    type="text"
                    id="respuesta_${f.id}"
                    placeholder="Escribe tu respuesta..."
                >

                <button
                    onclick="responderDebate(${f.id})"
                    style="
                        background: linear-gradient(135deg,#667eea,#764ba2);
                        color:white;
                        border:none;
                        padding:10px 18px;
                        border-radius:10px;
                        font-weight:600;
                        cursor:pointer;
                        margin-top:10px;
                    "
                >
                    💬 Responder
                </button>

            </div>

            <div style="margin-top:15px;">
                ${respuestasHTML}
            </div>
        `;

        contenedor.appendChild(div);
    }
}

async function responderDebate(idForo) {

    let input =
        document.getElementById(
            "respuesta_" + idForo
        );

    let texto =
        input.value.trim();

    if(!texto){

        alert("⚠️ Escribe una respuesta.");
        return;
    }

    let sesion =
        JSON.parse(
            localStorage.getItem("sesion")
        );

    let nombre =
        sesion.nombreCompleto;

    try {

        await fetch(
            "http://localhost:3000/responder-foro",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    foro_id: idForo,
                    alumno: nombre,
                    texto: texto,
                    fecha: new Date()
                        .toLocaleString("es-ES")
                })
            }
        );

        input.value = "";

        cargarForoAlumno();

        alert("✅ Respuesta enviada");

    } catch(error){

        console.error(error);

        alert("❌ Error enviando respuesta");
    }
}

async function cargarConductaAlumno() {

    let user =
        JSON.parse(localStorage.getItem("sesion") || '{}');

    if (!user || !user.nombreCompleto) return;

    try {

        const respuesta = await fetch(
            `http://localhost:3000/conductas/${user.id}`
        );

        const conductasAlumno = await respuesta.json();

        let tabla =
            document.getElementById(
                'tablaConductaAlumno'
            );

        let sinConducta =
            document.getElementById(
                'sinConducta'
            );

        if (conductasAlumno.length === 0) {

            tabla.innerHTML = '';

            sinConducta.style.display = 'block';

            return;
        }

        sinConducta.style.display = 'none';

        tabla.innerHTML = '';

        conductasAlumno.forEach(conducta => {

            let fila = tabla.insertRow();

            fila.innerHTML = `
                <td><strong>${conducta.materia}</strong></td>
                <td>
                    <span class="
                        conducta-badge
                        badge-${conducta.rango}
                    ">
                        ${conducta.rango}
                    </span>
                </td>
                <td>
                    ${conducta.fecha}
                    ${conducta.hora}
                </td>
                <td>${conducta.docente}</td>
                <td>
                    ${conducta.observaciones || 'Sin observaciones'}
                </td>
            `;
        });

    } catch(error){

        console.error(error);

        alert("❌ Error cargando conducta");
    }
}

async function guardarPerfil() {

    let user = JSON.parse(localStorage.getItem("sesion"));

    if (!user) return;

    if (
        !document.getElementById("nombre").value.trim() ||
        !document.getElementById("cedula").value.trim()
    ) {
        alert("❌ Debe ingresar nombre y cédula");
        return;
    }

    let perfil = {
        nombre: document.getElementById("nombre").value.trim(),
        cedula: document.getElementById("cedula").value.trim(),
        especialidad: document.getElementById("especialidad").value,
        nacimiento: document.getElementById("nacimiento").value || null,        
        ciudad: document.getElementById("ciudad").value.trim(),
        curso: document.getElementById("curso").value,
        paralelo: document.getElementById("paralelo").value,
        madre: document.getElementById("madre").value.trim(),
        padre: document.getElementById("padre").value.trim(),
        telPadres: document.getElementById("telPadres").value.trim(),
        emergenciaNombre: document.getElementById("emergenciaNombre").value.trim(),
        emergenciaTel: document.getElementById("emergenciaTel").value.trim(),
        emergenciaRel: document.getElementById("emergenciaRel").value.trim(),
        foto: fotoBase64 || ""
    };

    try {

        const respuesta = await fetch("http://localhost:3000/guardar-perfil", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                usuario_id: user.id,
                ...perfil
            })
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            alert("❌ " + datos.mensaje);
            return;
        }

        document.getElementById("nombreVista").innerText =
            perfil.nombre || user.nombreCompleto;

        document.getElementById("usuarioActivo").innerText =
            `👤 ${perfil.nombre || user.nombreCompleto}`;

        alert("✅ Perfil guardado correctamente");
        verificarNombreReal();

    } catch (error) {

        console.error(error);
        alert("❌ Error al conectar con el servidor");

    }
}

async function verPerfilDocente(idDocente){

    try{

        const respuesta = await fetch(
            `http://localhost:3000/perfil-docente/${idDocente}`
        );

        const datos = await respuesta.json();

        if(!datos.ok){

            alert("Este docente aún no ha completado su perfil");
            return;
        }

        const docente = datos.perfil;

        mostrarSeccion("perfilDocenteAlumno");

        document.getElementById("alumnoVistaFoto").src =
            docente.foto ||
            "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";

        document.getElementById("alumnoVistaNombre").innerText =
            docente.nombre || "";

        document.getElementById("alumnoVistaTitulo").innerText =
            docente.titulo || "";

        document.getElementById("alumnoVistaMateria").innerText =
            docente.materia || "";

        document.getElementById("alumnoVistaTelefono").innerText =
            docente.telefono || "No registrado";

        document.getElementById("alumnoVistaPresentacion").innerText =
            docente.presentacion || "Sin presentación";

        document.getElementById("alumnoVistaFrase").innerText =
            docente.frase || "Sin frase registrada";

        document.getElementById("alumnoVistaCorreo").innerText =
            docente.correo || "No registrado";

        document.getElementById("alumnoVistaExperiencia").innerText =
            docente.experiencia
                ? docente.experiencia + " años de experiencia"
                : "Experiencia no registrada";

        document.getElementById("alumnoVistaFormacion").innerText =
            docente.formacion || "No registrada";             

    }catch(error){

        console.error(error);

        alert("Error cargando perfil docente");
    }
}

async function verificarNombreReal(){

    let sesion =
        JSON.parse(
            localStorage.getItem("sesion")
        );

    if(!sesion) return;

    try {

        const respuesta =
            await fetch(
                `http://localhost:3000/perfil/${sesion.id}`
            );

        const perfil = await respuesta.json();
        console.log("PERFIL:", perfil);

        document.getElementById("nombre").value =
            perfil.nombre || "";

        document.getElementById("cedula").value =
            perfil.cedula || "";

        document.getElementById("nacimiento").value =
            perfil.nacimiento
                ? perfil.nacimiento.substring(0, 10)
                : "";

        document.getElementById("ciudad").value =
            perfil.ciudad || "";

        document.getElementById("curso").value =
            perfil.curso || "Pendiente de asignación";

        document.getElementById("paralelo").value =
            perfil.paralelo || "Pendiente de asignación";

        document.getElementById("especialidad").value =
            perfil.especialidad || "No aplica";

        // 🔒 Bloquear campos que vienen del registro
        document.getElementById("nombre").readOnly = true;
        document.getElementById("curso").readOnly = true;
        document.getElementById("paralelo").readOnly = true;
        document.getElementById("especialidad").readOnly = true;

        document.getElementById("madre").value =
            perfil.madre || "";

        document.getElementById("padre").value =
            perfil.padre || "";

        document.getElementById("telPadres").value =
            perfil.tel_padres || "";

        document.getElementById("emergenciaNombre").value =
            perfil.emergencia_nombre || "";

        document.getElementById("emergenciaTel").value =
            perfil.emergencia_tel || "";

        document.getElementById("emergenciaRel").value =
            perfil.emergencia_rel || "";

        if(perfil.foto){

            fotoBase64 = perfil.foto;

            document.getElementById(
                "fotoPerfil"
            ).src = perfil.foto;
        }

        document.getElementById(
            "nombreVista"
        ).innerText = perfil.nombre || "Alumno";

        // ===============================
        // Controlar si puede editar
        // ===============================

        const puedeEditar = perfil.puede_editar == 1;

        document.getElementById("cedula").readOnly = !puedeEditar;
        document.getElementById("nacimiento").readOnly = !puedeEditar;
        document.getElementById("ciudad").readOnly = !puedeEditar;

        document.getElementById("madre").readOnly = !puedeEditar;
        document.getElementById("padre").readOnly = !puedeEditar;
        document.getElementById("telPadres").readOnly = !puedeEditar;
        document.getElementById("emergenciaNombre").readOnly = !puedeEditar;
        document.getElementById("emergenciaTel").readOnly = !puedeEditar;
        document.getElementById("emergenciaRel").readOnly = !puedeEditar;

        // Mostrar u ocultar botón guardar

        document.getElementById("guardarPerfil").style.display =
            puedeEditar ? "inline-block" : "none";

    } catch(error){

        console.error(error);
    }
}

async function calcularPorcentajes(paralelo, alumnos) {
    let partes = paralelo.split("-");

    let curso = partes[0];
    let paraleloReal = partes[1];

    const respuesta = await fetch(
    `http://localhost:3000/asistencias-paralelo?curso=${curso}&paralelo=${paraleloReal}`
    );

    const registros = await respuesta.json();
console.log("REGISTROS:", registros);
console.log("ALUMNOS:", alumnos);
    let fechasUnicas = [
        ...new Set(
            registros.map(r => r.fecha)
        )
    ];

    let totalClases = fechasUnicas.length;

    alumnos.forEach(alumno => {
        
        let asistenciasAlumno = [
            ...new Set(
                registros
                    .filter(r =>
                        Number(r.alumno_id) === Number(alumno.id) &&
                        r.estado === "P"
                    )
                    .map(r => r.fecha)
            )
        ].length;

        let porcentaje =
            totalClases > 0
                ? Math.round(
                    (asistenciasAlumno / totalClases) * 100
                )
                : 0;

        let nombreAlumno =
            alumno.nombre || "";

        let idAlumno =
            nombreAlumno.replace(/\s+/g, "_");

        let elemento =
            document.getElementById(
                "porcentaje_" + idAlumno
            );

        if (elemento) {

            elemento.innerText =
                porcentaje + "%";

            elemento.style.color =
                porcentaje >= 70
                    ? "green"
                    : "red";
        }

    });

}

async function calcularPromedios() {

    let user = JSON.parse(
        localStorage.getItem("sesion")
    );

    if (!user) return;

    const respuesta = await fetch(
        `http://localhost:3000/notas/${user.id}`
    );

    const notasAlumno = await respuesta.json();
    
    let materias = [
    'Matemáticas',
    'Inglés',
    'Ciudadanía',
    'Química',
    'Emprendimiento',
    'Lengua y Literatura',
    'Historia',
    'Biología',
    'Educación Física',
    'Computación',
    'Tutoría',
    'Proyecto'
];

    materias.forEach(materia => {

        let nota =
        notasAlumno
        .filter(
            n => Number(n.materia_id) === Number(materiasIds[materia])
        )
        .pop();

        let fila =
            Array.from(
                document.querySelectorAll("#tablaNotas tr")
            ).find(row =>
                row.cells[0].textContent.trim() === materia
            );

        if (fila && nota) {

            let celdas = fila.cells;

            celdas[1].textContent = Number(nota.p1).toFixed(1);
            celdas[2].textContent = Number(nota.p2).toFixed(1);
            celdas[3].textContent = Number(nota.examen).toFixed(1);
            celdas[4].textContent = Number(nota.promedio).toFixed(2);

            if (nota.promedio >= 7) {

                celdas[5].innerHTML =
                    "✅<br><strong>APROBADO</strong>";

            } else {

                celdas[5].innerHTML =
                    "❌<br><strong>REPROBADO</strong>";
            }
        }
    });
}

function mostrarSeccion(id){

    document.querySelectorAll(".seccion").forEach(s => s.style.display = "none");

    document.getElementById(id).style.display = "block";

    if(id === "notas") calcularPromedios();
    if(id === "conducta") cargarConductaAlumno();
    if(id === "foroAlumno") cargarForoAlumno();
    if(id === "quizzizAlumno") cargarQuizzizAlumno();
    if(id === "horario") cargarHorarioAlumno();

}

async function cargarMateriasAlumno() {

    const tabla = document.getElementById("tablaMateriasAlumno");

    if (!tabla) return;

    tabla.innerHTML = "";

    const materias = [
        "Matemática",
        "Inglés",
        "Ciudadanía",
        "Química",
        "Emprendimiento",
        "Lengua y Literatura",
        "Biología",
        "Historia",
        "Educación Física",
        "Tutoría",
        "Proyecto",
        "Computación"
    ];

    try {

        const respuesta = await fetch("http://localhost:3000/docentes-asignados");

        const docentesAsignados = await respuesta.json();

        console.table(docentesAsignados);

        materias.forEach(materia => {

            const asignacion = docentesAsignados.find(d =>
                d.materia_nombre &&
                d.materia_nombre.trim().toLowerCase() === materia.trim().toLowerCase()
            );

            tabla.innerHTML += `
                <tr>

                    <td>${materia}</td>

                    <td>

                        ${
                            asignacion
                            ? `
                                <span
                                    class="docente-link"
                                    onclick="verPerfilDocente(${asignacion.docente_id})">
                                    ${asignacion.nombre}
                                </span>
                              `
                            : "-"
                        }

                    </td>

                </tr>
            `;

        });

    } catch (error) {

        console.error("❌ Error cargando materias:", error);

    }

}

// --- CARGAR QUIZZIZ PARA ALUMNO ---
async function cargarQuizzizAlumno() {

    let container =
        document.getElementById(
            "listaQuizzizAlumno"
        );

    if(!container) return;

    try{

        const respuesta =
            await fetch(
                "http://localhost:3000/quizzes"
            );

        const quizzes =
            await respuesta.json();

        container.innerHTML = "";

        if(quizzes.length === 0){

            container.innerHTML = `
                <div style="text-align:center; padding:50px; color:#666;">
                    <h3>📭 No hay Quizzes disponibles</h3>
                    <p>Tus docentes aún no han creado quizzes</p>
                </div>
            `;

            return;
        }

        quizzes.forEach(q => {

            let div =
                document.createElement("div");

            div.className =
                "quizziz-card";

            div.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; margin-bottom:10px;">
                    <h3 style="margin:0;">
                        ${q.titulo}
                    </h3>

                    <span style="background:#4facfe; color:white; padding:5px 15px; border-radius:20px; font-size:14px;">
                        ${q.materia}
                    </span>
                </div>

                <button
                    onclick="iniciarQuizziz(${q.id})"
                    style="background:linear-gradient(135deg,#4facfe,#00f2fe); color:white; border:none; padding:12px 25px; border-radius:10px; cursor:pointer; font-weight:bold; width:100%; margin-top:10px;">

                    🎮 Iniciar Quiz

                </button>
            `;

            container.appendChild(div);

        });

    }
    catch(error){

        console.error(error);

        container.innerHTML = `
            <div style="text-align:center; padding:50px; color:red;">
                Error al cargar quizzes
            </div>
        `;
    }
}

// --- INICIAR QUIZZIZ ---
async function iniciarQuizziz(id) {

    const sesion =
        JSON.parse(
            localStorage.getItem("sesion")
        );

    try{

        // Verificar si ya respondió
        const verificacion =
            await fetch(
                `http://localhost:3000/quiz-respondido/${id}/${sesion.id}`
            );

        const estado =
            await verificacion.json();

        if(estado.respondido){

            alert(
                "⚠️ Ya respondiste este Quiz"
            );

            return;
        }

        const respuesta =
            await fetch(
                `http://localhost:3000/quizzes/${id}`
            );

        const quizziz =
            await respuesta.json();

        if(!quizziz){

            alert("❌ Quiz no encontrado");
            return;
        }

        let modal =
            document.createElement("div");

        modal.className =
            "modal-overlay";

        modal.id =
            "modalQuizziz";

        modal.style.cssText =
            "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:2000; display:flex; justify-content:center; align-items:center;";

        let preguntasHTML =
            quizziz.preguntas.map((p,index)=>`

            <div class="pregunta-quizziz"
                data-index="${index}"
                style="display:${index===0?'block':'none'};">

                <h3>
                    Pregunta ${index+1}
                    de ${quizziz.preguntas.length}
                </h3>

                <p style="font-size:18px;">
                    ${p.pregunta}
                </p>

                <div class="opciones-container">

                    ${
                        [
                            p.opcion_a,
                            p.opcion_b,
                            p.opcion_c,
                            p.opcion_d
                        ]
                        .sort(() => Math.random() - 0.5)
                        .map(op=>`

                            <button
                                onclick="seleccionarOpcionQuizziz(this,'${op}',${index})"
                                style="display:block; width:100%; padding:15px; margin:8px 0;">

                                ${op}

                            </button>

                        `).join("")
                    }

                </div>

                <div style="margin-top:20px; display:flex; justify-content:space-between;">

                    <button
                        onclick="cambiarPreguntaQuizziz(${index-1})"
                        ${index===0 ? "disabled" : ""}>

                        ⬅ Anterior

                    </button>

                    <button
                        onclick="cambiarPreguntaQuizziz(${index+1})"
                        ${index===quizziz.preguntas.length-1 ? "disabled" : ""}>

                        Siguiente ➡

                    </button>

                </div>

            </div>

        `).join("");

        modal.innerHTML = `

            <div style="background:white; border-radius:20px; padding:30px; max-width:600px; width:90%; max-height:90%; overflow:auto;">

                <div style="display:flex; justify-content:space-between; align-items:center;">

                    <h2>${quizziz.titulo}</h2>

                    <button onclick="cerrarModalQuizziz()">
                        ×
                    </button>

                </div>

                <div id="quizzizPreguntasContainer">

                    ${preguntasHTML}

                </div>

                <div style="margin-top:20px; text-align:center;">

                    <button
                        onclick="enviarRespuestasQuizziz(${id})">

                        📤 Enviar Respuestas

                    </button>

                </div>

            </div>

        `;

        document.body.appendChild(modal);

        window.quizzizActual =
            quizziz;

        window.respuestasAlumno =
            {};

    }
    catch(error){

        console.error(error);

        alert(
            "❌ Error al cargar el Quiz"
        );
    }
}

function cerrarModalQuizziz() {
    let modal = document.getElementById('modalQuizziz');
    if (modal) modal.remove();
}

// --- SELECCIONAR OPCIÓN ---
function seleccionarOpcionQuizziz(boton, opcion, index) {
    let contenedor = boton.parentElement;
    contenedor.querySelectorAll('button').forEach(btn => {
        btn.style.background = '#f8f9fa';
        btn.style.borderColor = '#ddd';
        btn.style.color = '#333';
    });
    boton.style.background = '#4facfe';
    boton.style.borderColor = '#4facfe';
    boton.style.color = 'white';
    
    window.respuestasAlumno[index] = opcion;
}
// --- CAMBIAR PREGUNTA ---
function cambiarPreguntaQuizziz(index) {
    let preguntas = document.querySelectorAll('.pregunta-quizziz');
    preguntas.forEach((p, i) => {
        p.style.display = i === index ? 'block' : 'none';
    });
}
// --- ENVIAR RESPUESTAS ---
async function enviarRespuestasQuizziz(id) {

    const sesion =
        JSON.parse(
            localStorage.getItem("sesion")
        );

    const quizziz =
        window.quizzizActual;

    if(!quizziz){

        alert("❌ Quiz no encontrado");
        return;
    }

    let totalPreguntas =
        quizziz.preguntas.length;

    let respondidas =
        Object.keys(
            window.respuestasAlumno
        ).length;

    if(respondidas < totalPreguntas){

        alert(
            `⚠️ Respondiste ${respondidas} de ${totalPreguntas} preguntas`
        );

        return;
    }

    let aciertos = 0;

    quizziz.preguntas.forEach((p,index)=>{

        let correcta = "";

switch(p.respuesta_correcta){

    case "A":
        correcta = p.opcion_a;
        break;

    case "B":
        correcta = p.opcion_b;
        break;

    case "C":
        correcta = p.opcion_c;
        break;

    case "D":
        correcta = p.opcion_d;
        break;
}

        if(
            window.respuestasAlumno[index]
            ===
            correcta
        ){
            aciertos++;
        }

    });

    const puntaje =
        Math.round(
            (aciertos / totalPreguntas) * 10
        );

    try{

        await fetch(
            "http://localhost:3000/resultados_quiz",
            {
                method:"POST",
                headers:{
                    "Content-Type":"application/json"
                },
                body: JSON.stringify({
                    quiz_id: id,
                    estudiante_id: sesion.id,
                    aciertos: aciertos,
                    total_preguntas: totalPreguntas,
                    puntaje: puntaje
                })
            }
        );

        alert(
            `✅ Quiz completado\n📊 Puntaje: ${puntaje}/10\n🎯 Aciertos: ${aciertos}/${totalPreguntas}`
        );

        cerrarModalQuizziz();

        cargarQuizzizAlumno();

    }
    catch(error){

        console.error(error);

        alert(
            "❌ Error al guardar resultado"
        );
    }
}

async function cargarHorarioAlumno() {
    console.log("🕒 Cargando horario del alumno...");

    const sesion = JSON.parse(localStorage.getItem("sesion"));
    if (!sesion || !sesion.id) {
        console.error("❌ No hay sesión activa");
        return;
    }

    try {
        const res = await fetch(`http://localhost:3000/horario-alumno/${sesion.id}`);
        
        if (!res.ok) {
            console.error("❌ Error en la respuesta:", res.status);
            return;
        }

        const horario = await res.json();
        console.log("📋 Horario recibido:", horario);

        // Limpiar todas las celdas
        document.querySelectorAll(".tabla-horario td[id]").forEach(td => {
            td.innerHTML = "";
            td.style.background = "white";
        });

        if (horario.length === 0) {
            document.querySelectorAll(".tabla-horario td[id]").forEach(td => {
                td.innerHTML = '<span style="color:#999;">—</span>';
            });
            return;
        }

        horario.forEach(h => {
            let bloque = 0;

            switch (h.hora_inicio) {
                case "07:00:00": bloque = 1; break;
                case "07:40:00": bloque = 2; break;
                case "08:20:00": bloque = 3; break;
                case "09:20:00": bloque = 4; break;
                case "10:00:00": bloque = 5; break;
                case "10:40:00": bloque = 6; break;
                case "11:20:00": bloque = 7; break;
                default: 
                    console.warn("⚠️ Hora no mapeada:", h.hora_inicio);
                    return;
            }

            // Formatear el nombre del día (primera letra mayúscula)
            const dia = h.dia.charAt(0).toUpperCase() + h.dia.slice(1).toLowerCase();
            const id = `${dia}${bloque}`;

            const celda = document.getElementById(id);
            if (celda) {
                celda.innerHTML = `
                    <strong style="font-size:14px;">${h.materia}</strong>
                    <br>
                    <small style="font-size:11px; color:#666;">${h.docente}</small>
                `;
                celda.style.background = "#f0f8ff";
                celda.style.borderRadius = "5px";
                celda.style.padding = "5px";
            } else {
                console.warn(`⚠️ Celda no encontrada: ${id}`);
            }
        });

        console.log("✅ Horario cargado correctamente");

    } catch (error) {
        console.error("❌ Error cargando horario:", error);
    }
}

function mostrarHorario(){

    document.querySelectorAll(".seccion").forEach(seccion=>{

        seccion.style.display="none";

    });

    document.getElementById("horario").style.display="block";

    cargarHorarioAlumno();

}