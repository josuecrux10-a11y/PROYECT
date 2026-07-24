let asistenciasHoy = {};
let preguntasQuizziz = [];
let rangoDocenteSeleccionado = '';
let materiaDocente = "";
let notasSeleccionadas = {p1: '', p2: '', examen: ''};

async function buscarAlumnosRealTime(inputId, listaId) {

    let buscar = document.getElementById(inputId).value.toLowerCase();
    let lista = document.getElementById(listaId);
    let alumnos = await obtenerTodosAlumnos();

    lista.innerHTML = '';

    if (buscar.length < 2) {
        lista.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:50px; color:#666; background:rgba(248,249,250,0.8); border-radius:20px;">
                <h3>🔍 Escribe al menos 2 letras</h3>
                <p>Total alumnos: <strong>${alumnos.length}</strong></p>
            </div>
        `;
        return;
    }

    let filtrados = alumnos.filter(a =>
        (a.nombre || "").toLowerCase().includes(buscar)
    );

    if (filtrados.length === 0) {
        lista.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:50px; color:#666; background:rgba(248,249,250,0.8); border-radius:20px;">
                <h3>👥 No se encontraron alumnos</h3>
                <p>Total alumnos registrados: ${alumnos.length}</p>
            </div>
        `;
        return;
    }

    filtrados.slice(0, 12).forEach((alumno, index) => {

        let div = document.createElement('div');
        div.className = 'alumno-item';

        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h4 style="margin:0; color:#2c3e50;">👤 ${alumno.nombre}</h4>
                <span style="background:linear-gradient(135deg,#4facfe,#00f2fe); color:white; padding:8px 15px; border-radius:25px; font-size:14px; font-weight:600;">
                    #${index + 1}
                </span>
            </div>

            <p style="margin:8px 0; color:#666; font-size:15px;">
                📚 <strong>Alumno</strong>
            </p>

            <div style="margin-top:20px;">
                <button
                    class="btn-calificar"
                    onclick="abrirModalCalificar('${alumno.id}', '${alumno.nombre}')"
                    style="background:linear-gradient(135deg,#27ae60,#2ecc71); width:100%;">
                    ⭐ Calificar Conducta
                </button>
            </div>
        `;

        lista.appendChild(div);
    });
}

async function mostrarDocente(id){

    document.querySelectorAll(".seccionDocente")
        .forEach(s => s.style.display = "none");
        
//SE AÑADIO ESTO
if (id === "resultadosQuizziz") {
        document.getElementById(id).style.display = "block";
        cargarResultadosQuizziz(); // ✅ Llama a la función
        return;
    }

    if(id === "asistenciaD"){

        let fechaCorrecta =
            await verificarFechaInicio();

        if(!fechaCorrecta){
            return;
        }

        document.getElementById(id).style.display = "block";

        cargarCursosAsistencia();

        return;
    }

    let seccion =
        document.getElementById(id);

    if(seccion){
        seccion.style.display = "block";
    }

    if(id === "foroDocente"){
        cargarForoDocente();
    }
}

async function buscarAlumnosNotasRealTime() {
    let buscar = document.getElementById('buscarAlumnoNota').value.toLowerCase();
    let lista = document.getElementById('listaAlumnosNotas');
    let alumnos = await obtenerTodosAlumnos();
    
    lista.innerHTML = '';
    
    if (buscar.length < 2) return;
    
    let filtrados = alumnos.filter(a => 
        (a.nombre || '').toLowerCase().includes(buscar) ||
        (a.nombre && a.nombre.toLowerCase().includes(buscar))
    );
    
    filtrados.slice(0, 12).forEach((alumno, index) => {
        let div = document.createElement('div');
        div.className = 'alumno-item';
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h4 style="margin:0; color:#2c3e50;">👤 ${alumno.nombre}</h4>
                <span style="background:linear-gradient(135deg,#28a745,#20c997); color:white; padding:8px 15px; border-radius:25px; font-size:14px; font-weight:600;">#${index+1}</span>
            </div>
            <p style="margin:8px 0; color:#666; font-size:15px;">
                📚 <strong>${alumno.rol}</strong>
            </p>
            <div style="margin-top:20px;">
                <button class="btn-calificar" onclick="abrirModalNotas('${alumno.id}', '${alumno.nombre}')" 
                        style="background:linear-gradient(135deg,#28a745,#20c997); width:100%;">
                    📝 Calificar Notas
                </button>
            </div>
        `;
        lista.appendChild(div);
    });
}

function buscarAlumnos() {
    buscarAlumnosRealTime('buscarAlumnoConducta', 'listaAlumnosConducta');
}

async function cargarPerfilDocente(){

    const sesion =
        JSON.parse(localStorage.getItem("sesion"));

    const respuesta =
        await fetch(
            `http://localhost:3000/perfil-docente/${sesion.id}`
        );

    const datos =
        await respuesta.json();

    if(!datos.ok) return;

    const docente =
        datos.perfil;

    materiaDocente = docente.materia;

    document.getElementById("dTitulo").value =
        docente.titulo || "";

    document.getElementById("dCorreo").value =
        docente.correo || "";

    document.getElementById("dTelefono").value =
        docente.telefono || "";

    document.getElementById("dExperiencia").value =
        docente.experiencia || "";

    document.getElementById("dFrase").value =
        docente.frase || "";

    document.getElementById("dPresentacion").value =
        docente.presentacion || "";

    if(docente.foto){

    document.getElementById("fotoPreview").src =
        docente.foto;
}

    if (docente.perfil_bloqueado == 1) {

        bloquearPerfilDocente();

    } else {

        desbloquearPerfilDocente();

    }
}

function buscarAlumnosNotas() {
    buscarAlumnosNotasRealTime();
}

document.addEventListener("DOMContentLoaded", () => {

    let inputConducta = document.getElementById("buscarAlumnoConducta");

    if (inputConducta) {
        inputConducta.addEventListener("input", () => {
            buscarAlumnosRealTime(
                "buscarAlumnoConducta",
                "listaAlumnosConducta"
            );
        });
    }

    let inputNotas = document.getElementById("buscarAlumnoNota");

    if (inputNotas) {
        inputNotas.addEventListener("input", () => {
            buscarAlumnosNotasRealTime();
        });
    }

    let fotoInput = document.getElementById("fotoInput");

    if (fotoInput) {
        fotoInput.addEventListener("change", function () {

            let reader = new FileReader();

            reader.onload = e => {
                fotoBase64 = e.target.result;

                let fotoPerfil = document.getElementById("fotoPerfil");

                if (fotoPerfil) {
                    fotoPerfil.src = fotoBase64;
                }
            };

            if (this.files[0]) {
                reader.readAsDataURL(this.files[0]);
            }
        });
    }

});
//FUNCION EN REPARACIÓN
async function abrirModalCalificar(usuarioAlumno, nombreAlumno) {

    let modal = document.createElement("div");

    modal.className = "modal-overlay";
    modal.id = "modalCalificar";

    modal.innerHTML = `

        <div class="modal-content">

            <span class="close-modal"
                  onclick="cerrarModal('modalCalificar')">✕</span>

            <h3 style="margin-top:0;color:#2c3e50;">
                ⭐ Calificar Conducta
            </h3>

            <p style="color:#666;margin-bottom:25px;font-size:18px;">

                <strong>${nombreAlumno}</strong><br>

                <small style="color:#999;">
                    Usuario: ${usuarioAlumno}
                </small>

            </p>

            <label
                style="
                font-weight:700;
                display:block;
                margin-bottom:10px;
                color:#2c3e50;
                ">

                📚 Materia

            </label>

            <select
                id="materiaCalificar"

                style="
                width:100%;
                padding:15px;
                margin-bottom:25px;
                border-radius:12px;
                border:3px solid #e1e5e9;
                font-size:16px;
                ">

            </select>

            <label
                style="
                font-weight:700;
                display:block;
                margin-bottom:18px;
                color:#2c3e50;
                ">

                ⭐ Selecciona la conducta

            </label>

            <div
                style="
                display:grid;
                grid-template-columns:repeat(auto-fit,minmax(160px,1fr));
                gap:15px;
                margin-bottom:25px;
                ">

                <button
                    type="button"
                    class="conducta-btn E"
                    onclick="seleccionarRangoDocente('E',event)">
                    E<br><small>Excelente</small>
                </button>

                <button
                    type="button"
                    class="conducta-btn AA"
                    onclick="seleccionarRangoDocente('AA',event)">
                    AA<br><small>Actitud Aplicada</small>
                </button>

                <button
                    type="button"
                    class="conducta-btn A"
                    onclick="seleccionarRangoDocente('A',event)">
                    A<br><small>Adecuada</small>
                </button>

                <button
                    type="button"
                    class="conducta-btn R"
                    onclick="seleccionarRangoDocente('R',event)">
                    R<br><small>Regular</small>
                </button>

                <button
                    type="button"
                    class="conducta-btn D"
                    onclick="seleccionarRangoDocente('D',event)">
                    D<br><small>Deficiente</small>
                </button>

            </div>

            <div
                id="rangoSeleccionadoDocente"

                style="
                display:none;
                padding:20px;
                background:linear-gradient(135deg,#d4edda,#c3e6cb);
                border-radius:15px;
                margin-bottom:25px;
                text-align:center;
                font-weight:700;
                border:3px solid #28a745;
                color:#155724;
                ">

            </div>

            <label
                style="
                font-weight:700;
                display:block;
                margin-bottom:12px;
                color:#2c3e50;
                ">

                💬 Observaciones (opcional)

            </label>

            <textarea
                id="obsCalificar"

                style="
                width:100%;
                height:130px;
                padding:18px;
                border-radius:12px;
                border:3px solid #e1e5e9;
                font-size:16px;
                font-family:inherit;
                resize:vertical;
                margin-bottom:30px;
                "

                placeholder="Describe el comportamiento específico del alumno...">

            </textarea>

            <div style="display:flex;gap:20px;">

                <button
                    onclick="guardarCalificacion('${usuarioAlumno}','${nombreAlumno}')"

                    style="
                    flex:1;
                    padding:18px;
                    background:linear-gradient(135deg,#27ae60,#2ecc71);
                    color:white;
                    border:none;
                    border-radius:15px;
                    font-weight:700;
                    font-size:18px;
                    cursor:pointer;
                    ">

                    ✅ Guardar Calificación

                </button>

                <button
                    onclick="cerrarModal('modalCalificar')"

                    style="
                    flex:1;
                    padding:18px;
                    background:linear-gradient(135deg,#6c757d,#495057);
                    color:white;
                    border:none;
                    border-radius:15px;
                    font-weight:700;
                    cursor:pointer;
                    ">

                    ❌ Cancelar

                </button>

            </div>

        </div>

    `;

    document.body.appendChild(modal);

    // Cargar las materias asignadas al docente
    await cargarMateriasDocente("materiaCalificar");

}

function seleccionarRangoDocente(rango, event) {
    rangoDocenteSeleccionado = rango;
    let div = document.getElementById('rangoSeleccionadoDocente');
    div.style.display = 'block';
    div.innerHTML = `✅ <strong>${rango}</strong> seleccionado correctamente`;
    
    document.querySelectorAll('.conducta-btn').forEach(btn => {
        btn.classList.remove('seleccionado');
    });
    event.currentTarget.classList.add('seleccionado');
}

async function guardarCalificacion(usuarioAlumno, nombreAlumno) {

    if (!rangoDocenteSeleccionado) {

        alert("⚠️ Por favor selecciona un rango de conducta");
        return;

    }

    let materia = document.getElementById("materiaCalificar").value;
    let observaciones = document.getElementById("obsCalificar").value.substring(0, 200);

    let sesion = JSON.parse(localStorage.getItem("sesion") || "{}");

    console.log("SESION ACTUAL:", sesion);

    // ✅ CORRECCIÓN: Usar el nombre completo del docente, no el ID
    let nombreDocente = sesion.nombreCompleto || sesion.nombre || "Docente";

    console.log("👨‍🏫 Nombre del docente:", nombreDocente);
    console.log("🆔 ID del docente:", sesion.id);

    let conductaNueva = {
        alumno_usuario: usuarioAlumno,
        nombre_alumno: nombreAlumno,
        materia: materia,
        rango: rangoDocenteSeleccionado,
        observaciones: observaciones,
        fecha: new Date().toLocaleDateString("es-ES"),
        hora: new Date().toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit"
        }),
        docente: nombreDocente,  // ✅ Enviamos el NOMBRE, no el ID
        docente_id: sesion.id    // ✅ El ID lo enviamos por separado para autorizaciones
    };

    console.log("📤 Datos a enviar:", conductaNueva);

    try {

        const respuesta = await fetch(
            "http://localhost:3000/guardar-conducta",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(conductaNueva)
            }
        );

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(datos.error);
        }

        alert("✅ Conducta guardada correctamente");
        cerrarModal("modalCalificar");
        rangoDocenteSeleccionado = "";

        // Limpiar el campo de búsqueda
        document.getElementById("buscarAlumnoConducta").value = "";
        document.getElementById("listaAlumnosConducta").innerHTML = "";

    } catch (error) {
        console.error("❌ Error guardando conducta:", error);
        alert("❌ " + error.message);
    }

}

//FUNCION EN REPARACIÓN
async function abrirModalNotas(usuarioAlumno, nombreAlumno){

    let modal = document.createElement("div");

    modal.className = "modal-overlay";
    modal.id = "modalNotas";

    modal.innerHTML = `

        <div class="modal-content">

            <span class="close-modal"
                  onclick="cerrarModal('modalNotas')">✕</span>

            <h3 style="margin-top:0;color:#2c3e50;">
                📝 Calificar Notas
            </h3>

            <p style="color:#666;margin-bottom:25px;font-size:18px;">

                <strong>${nombreAlumno}</strong><br>

                <small style="color:#999;">
                    Usuario: ${usuarioAlumno}
                </small>

            </p>

            <label
            style="
            font-weight:700;
            display:block;
            margin-bottom:10px;
            color:#2c3e50;
            ">

                📚 Materia

            </label>

            <select
                id="materiaNota"
                style="
                width:100%;
                padding:15px;
                margin-bottom:25px;
                border-radius:12px;
                border:3px solid #e1e5e9;
                font-size:16px;
                ">

            </select>

            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:15px;margin-bottom:25px;">

                <div>

                    <label style="font-weight:600;display:block;margin-bottom:10px;">
                        P1
                    </label>

                    <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;">

                        ${[10,9.5,9,8.5,8,7.5,7,6.5,6].map(n=>

                            `<button class="nota-btn"
                                onclick="seleccionarNota(event,'${n}','p1')">${n}</button>`

                        ).join("")}

                    </div>

                </div>

                <div>

                    <label style="font-weight:600;display:block;margin-bottom:10px;">
                        P2
                    </label>

                    <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;">

                        ${[10,9.5,9,8.5,8,7.5,7,6.5,6].map(n=>

                            `<button class="nota-btn"
                                onclick="seleccionarNota(event,'${n}','p2')">${n}</button>`

                        ).join("")}

                    </div>

                </div>

                <div>

                    <label style="font-weight:600;display:block;margin-bottom:10px;">
                        Examen
                    </label>

                    <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;">

                        ${[10,9.5,9,8.5,8,7.5,7,6.5,6].map(n=>

                            `<button class="nota-btn"
                                onclick="seleccionarNota(event,'${n}','examen')">${n}</button>`

                        ).join("")}

                    </div>

                </div>

            </div>

            <div
                id="notasSeleccionadas"
                style="
                display:none;
                padding:25px;
                background:linear-gradient(135deg,#e8f5e8,#d4edda);
                border-radius:15px;
                margin-bottom:30px;
                text-align:center;
                font-weight:700;
                border:3px solid #28a745;
                color:#155724;
                ">

            </div>

            <div style="display:flex;gap:20px;">

                <button
                    onclick="guardarNotaDocente('${usuarioAlumno}','${nombreAlumno}')"
                    style="
                    flex:1;
                    padding:20px;
                    background:linear-gradient(135deg,#28a745,#20c997);
                    color:white;
                    border:none;
                    border-radius:15px;
                    font-weight:700;
                    font-size:18px;
                    cursor:pointer;
                    ">

                    ✅ Guardar Todas las Notas

                </button>

                <button
                    onclick="cerrarModal('modalNotas')"
                    style="
                    flex:1;
                    padding:20px;
                    background:linear-gradient(135deg,#6c757d,#495057);
                    color:white;
                    border:none;
                    border-radius:15px;
                    font-weight:700;
                    cursor:pointer;
                    ">

                    ❌ Cancelar

                </button>

            </div>

        </div>

    `;

    document.body.appendChild(modal);

    await cargarMateriasDocente("materiaNota");

    notasSeleccionadas = {

        p1:"",
        p2:"",
        examen:""

    };

}

function seleccionarNota(event, valor, tipo) {

    notasSeleccionadas[tipo] = valor;

    // ✅ SOLO limpiar grupo actual
    let grupo = event.target.parentElement;

    grupo.querySelectorAll('.nota-btn')
        .forEach(btn => {
            btn.classList.remove('seleccionado');
        });

    event.target.classList.add('seleccionado');

    let div = document.getElementById('notasSeleccionadas');

    div.style.display = 'block';

    let p1 = parseFloat(notasSeleccionadas.p1 || 0);
    let p2 = parseFloat(notasSeleccionadas.p2 || 0);
    let examen = parseFloat(notasSeleccionadas.examen || 0);

    let promedio =
        ((p1 + p2 + examen) / 3).toFixed(2);

    div.innerHTML = `
        ✅ <strong>Notas seleccionadas:</strong><br><br>

        P1: <strong>${notasSeleccionadas.p1 || '---'}</strong> |

        P2: <strong>${notasSeleccionadas.p2 || '---'}</strong> |

        Examen: <strong>${notasSeleccionadas.examen || '---'}</strong>

        <br><br>

        <span style="
            font-size:24px;
            font-weight:900;
            color:${promedio >= 7 ? '#27ae60' : '#e74c3c'};
        ">
            Promedio: ${promedio}
        </span>
    `;
}

async function guardarNotaDocente(usuarioAlumno, nombreAlumno) {

    if (
        !notasSeleccionadas.p1 ||
        !notasSeleccionadas.p2 ||
        !notasSeleccionadas.examen
    ) {
        alert('⚠️ Debes seleccionar las 3 notas');
        return;
    }

    let materia =
        document.getElementById('materiaNota').value;
        
    let materia_id = materiasIds[materia];

    let p1 = parseFloat(notasSeleccionadas.p1);
    let p2 = parseFloat(notasSeleccionadas.p2);
    let examen = parseFloat(notasSeleccionadas.examen);

    let promedio = (p1 + p2 + examen) / 3;

    let sesion =
        JSON.parse(localStorage.getItem("sesion") || '{}');

    let nuevaNota = {

        alumno_id: Number(usuarioAlumno),

        docente_id: Number(sesion.id),

        materia_id: Number(materia_id),

        p1: p1,

        p2: p2,

        examen: examen,

        promedio: promedio

    };

    try {

        const respuesta = await fetch(
            "http://localhost:3000/guardar-nota",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(nuevaNota)
            }
        );

        const data = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(data.error);
        }

        alert("✅ Nota guardada correctamente");

        cerrarModal('modalNotas');

        document.getElementById(
            'buscarAlumnoNota'
        ).value = '';

        document.getElementById(
            'listaAlumnosNotas'
        ).innerHTML = '';

    } catch(error){

    console.error(error);

    alert(error.message);

    }
}

async function cargarMateriasDocente(selectId){

    const sesion =
        JSON.parse(localStorage.getItem("sesion"));

    const respuesta =
        await fetch(
            `http://localhost:3000/materias-docente/${sesion.id}`
        );

    const datos =
        await respuesta.json();

    const select =
        document.getElementById(selectId);

    if(!select) return;

    select.innerHTML = "";

    datos.materias.forEach(materia => {

        select.innerHTML += `

            <option value="${materia.nombre}">
                ${materia.nombre}
            </option>

        `;

    });

}

async function publicarForoDocente() {

    let sesion =
        JSON.parse(localStorage.getItem("sesion"));

    let pregunta =
        document.getElementById("txtForoDocente")
        .value.trim();

    if(!pregunta){
        alert("⚠️ Escribe un tema");
        return;
    }

    await fetch(
        "http://localhost:3000/crear-foro",
        {
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify({
                pregunta,
                docente: sesion.nombreCompleto,
                fecha: new Date().toLocaleString("es-ES"),
                timestamp: Date.now()
            })
        }
    );

    document.getElementById(
        "txtForoDocente"
    ).value = "";

    cargarForoDocente();
    cargarForoAlumno();
}

async function cargarForoDocente() {

    const respuesta =
        await fetch(
            "http://localhost:3000/foros"
        );

    const foros =
        await respuesta.json();

    let contenedor =
        document.getElementById(
            "contenedorForoDocente"
        );

    contenedor.innerHTML = "";

    if(foros.length === 0){

        contenedor.innerHTML = `
            <p style="
                text-align:center;
                color:#888;
                font-style:italic;
            ">
                No hay debates publicados.
            </p>
        `;

        return;
    }

    for(const f of [...foros].reverse()){

        let respuestasHTML = "";

        const respuestaRespuestas =
            await fetch(
                `http://localhost:3000/respuestas-foro/${f.id}`
            );

        const respuestas =
            await respuestaRespuestas.json();

        if(respuestas.length > 0){

            respuestas.forEach(r => {

                respuestasHTML += `
                    <div class="foro-respuesta">

                        <strong>
                            👨‍🎓 ${r.alumno}
                        </strong>

                        <p>
                            ${escaparHTML(r.texto)}
                        </p>

                        <small>
                            ${r.fecha}
                        </small>

                    </div>
                `;
            });

        } else {

            respuestasHTML = `
                <p class="sin-respuestas">

                    Aún no hay respuestas.

                </p>
            `;
        }

        let div =
            document.createElement("div");

        div.className =
            "foro-publicacion";

        div.innerHTML = `
            <div class="foro-meta">

                <span>
                    👨‍🏫 Debate publicado por:
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
                ${respuestasHTML}
            </div>

            <button
                class="btnEliminarForo"
                onclick="eliminarForo(${f.id})">
                🗑️ Eliminar debate
            </button>
        `;

        contenedor.appendChild(div);
    }
}

async function eliminarForo(idForo) {

    if(
        !confirm(
            "❌ ¿Eliminar este debate?"
        )
    ) return;

    try {

        await fetch(
            "http://localhost:3000/eliminar-foro",
            {
                method:"POST",
                headers:{
                    "Content-Type":"application/json"
                },
                body:JSON.stringify({
                    id:idForo
                })
            }
        );

        cargarForoDocente();

    } catch(error){

        console.error(error);

        alert("❌ Error eliminando");
    }
}

async function verificarFechaInicio() {

    const sesion = JSON.parse(localStorage.getItem("sesion"));

    try {

        const respuesta = await fetch(
            `http://localhost:3000/fecha-inicio/${sesion.id}`
        );

        const datos = await respuesta.json();

        // Si el docente todavía no tiene fecha registrada
        if (!datos.fechaInicio) {

            let fecha = prompt(
                "📅 Ingresa la fecha de inicio de clases.\n\nFormato: AAAA-MM-DD\nEjemplo: 2026-07-11"
            );

            if (!fecha || fecha.trim() === "") {

                alert("⚠️ Debes ingresar la fecha de inicio de clases.");

                document.getElementById("asistenciaD").style.display = "none";

                return false;
            }

            fecha = fecha.trim();

            // Validar formato AAAA-MM-DD
            const formatoFecha = /^\d{4}-\d{2}-\d{2}$/;

            if (!formatoFecha.test(fecha)) {

                alert(
                    "❌ Formato de fecha incorrecto.\n\nDebe ser: AAAA-MM-DD\nEjemplo: 2026-07-11"
                );

                document.getElementById("asistenciaD").style.display = "none";

                return false;
            }

            const respuestaGuardar = await fetch(
                "http://localhost:3000/guardar-fecha-inicio",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({

                        docente_id: sesion.id,
                        fechaInicio: fecha,

                        curso: window.cursoActual,
                        paralelo: window.paraleloActual,
                        especialidad: window.especialidadActual

                    })
                }
            );

            const datosGuardar = await respuestaGuardar.json();

            console.log("Respuesta del servidor:", datosGuardar);

            if (!datosGuardar.ok) {

                alert("❌ No se pudo guardar la fecha de inicio.");

                document.getElementById("asistenciaD").style.display = "none";

                return false;
            }

            alert("✅ Fecha de inicio guardada correctamente.");
        }

        return true;

    } catch (error) {

        console.error(error);

        alert("❌ Error verificando la fecha de inicio.");

        document.getElementById("asistenciaD").style.display = "none";

        return false;
    }
}

async function cargarCursosAsistencia() {

    let container =
        document.getElementById("listaCursosAsistencia");

    if (!container) return;

    container.innerHTML = "";

    try {

        const respuesta = await fetch(
            "http://localhost:3000/cursos-asistencia"
        );
        
        const cursos =
            await respuesta.json();

        cursos.forEach(curso => {

            let nombreCarpeta =
                `${curso.curso}-${curso.paralelo}`;

            if (
                curso.especialidad &&
                curso.especialidad.trim() !== ""
            ) {
                nombreCarpeta +=
                    ` (${curso.especialidad})`;
            }

            let div =
                document.createElement("div");

            div.className =
                "carpeta-paralelo";

            div.innerHTML = `
                <div style="
                    font-size:14px;
                    line-height:1.3;
                ">
                    📂 ${nombreCarpeta}
                </div>

                <div class="count">
                    ${curso.total_alumnos} alumno(s)
                </div>
            `;

            div.onclick = () => {

                verListaAsistencia(
                    `${curso.curso}-${curso.paralelo}`,
                    curso.especialidad || null
                );

            };

            container.appendChild(div);

        });

    } catch(error){

        console.error(error);

        container.innerHTML =
            "<p>Error cargando cursos</p>";
    }
}

async function verListaAsistencia(clave, carrera = null) {

    let alumnos = [];

try{

    let partes = clave.split("-");

    let curso = partes[0];
    let paralelo = partes[1];

    window.cursoActual = curso;
    window.paraleloActual = paralelo;
    window.especialidadActual = carrera || "";

    const respuesta = await fetch(
        `http://localhost:3000/alumnos-asistencia?curso=${curso}&paralelo=${paralelo}&especialidad=${carrera || ""}`
    );

    alumnos = await respuesta.json();
    window.alumnosActuales = alumnos;
}catch(error){

    console.error(error);

    alert("Error cargando alumnos");

    return;
}

    let contenido = `
        <div class="caja">

            <h2 style="
                margin-bottom:25px;
                color:#2c3e50;
            ">
                📋 Asistencia - ${clave}
            </h2>

            <button
    onclick="volverCursosAsistencia()"
    style="
        background:#667eea;
        color:white;
        border:none;
        padding:10px 18px;
        border-radius:10px;
        cursor:pointer;
        margin-bottom:20px;
    "
>
    ⬅ Volver a cursos
</button>
        <button
    onclick="
        guardarAsistenciaDelDia(
            '${clave}'
        )
    "
    style="
        background:#28a745;
        color:white;
        border:none;
        padding:10px 18px;
        border-radius:10px;
        cursor:pointer;
        margin-bottom:20px;
        margin-left:10px;
        font-weight:bold;
    "
>
    💾 Guardar asistencia del día
</button>    
            <div style="
                overflow-x:auto;
            ">

                <table style="
                    width:100%;
                    border-collapse:collapse;
                    background:white;
                ">

                    <thead>
    <tr style="
        background:#28a745;
        color:white;
    ">
        <th style="padding:12px;">#</th>

        <th style="padding:12px;">
            👤 Alumno
        </th>

        <th style="padding:12px;">
            ✅ Hoy
        </th>

        <th style="padding:12px;">
            📊 %
        </th>
    </tr>
</thead>
 <tbody>
    `;

    alumnos.forEach((alumno, index) => {

    let idAlumno =
    alumno.nombre.replace(/\s+/g, "_");

    contenido += `
        <tr>

            <td style="padding:10px;">
                ${index + 1}
            </td>

            <td style="padding:10px;">
                ${alumno.nombre}
            </td>

            <td style="
                text-align:center;
                padding:10px;
            ">
                <button
                   onclick="
                        seleccionarAsistencia(
                            ${alumno.id},
                            '${alumno.nombre}',
                            this
                        )
                    "
                    style="
                        background:#6c757d;
                        color:white;
                        border:none;
                        padding:8px 14px;
                        border-radius:8px;
                        cursor:pointer;
                        font-weight:bold;
                    "
                >
                    ⬜ Marcar
                </button>
            </td>

            <td
                id="porcentaje_${idAlumno}"
                style="
                    font-weight:bold;
                    color:red;
                    padding:10px;
                "
            >
                0%
            </td>

        </tr>
    `;
});
contenido += `
        </tbody>
    </table>
</div>

<div style="
    margin-top:40px;
    background:white;
    padding:20px;
    border-radius:15px;
    overflow-x:auto;
">

    <h3 style="
        margin-bottom:20px;
        color:#2c3e50;
    ">
        📊 Historial completo de asistencia
    </h3>

    <table style="
        width:100%;
        border-collapse:collapse;
    ">

        <thead>
            <tr style="
                background:#343a40;
                color:white;
            ">
                <th style="padding:12px;">
                    👤 Alumno
                </th>
            </tr>
        </thead>

        <tbody id="bodyHistorialAsistencia">

        </tbody>

    </table>

</div>
`;

document.getElementById("listaCursosAsistencia").style.display = "none";

let detalle =
    document.getElementById("detalleAsistencia");

detalle.style.display = "block";

detalle.innerHTML = contenido;
cargarTablaHistorial(clave, alumnos);

}

function seleccionarAsistencia(
    alumnoId,
    nombre,
    boton
) {

    if (asistenciasHoy[alumnoId]) {

        delete asistenciasHoy[alumnoId];

        boton.innerText =
            "⬜ Marcar";

        boton.style.background =
            "#6c757d";

    } else {

        asistenciasHoy[alumnoId] = {
            id: alumnoId,
            nombre: nombre
        };

        boton.innerText =
            "✅ Asistió";

        boton.style.background =
            "#28a745";
    }
}

async function cargarTablaHistorial(paralelo, alumnos) {

    let partes = paralelo.split("-");

    let curso = partes[0];
    let paraleloReal = partes[1];

const respuesta = await fetch(
    `http://localhost:3000/asistencias-paralelo?curso=${curso}&paralelo=${paraleloReal}`
);

    const registros = await respuesta.json();

    let fechas = [
        ...new Set(
            registros.map(r => r.fecha)
        )
    ];

    fechas.sort();

    let tabla =
        document.getElementById(
            "bodyHistorialAsistencia"
        );

    if (!tabla) return;

    tabla.innerHTML = "";

    let thead =
        tabla.parentElement
        .querySelector("thead tr");

    // Reiniciar encabezado
    thead.innerHTML = `
        <th style="padding:12px;">
            👤 Alumno
        </th>
    `;

    // Agregar fechas
    fechas.forEach(fecha => {

    let fechaFormateada =
        fecha.substring(0,10)
        .split("-")
        .reverse()
        .join("/");

    thead.innerHTML += `
        <th style="padding:12px;">
            ${fechaFormateada}
        </th>
    `;

});

    alumnos.forEach(alumno => {

        let fila = `
            <tr>
                <td style="
                    padding:10px;
                    font-weight:bold;
                ">
                    ${alumno.nombre}
                </td>
        `;

        fechas.forEach(fecha => {

            let existe = registros.find(r =>
                r.fecha === fecha &&
                r.nombre === alumno.nombre &&
                r.estado === "P"
            );

            fila += `
                <td style="
                    text-align:center;
                    padding:10px;
                ">
                    ${existe ? "✔️" : "❌"}
                </td>
            `;

        });

        fila += "</tr>";

        tabla.innerHTML += fila;

    });

    await calcularPorcentajes(
        paralelo,
        alumnos
    );

}

async function cargarDatosDocentePerfil(){

    const sesion =
        JSON.parse(localStorage.getItem("sesion"));

    try{

        const respuesta =
            await fetch(
                `http://localhost:3000/datos-docente/${sesion.id}`
            );

        const datos =
            await respuesta.json();

        if(!datos.ok) return;

        document.getElementById(
            "nombreDocentePerfil"
        ).innerText =
            datos.docente.nombre;

        document.getElementById(
            "materiaDocentePerfil"
        ).innerText =
            "📚 " +
            (datos.docente.materia ||
             "Materia no asignada");

    }catch(error){

        console.error(error);
    }
}

function volverCursosAsistencia() {

    let detalle =
        document.getElementById("detalleAsistencia");

    detalle.innerHTML = "";

    detalle.style.display = "none";

    document.getElementById(
        "listaCursosAsistencia"
    ).style.display = "grid";
}

async function guardarAsistenciaDelDia(paralelo, carrera) {

    try {

        const sesion =
            JSON.parse(localStorage.getItem("sesion"));

        let hoy = new Date()
            .toISOString()
            .split("T")[0];

        for (const alumno of window.alumnosActuales) {

            const estado =
                asistenciasHoy[alumno.id]
                    ? "P"
                    : "A";

            await fetch(
                "http://localhost:3000/guardar-asistencia",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({

                        alumno_id: alumno.id,
                        docente_id: sesion.id,
                        fecha: hoy,
                        estado

                    })
                }
            );

        }

        alert("✅ Asistencia guardada correctamente");

        asistenciasHoy = {};

        verListaAsistencia(
            paralelo,
            carrera
        );

    } catch (error) {

        console.error(error);

        alert("❌ Error guardando asistencia");

    }

}

async function cargarHistorialAsistencia(
    nombreCompleto,
    paralelo
) {

    const respuesta = await fetch(
        `http://localhost:3000/asistencias-paralelo/${paralelo}`
    );

    const registros = await respuesta.json();

    let historialHTML = "";
    let asistencias = 0;

    let fechasUnicas = [
        ...new Set(
            registros.map(r => r.fecha)
        )
    ];

    let totalClases = fechasUnicas.length;

    registros.forEach(registro => {

        let presente =
            registro.alumno_nombre === nombreCompleto &&
            registro.estado === "P";

        if (presente) {
            asistencias++;
        }

        let fecha =
            registro.fecha
                .split("-")
                .reverse()
                .join("/");

        historialHTML += `
            <div style="
                display:inline-block;
                margin:2px;
                padding:6px 8px;
                border-radius:6px;
                font-size:12px;
                background:${
                    presente
                        ? "#d4edda"
                        : "#f8d7da"
                };
                color:${
                    presente
                        ? "green"
                        : "red"
                };
            ">
                ${fecha}
            </div>
        `;

    });

    let porcentaje =
        totalClases > 0
            ? Math.round(
                (asistencias / totalClases) * 100
            )
            : 0;

    let idAlumno =
        nombreCompleto.replace(/\s+/g, "_");

    let porcentajeElemento =
        document.getElementById(
            "porcentaje_" + idAlumno
        );

    if (porcentajeElemento) {

        porcentajeElemento.innerText =
            porcentaje + "%";

    }

}

async function guardarDocente(){

    const sesion =
        JSON.parse(localStorage.getItem("sesion"));

    const titulo =
        document.getElementById("dTitulo").value.trim();

    const correo =
        document.getElementById("dCorreo").value.trim();

    const telefono =
        document.getElementById("dTelefono").value.trim();

    const experiencia =
        document.getElementById("dExperiencia").value.trim();

    const frase =
        document.getElementById("dFrase").value.trim();

    const presentacion =
        document.getElementById("dPresentacion").value.trim();

    const foto =
        document.getElementById("fotoPreview").src;

    const formacion =
        document.getElementById("dFormacion").value.trim();

    try{
        const respuesta = await fetch(
            "http://localhost:3000/guardar-perfil-docente",
            {
                method:"POST",
                headers:{
                    "Content-Type":"application/json"
                },
                body: JSON.stringify({
                    usuario_id: sesion.id,
                    titulo,
                    correo,
                    telefono,
                    experiencia,
                    frase,
                    formacion,
                    presentacion,
                    foto,
                })
            }
        );

        const datos = await respuesta.json();

        if(datos.ok){

            alert("✅ Perfil guardado correctamente");

            bloquearPerfilDocente();

        }else{

            alert("❌ Error guardando perfil");
        }

    }catch(error){

        console.error(error);

        alert("❌ Error conectando con servidor");
    }
}

function bloquearPerfilDocente(){

    const foto =
        document.getElementById("fotoDocente");

    if(foto) foto.disabled = true;

    const campos = [

        "dTitulo",
        "dCorreo",
        "dTelefono",
        "dExperiencia",
        "dFrase",
        "dFormacion",
        "dPresentacion"

    ];

    campos.forEach(id => {

        const campo =
            document.getElementById(id);

        if(campo){
            campo.disabled = true;
        }

    });

    const btnGuardar =
        document.querySelector(".btn-guardar");

    if(btnGuardar)
        btnGuardar.style.display = "none";

}

function desbloquearPerfilDocente(){

    const foto =
        document.getElementById("fotoDocente");

    if(foto) foto.disabled = false;

    const campos = [

        "dTitulo",
        "dCorreo",
        "dTelefono",
        "dExperiencia",
        "dFrase",
        "dFormacion",
        "dPresentacion"

    ];

    campos.forEach(id=>{

        const campo =
            document.getElementById(id);

        if(campo){

            campo.disabled = false;

        }

    });

    const btnGuardar =
        document.querySelector(".btn-guardar");

    if(btnGuardar){

        btnGuardar.style.display = "inline-block";

    }

}

async function mostrarPerfilProfesor(idDocente){

    const respuesta =
        await fetch(
            `http://localhost:3000/perfil-docente/${idDocente}`
        );

    const datos =
        await respuesta.json();

    if(!datos.ok) return;

    const docente =
        datos.perfil;

    document.getElementById("vistaNombre").innerText =
        docente.nombre || "";

    document.getElementById("vistaTitulo").innerText =
        docente.titulo || "";

    document.getElementById("vistaMateria").innerText =
        docente.materia || "";

    document.getElementById("vistaPresentacion").innerText =
        docente.presentacion || "";

    document.getElementById("vistaFrase").innerText =
        docente.frase || "";

    document.getElementById("vistaCorreo").innerText =
        docente.correo || "";

    document.getElementById("vistaExperiencia").innerText =
        docente.experiencia || "";

    if(docente.foto){

        document.getElementById("vistaFoto").src =
            docente.foto;
    }

    document.getElementById("materias").style.display =
        "none";

    document.getElementById("vistaProfesor").style.display =
        "block";
}

// --- AGREGAR PREGUNTA ---
function agregarPregunta() {
    let container = document.getElementById('preguntasContainer');
    let div = document.createElement('div');
    div.className = 'pregunta-item';
    div.style.cssText = 'background:#f8f9fa; padding:20px; border-radius:12px; margin-bottom:15px; border:2px solid #e9ecef;';
    div.innerHTML = `
        <input type="text" placeholder="❓ Pregunta" style="width:100%; margin-bottom:10px; padding:12px; border-radius:8px; border:2px solid #ddd;" class="pregunta-input">
        <input type="text" placeholder="✅ Respuesta correcta" style="width:100%; margin-bottom:10px; padding:12px; border-radius:8px; border:2px solid #28a745;" class="correcta-input">
        <input type="text" placeholder="❌ Opción incorrecta 1" style="width:100%; margin-bottom:10px; padding:12px; border-radius:8px; border:2px solid #dc3545;" class="incorrecta1-input">
        <input type="text" placeholder="❌ Opción incorrecta 2" style="width:100%; margin-bottom:10px; padding:12px; border-radius:8px; border:2px solid #dc3545;" class="incorrecta2-input">
        <input type="text" placeholder="❌ Opción incorrecta 3" style="width:100%; padding:12px; border-radius:8px; border:2px solid #dc3545;" class="incorrecta3-input">
        <button onclick="eliminarPregunta(this)" style="background:#e74c3c; color:white; border:none; padding:8px 15px; border-radius:8px; cursor:pointer; margin-top:10px;">🗑️ Eliminar</button>
    `;
    container.appendChild(div);
}

// --- ELIMINAR PREGUNTA ---
function eliminarPregunta(boton) {
    let item = boton.parentElement;
    if (document.querySelectorAll('.pregunta-item').length > 1) {
        item.remove();
    } else {
        alert('⚠️ Debe haber al menos una pregunta');
    }
}

// --- GUARDAR QUIZZIZ ---
async function guardarQuizziz() {

    let titulo = document.getElementById("tituloQuizziz").value.trim();
    let materia = document.getElementById("materiaQuizziz").value.trim();

    if (!titulo || !materia) {
        alert("⚠️ Completa el título y la materia");
        return;
    }

    
    let preguntas = [];
    let items = document.querySelectorAll(".pregunta-item");

    items.forEach(item => {
        let pregunta = item.querySelector(".pregunta-input").value.trim();
        let correcta = item.querySelector(".correcta-input").value.trim();
        let incorrectas = [
            item.querySelector(".incorrecta1-input").value.trim(),
            item.querySelector(".incorrecta2-input").value.trim(),
            item.querySelector(".incorrecta3-input").value.trim()
        ];

        if (pregunta && correcta) {
            preguntas.push({
                pregunta: pregunta,
                opcion_a: correcta,
                opcion_b: incorrectas[0] || "",
                opcion_c: incorrectas[1] || "",
                opcion_d: incorrectas[2] || "",
                respuesta_correcta: "A"
            });
        }
    });

    if (preguntas.length === 0) {
        alert("⚠️ Agrega al menos una pregunta");
        return;
    }

    const sesion = JSON.parse(localStorage.getItem("sesion"));

    try {
        // OBTENER LA MATERIA ASIGNADA AL DOCENTE
        const respuestaMateria = await fetch(
            `http://localhost:3000/materia-docente/${sesion.id}`
        );

        const datosMateria = await respuestaMateria.json();

        // ✅ VALIDAR QUE TENGA MATERIA ASIGNADA
        if (!datosMateria.ok || !datosMateria.materia_id) {
            alert("❌ No tienes una materia asignada. Contacta a Rectoría.");
            return;
        }

        console.log("📚 Materia asignada al docente:", datosMateria);

        const respuesta = await fetch(
            "http://localhost:3000/quizzes",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    titulo: titulo,
                    materia_id: datosMateria.materia_id, // ✅ AHORA SÍ TIENE ID
                    docente_id: sesion.id,
                    preguntas: preguntas
                })
            }
        );

        const datos = await respuesta.json();

        if (respuesta.ok) {
            alert("✅ Quiz guardado correctamente");
            document.getElementById("tituloQuizziz").value = "";
            document.getElementById("materiaQuizziz").value = "";
            // Limpiar preguntas (opcional)
            document.getElementById("preguntasContainer").innerHTML = `
                <div class="pregunta-item" style="background:#f8f9fa; padding:20px; border-radius:12px; margin-bottom:15px; border:2px solid #e9ecef;">
                    <input type="text" placeholder="❓ Pregunta" style="width:100%; margin-bottom:10px; padding:12px; border-radius:8px; border:2px solid #ddd;" class="pregunta-input">
                    <input type="text" placeholder="✅ Respuesta correcta" style="width:100%; margin-bottom:10px; padding:12px; border-radius:8px; border:2px solid #28a745;" class="correcta-input">
                    <input type="text" placeholder="❌ Opción incorrecta 1" style="width:100%; margin-bottom:10px; padding:12px; border-radius:8px; border:2px solid #dc3545;" class="incorrecta1-input">
                    <input type="text" placeholder="❌ Opción incorrecta 2" style="width:100%; margin-bottom:10px; padding:12px; border-radius:8px; border:2px solid #dc3545;" class="incorrecta2-input">
                    <input type="text" placeholder="❌ Opción incorrecta 3" style="width:100%; padding:12px; border-radius:8px; border:2px solid #dc3545;" class="incorrecta3-input">
                </div>
            `;
        } else {
            alert("❌ Error al guardar: " + (datos.mensaje || "Error desconocido"));
        }

    } catch (error) {
        console.error(error);
        alert("❌ Error al guardar el Quiz: " + error.message);
    }
}

async function cargarResultadosQuizziz() {

    let container = document.getElementById("listaResultadosQuizziz");

    if (!container) {
        console.error("❌ Contenedor no encontrado");
        return;
    }

    const sesion = JSON.parse(localStorage.getItem("sesion"));

    if (!sesion || !sesion.id) {
        container.innerHTML = `
            <div style="text-align:center; padding:50px; color:#e74c3c;">
                <h3>⚠️ No has iniciado sesión</h3>
            </div>
        `;
        return;
    }

    console.log("🔍 Buscando resultados para docente ID:", sesion.id);

    try {

        const respuesta = await fetch(
            `http://localhost:3000/resultados-quiz-docente/${sesion.id}`
        );

        if (!respuesta.ok) {
            throw new Error(`Error HTTP: ${respuesta.status}`);
        }

        const resultados = await respuesta.json();

        console.log("📊 Resultados recibidos:", resultados);
        console.log("📊 Cantidad de resultados:", resultados.length);

        container.innerHTML = "";

        if (!resultados || resultados.length === 0) {
            container.innerHTML = `
                <div style="
                    text-align:center; 
                    padding:50px; 
                    color:#666;
                    background:#f8f9fa;
                    border-radius:20px;
                ">
                    <h3>📊 No hay resultados disponibles</h3>
                    <p style="color:#999; margin-top:10px;">
                        Aún no hay estudiantes que hayan respondido tus quizzes.
                    </p>
                </div>
            `;
            return;
        }

        // Mostrar cada resultado
        resultados.forEach((r, index) => {

            let div = document.createElement("div");

            div.className = "resultado-quizz-card";

            div.style.borderLeft =
                `6px solid ${
                    parseFloat(r.puntaje) >= 7
                    ? "#27ae60"
                    : "#e74c3c"
                }`;

            const fecha = r.fecha_registro 
                ? new Date(r.fecha_registro).toLocaleString('es-ES')
                : 'Fecha no registrada';

            // Determinar estado del puntaje
            const puntajeNum = parseFloat(r.puntaje);
            let estadoColor = puntajeNum >= 7 ? '#27ae60' : '#e74c3c';
            let estadoTexto = puntajeNum >= 7 ? '✅ Aprobado' : '❌ Reprobado';

            div.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                    <h3 class="resultado-titulo">📝 ${r.quiz_titulo}</h3>
                    <span class="resultado-puntaje"
                        style="background:${estadoColor};">
                        ${r.puntaje}/10
                    </span>
                </div>

                <div style="margin-top:15px; display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:15px;">

                    <div class="resultado-info">
                        <strong>👨‍🎓 Alumno</strong><br>
                        <span>${r.alumno_nombre}</span>
                    </div>

                    <div class="resultado-info">
                        <strong>🎯 Aciertos</strong><br>
                        <span>${r.aciertos}/${r.total_preguntas}</span>
                    </div>

                    <div class="resultado-info">
                        <strong>📅 Fecha</strong><br>
                        <span>${fecha}</span>
                    </div>

                    <div class="resultado-info">
                        <strong>📊 Estado</strong><br>

                        <span
                            class="resultado-estado"
                            style="color:${estadoColor};">

                            ${estadoTexto}

                        </span>

                    </div>

                </div>
            `;

            container.appendChild(div);
        });

    } catch (error) {

        console.error("❌ Error al cargar resultados:", error);

        container.innerHTML = `
            <div style="
                text-align:center; 
                padding:50px; 
                color:#e74c3c;
                background:#f8f9fa;
                border-radius:20px;
            ">
                <h3>❌ Error al cargar resultados</h3>
                <p style="color:#999; margin-top:10px;">
                    ${error.message}
                </p>
                <button 
                    onclick="cargarResultadosQuizziz()" 
                    style="
                        margin-top:20px;
                        background:#4facfe;
                        color:white;
                        border:none;
                        padding:10px 25px;
                        border-radius:10px;
                        cursor:pointer;
                        font-weight:bold;
                    "
                >
                    🔄 Reintentar
                </button>
            </div>
        `;
    }
}

//FUNCION NUEVA
// Función para cerrar modales
function cerrarModal(modalId) {
    let modal = document.getElementById(modalId);
    if (modal) {
        modal.remove();
    }
    
    // Limpiar estados específicos
    if (modalId === 'modalCalificar') {
        rangoDocenteSeleccionado = '';
        // Limpiar selección visual de los botones
        document.querySelectorAll('.conducta-btn').forEach(btn => {
            btn.classList.remove('seleccionado');
        });
        let divRango = document.getElementById('rangoSeleccionadoDocente');
        if (divRango) {
            divRango.style.display = 'none';
        }
    }
    
    if (modalId === 'modalNotas') {
        notasSeleccionadas = {p1: '', p2: '', examen: ''};
        // Limpiar selección visual de los botones de notas
        document.querySelectorAll('.nota-btn').forEach(btn => {
            btn.classList.remove('seleccionado');
        });
        let divNotas = document.getElementById('notasSeleccionadas');
        if (divNotas) {
            divNotas.style.display = 'none';
        }
    }
}

async function notasEstanBloqueadas(){

    const respuesta = await fetch(

        "http://localhost:3000/estado-control-academico"

    );

    const datos = await respuesta.json();

    if(!datos.ok) return false;

    return datos.estado.notas_bloqueadas == 1;

}

async function conductaEstaBloqueada(){

    const respuesta = await fetch(

        "http://localhost:3000/estado-control-academico"

    );

    const datos = await respuesta.json();

    if(!datos.ok) return false;

    return datos.estado.conducta_bloqueada == 1;

}

async function verificarBloqueoNotas(){

    const respuesta = await fetch(
        "http://localhost:3000/estado-control-academico"
    );

    const datos = await respuesta.json();

    if(!datos.ok){

        return false;

    }

    return datos.estado.notas_bloqueadas == 1;

}

async function verificarBloqueoConducta(){

    const respuesta = await fetch(
        "http://localhost:3000/estado-control-academico"
    );

    const datos = await respuesta.json();

    if(!datos.ok){

        return false;

    }

    return datos.estado.conducta_bloqueada == 1;

}