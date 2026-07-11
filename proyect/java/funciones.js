let asistenciasHoy = {};
let alumnosBase = {};
let usuariosRegistrados = [];
let preguntasQuizziz = [];
function escaparHTML(texto) {
    if (!texto) return "";
    return texto
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

document.addEventListener("DOMContentLoaded", () => {

    const rol = document.getElementById("regRol");
    const panel = document.getElementById("materiasDocente");

    if (rol && panel) {
        rol.addEventListener("change", function () {
            panel.style.display =
                this.value === "docente"
                ? "block"
                : "none";
        });
    }

    // FOTO DEL DOCENTE
    const fotoDocente =
        document.getElementById("fotoDocente");

    if (fotoDocente) {

        fotoDocente.addEventListener("change", function(e){

            const archivo = e.target.files[0];

            if(!archivo) return;

            const lector = new FileReader();

            lector.onload = function(ev){

                document.getElementById("fotoPreview").src =
                    ev.target.result;
            };

            lector.readAsDataURL(archivo);
        });
    }

});
const materiasIds = {
    "Matemáticas": 1,
    "Inglés": 2,
    "Ciudadanía": 3,
    "Química": 4,
    "Emprendimiento": 5,
    "Lengua y Literatura": 6,
    "Biología": 7,
    "Historia": 8,
    "Educación Física": 9,
    "Tutoría": 10,
    "Proyecto": 11,
    "Computación": 12
};

const ESTRUCTURA_PARALELO = {
    // Básico: SOLO 8,9,10 A/B
    basico: {
        "8-A": [], "8-B": [],
        "9-A": [], "9-B": [],
        "10-A": [], "10-B": []
    },
    // Bachillerato: 1B,2B,3B por carrera A/B
    bachillerato: {
        computacion: { "1B-A": [], "1B-B": [], "2B-A": [], "2B-B": [], "3B-A": [], "3B-B": [] },
        contabilidad: { "1B-A": [], "1B-B": [], "2B-A": [], "2B-B": [], "3B-A": [], "3B-B": [] },
        ciencias: { "1B-A": [], "1B-B": [], "2B-A": [], "2B-B": [], "3B-A": [], "3B-B": [] }
    }
};

const recargaOriginal = location.reload;

async function inicializarSistema() {
    try {
        const res = await fetch("http://localhost:3000/usuarios");
        usuariosRegistrados = await res.json();

        console.log("✅ Usuarios cargados desde MySQL:", usuariosRegistrados);

    } catch (e) {
        console.error("❌ Error cargando usuarios:", e);
        usuariosRegistrados = [];
    }

    alumnosBase = JSON.parse(JSON.stringify(ESTRUCTURA_PARALELO));

    console.log("✅ Sistema inicializado correctamente (MySQL)");
}

async function registrar() {

    let rol =
        document.getElementById("regRol").value;

    let nombreCompleto = "";

    if (rol === "docente") {

        const titulo =
            document.getElementById("tituloDocente").value;

        const nombre =
            document.getElementById("regNombre").value.trim();

        nombreCompleto =
            `${titulo} ${nombre}`;

    } else {

        nombreCompleto =
            document.getElementById("regNombreSolo").value.trim();

    }

    let pass =
        document.getElementById("regPass").value;

    let cursoAlumno =
        document.getElementById("cursoAlumno")?.value || "";

    let especialidadAlumno =
        document.getElementById("especialidadAlumno")?.value || "";

    let claveRector =
        document.getElementById("claveRector")?.value.trim() || "";

    if (!rol) {

        return mostrarMensaje(
            "❌ Seleccione un rol",
            "error"
        );

    }

    if (!nombreCompleto || !pass) {

        return mostrarMensaje(
            "❌ Completa todos los campos",
            "error"
        );

    }

    if (rol === "alumno") {

        if (!cursoAlumno) {

            return mostrarMensaje(
                "❌ Seleccione un curso",
                "error"
            );

        }

        if (
            ["1BGU", "2BGU", "3BGU"].includes(cursoAlumno)
            &&
            !especialidadAlumno
        ) {

            return mostrarMensaje(
                "❌ Seleccione una especialidad",
                "error"
            );

        }
    }

    try {

        let materiasSeleccionadas = [];

        if (rol === "docente") {

            materiasSeleccionadas = Array.from(
                document.querySelectorAll(
                    "#materiasDocente input:checked"
                )
            ).map(c => c.value);

        }

        const existeRes = await fetch(
            "http://localhost:3000/verificar-usuario",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    nombre: nombreCompleto
                })
            }
        );

        const existeData =
            await existeRes.json();

        if (existeData.existe) {

            return mostrarMensaje(
                "❌ Usuario ya existe",
                "error"
            );

        }

        const res = await fetch(
            "http://localhost:3000/registrar",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    nombre: nombreCompleto,
                    password: pass,
                    rol: rol,
                    curso: cursoAlumno,
                    especialidad: especialidadAlumno,
                    materias: materiasSeleccionadas
                })
            }
        );

        const data = await res.json();

        console.log(data);

        mostrarMensaje(
            "✅ Usuario registrado correctamente",
            "success"
        );

        if (document.getElementById("regNombre")) {

            document.getElementById("regNombre").value = "";

        }

        if (document.getElementById("regNombreSolo")) {

            document.getElementById("regNombreSolo").value = "";

        }

        document.getElementById("regPass").value = "";

        document
            .querySelectorAll(
                "#materiasDocente input:checked"
            )
            .forEach(c => c.checked = false);

        cargarPanelRector();

    } catch (error) {

        console.error(error);

        mostrarMensaje(
            "❌ Error al registrar",
            "error"
        );

    }
}

function mostrarMensaje(texto, tipo) {
    let mensaje = document.getElementById("mensaje");
    if (!mensaje) return; // Verificación de seguridad
    mensaje.innerText = texto;
    mensaje.style.color = tipo === "error" ? "#e13b28" : "#28e13b";
    setTimeout(() => mensaje.innerText = "", 4000);
}

function cargarPanelRector() {
    cargarNuevosRegistrados();  // ✅ Pendientes del registro
    cargarCarpetasParalelos();  // ✅ Paralelos organizados
}

async function asignarUsuario(nombreCompleto, paraleloClave) {

    try {

        // 🔹 1. obtener usuario desde backend
        const res = await fetch("http://localhost:3000/usuarios");
        const usuarios = await res.json();

        let usuario = usuarios.find(u => u.nombre === nombreCompleto);

        if (!usuario) {
            return mostrarMensaje("❌ Usuario no encontrado", "error");
        }

        // 🔹 2. actualizar en MySQL
        const updateRes = await fetch("http://localhost:3000/asignar-usuario", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: usuario.id,
                paralelo: paraleloClave
            })
        });

        const data = await updateRes.json();
        console.log(data);

        // 🔹 3. actualizar memoria local
        if (!alumnosBase.basico[paraleloClave]) {
            alumnosBase.basico[paraleloClave] = [];
        }

        // evitar duplicados
        let existe = alumnosBase.basico[paraleloClave]
            .find(a => a.nombreCompleto === nombreCompleto);

        if (!existe) {

            alumnosBase.basico[paraleloClave].push({
                nombreCompleto,
                paralelo: paraleloClave
            });
        }

        mostrarMensaje(
            `✅ ${nombreCompleto} asignado a ${paraleloClave}`,
            "success"
        );

        cargarPanelRector();

    } catch (error) {
        console.error(error);
        mostrarMensaje("❌ Error al asignar usuario", "error");
    }
}

async function cargarNuevosRegistrados() {

    try {

        const res =
            await fetch("http://localhost:3000/alumnos-pendientes");

        const alumnos = await res.json();

        const container =
            document.getElementById("nuevosUsuarios");

        container.innerHTML = "";

        if (alumnos.length === 0) {

            container.innerHTML = `
                <p>✅ No hay alumnos pendientes</p>
            `;

            return;
        }

        alumnos.forEach(alumno => {

            let div = document.createElement("div");

            div.className = "usuario-card";

            div.innerHTML = `
                <h4>${alumno.nombre}</h4>

                <p>
                    Curso: ${alumno.curso || "Sin curso"}
                </p>

                <p>
                    Especialidad:
                    ${alumno.especialidad || "No aplica"}
                </p>

                <button onclick="
                    asignarAlumno(
                        ${alumno.usuario_id},
                        '${alumno.curso}',
                        'A'
                    )
                ">
                    Paralelo A
                </button>

                <button onclick="
                    asignarAlumno(
                        ${alumno.usuario_id},
                        '${alumno.curso}',
                        'B'
                    )
                ">
                    Paralelo B
                </button>
            `;

            container.appendChild(div);

        });

    } catch (error) {

        console.error(error);

    }

}

async function cargarCarpetasParalelos() {

    try {

        const res =
            await fetch("http://localhost:3000/paralelos");

        const alumnos =
            await res.json();

        let container =
            document.getElementById("carpetasParalelos");

        if (!container) return;

        container.innerHTML = "";

        let carpetas = {};

        alumnos.forEach(alumno => {

            let clave =
                `${alumno.curso}-${alumno.paralelo}`;

            if (!carpetas[clave]) {

                carpetas[clave] = [];

            }

            carpetas[clave].push(alumno);

        });

        Object.keys(carpetas).forEach(clave => {

            crearCarpetaParalelo(
                container,
                `📁 ${clave}`,
                clave,
                carpetas[clave]
            );

        });

    } catch (error) {

        console.error(error);

    }

}

function crearCarpetaParalelo(container, nombre, clave, alumnos) {

    let div = document.createElement("div");

    div.className = "carpeta-paralelo";

    div.onclick = () =>
        verAlumnosParalelo(clave);

    div.innerHTML = `
        <div style="font-size:14px; line-height:1.3;">
            ${nombre}
        </div>
        <div class="count">
            ${alumnos.length}/15 alumnos
        </div>
    `;

    container.appendChild(div);

}

async function restablecerFechaInicio() {

    let confirmar = confirm(
        "⚠️ ¿Seguro que deseas restablecer la fecha de inicio?\n\nTodos los docentes deberán configurar una nueva fecha."
    );

    if (!confirmar) return;

    try {

        const respuesta = await fetch(
            "http://localhost:3000/restablecer-fecha",
            {
                method: "POST"
            }
        );

        const datos = await respuesta.json();

        if(datos.ok){

            alert("✅ Fecha de inicio restablecida correctamente");

        }else{

            alert("❌ No se pudo restablecer");
        }

    } catch (error) {

        console.error(error);

        alert("❌ Error restableciendo fecha");
    }
}

async function verAlumnosParalelo(paralelo) {

    try {

        const res =
            await fetch("http://localhost:3000/paralelos");

        const todos =
            await res.json();
        
        console.log("TODOS:", todos);
        console.log("PARALELO RECIBIDO:", paralelo);

        let alumnos =
            todos.filter(a =>
                `${a.curso}-${a.paralelo}` === paralelo
            );
            console.log("ALUMNOS FILTRADOS:", alumnos);
        let modalTitulo =
            document.getElementById("modalTitulo");

        if (modalTitulo) {

            modalTitulo.innerHTML =
                `📂 ${paralelo} (${alumnos.length})`;

        }

        let lista =
            document.getElementById("listaAlumnosModal");

        if (!lista) return;

        let filas = "";

        if (alumnos.length === 0) {

            filas = `
                <tr>
                    <td colspan="3">
                        No hay alumnos
                    </td>
                </tr>
            `;

        } else {

            alumnos.forEach((a, i) => {

                filas += `
                    <tr>
                        <td>${i + 1}</td>
                        <td>${escaparHTML(a.nombre)}</td>
                        <td>
                            <button onclick="
                            eliminarAlumno(${a.usuario_id}, '${paralelo}')
                            ">
                                ❌
                            </button>
                        </td>
                    </tr>
                `;
            });
        }

        lista.innerHTML = `
            <table style="width:100%;">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Nombre</th>
                        <th>Acción</th>
                    </tr>
                </thead>
                <tbody>${filas}</tbody>
            </table>
        `;

        document.getElementById(
            "modalAlumnos"
        ).style.display = "flex";

    } catch (error) {

        console.error(error);

    }

}

function formatearParalelo(paralelo) {
    if (!paralelo) return "";

    let partes = paralelo.split("-");

    // Bachillerato
    if (paralelo.includes("B")) {

        let grado = partes[0];

        if (grado === "1B") grado = "1ro Bachillerato";
        else if (grado === "2B") grado = "2do Bachillerato";
        else if (grado === "3B") grado = "3ro Bachillerato";

        return grado + " " + partes[1];
    }

    // Básico
        if (partes[0] === "8") return "8vo " + partes[1];
        if (partes[0] === "9") return "9no " + partes[1];
        if (partes[0] === "10") return "10mo " + partes[1];
        return paralelo;
}

async function moverAlumno(nombreCompleto, claveOrigen, carreraOrigen) {

    let nuevoParalelo = prompt("Nuevo paralelo (ej: 8-B, 9-A, 1B-A):");

    if (!nuevoParalelo) return;
    nuevoParalelo = nuevoParalelo.toUpperCase();
    let alumnoMovido = null;
    let carreraNueva = null;

    // 🔹 Buscar y remover
    if (carreraOrigen) {

        let lista = alumnosBase.bachillerato[carreraOrigen][claveOrigen];

        alumnoMovido = lista.find(a => a.nombreCompleto === nombreCompleto);

        alumnosBase.bachillerato[carreraOrigen][claveOrigen] =
            lista.filter(a => a.nombreCompleto !== nombreCompleto);

    } else {

        let lista = alumnosBase.basico[claveOrigen];

        alumnoMovido = lista.find(a => a.nombreCompleto === nombreCompleto);

        alumnosBase.basico[claveOrigen] =
            lista.filter(a => a.nombreCompleto !== nombreCompleto);
    }

    if (!alumnoMovido) {
        mostrarMensaje("❌ Alumno no encontrado", "error");
        return;
    }

    alumnoMovido.paralelo = nuevoParalelo;

    // 🔹 Agregar al nuevo paralelo
    if (nuevoParalelo.startsWith("8") ||
        nuevoParalelo.startsWith("9") ||
        nuevoParalelo.startsWith("10")) {

if (!alumnosBase.basico[nuevoParalelo]) {
    alumnosBase.basico[nuevoParalelo] = [];
}

if (alumnosBase.basico[nuevoParalelo].length >= 15) {

    mostrarMensaje("❌ El paralelo ya está lleno", "error");

    if (carreraOrigen) {
        alumnosBase.bachillerato[carreraOrigen][claveOrigen].push(alumnoMovido);
    } else {
        alumnosBase.basico[claveOrigen].push(alumnoMovido);
    }
    return;
}

alumnosBase.basico[nuevoParalelo].push(alumnoMovido);

    } else {

    carreraNueva = prompt("Carrera: computacion / contabilidad / ciencias");

    if (
        !alumnosBase.bachillerato[carreraNueva] ||
        !alumnosBase.bachillerato[carreraNueva][nuevoParalelo]
    ) {
        mostrarMensaje("❌ Carrera o paralelo inválido", "error");
        if (carreraOrigen) {
        alumnosBase.bachillerato[carreraOrigen][claveOrigen].push(alumnoMovido);
    } else {
        alumnosBase.basico[claveOrigen].push(alumnoMovido);
    }
        return;
    }
if (
    alumnosBase.bachillerato[carreraNueva][nuevoParalelo].length >= 15
) {

    mostrarMensaje("❌ El paralelo ya está lleno", "error");

    // devolver al paralelo original
    if (carreraOrigen) {

        alumnosBase.bachillerato[carreraOrigen][claveOrigen]
            .push(alumnoMovido);

    } else {

        alumnosBase.basico[claveOrigen]
            .push(alumnoMovido);
    }

    return;
}

alumnoMovido.carrera = carreraNueva;

alumnosBase.bachillerato[carreraNueva][nuevoParalelo]
    .push(alumnoMovido);
}

   try {

    await fetch(
        "http://localhost:3000/mover-usuario",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
            nombre: nombreCompleto,
            paralelo: nuevoParalelo,
            carrera: carreraNueva || alumnoMovido.carrera
            })
        }
    );

} catch (error) {

    console.error(error);
}

    mostrarMensaje("✅ Alumno movido correctamente", "success");

    cargarPanelRector();
}

async function eliminarAlumno(id, paralelo) {

    try {

        const confirmar = confirm("⚠️ ¿Seguro que deseas eliminar este alumno?");
        if (!confirmar) return;

        // 🔹 eliminar en backend MySQL
        const res = await fetch("http://localhost:3000/eliminar-usuario", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ id })
        });

        const data = await res.json();
        console.log(data);

        mostrarMensaje("✅ Alumno eliminado", "success");
        document.getElementById("modalAlumnos").style.display = "none";

        cargarPanelRector();

    } catch (error) {
        console.error(error);
        mostrarMensaje("❌ Error al eliminar alumno", "error");
    }
}

async function asignarAlumno(
    usuario_id,
    curso,
    paralelo
) {

    try {

        const res = await fetch(
            "http://localhost:3000/asignar-alumno",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    usuario_id,
                    paralelo
                })
            }
        );

        const data = await res.json();

        // Si el paralelo está lleno
        if (!data.success) {

            return mostrarMensaje(
                "❌ Este paralelo ya tiene 15 alumnos",
                "error"
            );

        }

        cargarPanelRector();

        mostrarMensaje(
            "✅ Alumno asignado correctamente",
            "success"
        );

    } catch (error) {

        console.error(error);

        mostrarMensaje(
            "❌ Error al asignar alumno",
            "error"
        );

    }

}

/*
async function asignarTodosNuevos() {

    try {

        const res =
            await fetch("http://localhost:3000/usuarios");

        let usuarios =
            await res.json();

        let pendientes = usuarios.filter(
            u => u.rol === "alumno" && !u.asignado
        );

        for (const paralelo of ['8-A', '8-B']) {

            // Crear paralelo si no existe
            if (!alumnosBase.basico[paralelo]) {
                alumnosBase.basico[paralelo] = [];
            }

            let espaciosDisponibles =
                15 - alumnosBase.basico[paralelo].length;

            for (let i = 0; i < espaciosDisponibles; i++) {

                let usuario = pendientes.shift();

                if (!usuario) {
                    break;
                }

                usuario.asignado = true;
                usuario.paralelo = paralelo;

                await fetch(
                    "http://localhost:3000/asignar-usuario",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            id: usuario.id,
                            paralelo: paralelo
                        })
                    }
                );

                alumnosBase.basico[paralelo].push({
                    nombreCompleto: usuario.nombreCompleto,
                    paralelo: paralelo
                });
            }
        }

        mostrarMensaje(
            "✅ Todos asignados automáticamente a 8vo",
            "success"
        );

        cargarPanelRector();

    } catch (error) {

        console.error(error);

        mostrarMensaje(
            "❌ Error al asignar alumnos",
            "error"
        );
    }
}
*/

let fotoBase64 = "";
let rangoDocenteSeleccionado = '';
let notasSeleccionadas = {p1: '', p2: '', examen: ''};

async function obtenerTodosAlumnos() {

    try {

        const res = await fetch("http://localhost:3000/usuarios");
        const usuarios = await res.json();

        return usuarios.filter(
            u => u.rol === "alumno"
        );

    } catch (error) {

        console.error(error);
        return [];
    }
}

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

async function obtenerAsistencias() {

    try {

        const res = await fetch(
            "http://localhost:3000/asistencias"
        );

        return await res.json();

    } catch(error) {

        console.error(error);
        return [];
    }
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

    bloquearPerfilDocente();
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

function buscarAlumnosNotas() {
    buscarAlumnosNotasRealTime();
}

document.addEventListener("DOMContentLoaded", function() {
    inicializarSistema();
    //cargarAlumnosDefecto();
    
function limpiarForosExpirados() {
    console.log("Limpiando foros expirados...");
}
// Búsqueda conducta
let inputConducta = document.getElementById('buscarAlumnoConducta');

if (inputConducta) {
    inputConducta.addEventListener('input', function () {
        buscarAlumnosRealTime(
            'buscarAlumnoConducta',
            'listaAlumnosConducta'
        );
    });
}

// Búsqueda notas
let inputNotas = document.getElementById('buscarAlumnoNota');

if (inputNotas) {
    inputNotas.addEventListener('input', function () {
        buscarAlumnosNotasRealTime();
    });
}
    
    // Foto de perfil
let fotoInput = document.getElementById("fotoInput");

if (fotoInput) {

    fotoInput.addEventListener("change", function(){

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

function abrirModalCalificar(usuarioAlumno, nombreAlumno) {
    let modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'modalCalificar';

    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal" onclick="cerrarModal('modalCalificar')">×</span>

            <h3 style="margin-top:0; color:#2c3e50;">⭐ Calificar Conducta</h3>

            <p style="color:#666; margin-bottom:25px; font-size:18px;">
                <strong>${nombreAlumno}</strong><br>
                <small style="color:#999;">Usuario: ${usuarioAlumno}</small>
            </p>

            <label style="font-weight:700; display:block; margin-bottom:12px; color:#2c3e50;">
                📚 Selecciona la materia:
            </label>

            <select id="materiaCalificar"
                    style="width:100%; padding:15px; margin-bottom:25px; border-radius:12px; border:3px solid #e1e5e9; font-size:16px;">

                <option value="Matemáticas">📐 Matemáticas</option>
                <option value="Inglés">🇺🇸 Inglés</option>
                <option value="Ciudadanía">🏛️ Ciudadanía</option>
                <option value="Química">🧪 Química</option>
                <option value="Emprendimiento">💼 Emprendimiento</option>
                <option value="Lengua y Literatura">📖 Lengua y Literatura</option>
                <option value="Historia">📚 Historia</option>
                <option value="Biología">🔬 Biología</option>
                <option value="Educación Física">⚽ Educación Física</option>
                <option value="Computación">💻 Computación</option>
                <option value="Tutoría">👨‍🏫 Tutoría</option>
                <option value="Proyecto">📋 Proyecto</option>

            </select>

            <label style="font-weight:700; display:block; margin-bottom:18px; color:#2c3e50;">
                ⭐ Selecciona la conducta:
            </label>

            <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:15px; margin-bottom:25px;">
                <button type="button" class="conducta-btn E" onclick="seleccionarRangoDocente('E', event)">E<br><small>Excelente</small></button>
                <button type="button" class="conducta-btn AA" onclick="seleccionarRangoDocente('AA', event)">AA<br><small>Actitud Aplicada</small></button>
                <button type="button" class="conducta-btn A" onclick="seleccionarRangoDocente('A', event)">A<br><small>Adecuada</small></button>
                <button type="button" class="conducta-btn R" onclick="seleccionarRangoDocente('R', event)">R<br><small>Regular</small></button>
                <button type="button" class="conducta-btn D" onclick="seleccionarRangoDocente('D', event)">D<br><small>Deficiente</small></button>
            </div>

            <div id="rangoSeleccionadoDocente"
                 style="display:none; padding:20px; background:linear-gradient(135deg,#d4edda,#c3e6cb); border-radius:15px; margin-bottom:25px; text-align:center; font-weight:700; border:3px solid #28a745; color:#155724;">
            </div>

            <label style="font-weight:700; display:block; margin-bottom:12px; color:#2c3e50;">
                💬 Observaciones (opcional):
            </label>

            <textarea id="obsCalificar"
                      style="width:100%; height:130px; padding:18px; border-radius:12px; border:3px solid #e1e5e9; font-size:16px; font-family:inherit; resize:vertical; margin-bottom:30px;"
                      placeholder="Describe el comportamiento específico del alumno... (máx. 200 caracteres)">
            </textarea>

            <div style="display:flex; gap:20px;">
                <button onclick="guardarCalificacion('${usuarioAlumno}', '${nombreAlumno}')"
                        style="flex:1; padding:18px; background:linear-gradient(135deg,#27ae60,#2ecc71); color:white; border:none; border-radius:15px; font-weight:700; font-size:18px; cursor:pointer;">
                    ✅ Guardar Calificación
                </button>

                <button onclick="cerrarModal('modalCalificar')"
                        style="flex:1; padding:18px; background:linear-gradient(135deg,#6c757d,#495057); color:white; border:none; border-radius:15px; font-weight:700; cursor:pointer;">
                    ❌ Cancelar
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
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

        alert(
            '⚠️ Por favor selecciona un rango de conducta'
        );

        return;
    }

    let materia =
        document.getElementById('materiaCalificar').value;

    let observaciones =
        document.getElementById('obsCalificar')
        .value.substring(0, 200);

    let sesion =
    JSON.parse(localStorage.getItem("sesion") || '{}');

    console.log("SESION ACTUAL:", sesion);

    let userDocente =
        sesion.nombreCompleto || "Docente";

    let conductaNueva = {

        alumno_usuario: usuarioAlumno,

        nombre_alumno: nombreAlumno,

        materia: materia,

        rango: rangoDocenteSeleccionado,

        observaciones: observaciones,

        fecha: new Date()
            .toLocaleDateString('es-ES'),

        hora: new Date()
            .toLocaleTimeString(
                'es-ES',
                {
                    hour: '2-digit',
                    minute:'2-digit'
                }
            ),

        docente: userDocente
    };

    try {

        await fetch(
    "http://localhost:3000/guardar-conducta",
    {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(conductaNueva)
    }
);

        alert(
            `✅ Conducta guardada correctamente`
        );

        cerrarModal('modalCalificar');

        rangoDocenteSeleccionado = '';

        document.getElementById(
            'buscarAlumnoConducta'
        ).value = '';

        document.getElementById(
            'listaAlumnosConducta'
        ).innerHTML = '';

    } catch(error){

        console.error(error);

        alert("❌ Error guardando conducta");
    }
}

function abrirModalNotas(usuarioAlumno, nombreAlumno) {
    let modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'modalNotas';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal" onclick="cerrarModal('modalNotas')">×</span>
            <h3 style="margin-top:0; color:#2c3e50;">📝 Calificar Notas</h3>
            <p style="color:#666; margin-bottom:25px; font-size:18px;"><strong>${nombreAlumno}</strong><br>
            <small style="color:#999;">Usuario: ${usuarioAlumno}</small></p>
            
            <label style="font-weight:700; display:block; margin-bottom:12px; color:#2c3e50;">📚 Selecciona la materia:</label>
            <select id="materiaNota" style="width:100%; padding:15px; margin-bottom:25px; border-radius:12px; border:3px solid #e1e5e9; font-size:16px;">
                <option value="Matemáticas">📐 Matemáticas</option>
                <option value="Inglés">🇺🇸 Inglés</option>
                <option value="Ciudadanía">🏛️ Ciudadanía</option>
                <option value="Química">🧪 Química</option>
                <option value="Emprendimiento">💼 Emprendimiento</option>
                <option value="Lengua y Literatura">📖 Lengua y Literatura</option>
                <option value="Historia">📚 Historia</option>
                <option value="Biología">🔬 Biología</option>
                <option value="Educación Física">⚽ Educación Física</option>
                <option value="Computación">💻 Computación</option>
                <option value="Tutoría">👨‍🏫 Tutoría</option>
                <option value="Proyecto">📋 Proyecto</option>
            </select>
            
            <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:15px; margin-bottom:25px;">
                <div>
                    <label style="font-weight:600; display:block; margin-bottom:10px;">P1:</label>
                    <div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:center;">
                        ${[10,9.5,9,8.5,8,7.5,7,6.5,6].map(n => 
                            `<button class="nota-btn" onclick="seleccionarNota(event,'${n}','p1')">${n}</button>`
                        ).join('')}
                    </div>
                </div>
                <div>
                    <label style="font-weight:600; display:block; margin-bottom:10px;">P2:</label>
                    <div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:center;">
                        ${[10,9.5,9,8.5,8,7.5,7,6.5,6].map(n => 
                            `<button class="nota-btn" onclick="seleccionarNota(event,'${n}','p2')">${n}</button>`
                        ).join('')}
                    </div>
                </div>
                <div>
                    <label style="font-weight:600; display:block; margin-bottom:10px;">Examen:</label>
                    <div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:center;">
                        ${[10,9.5,9,8.5,8,7.5,7,6.5,6].map(n => 
                            `<button class="nota-btn" onclick="seleccionarNota(event,'${n}','examen')">${n}</button>`
                        ).join('')}
                    </div>
                </div>
            </div>
            
            <div id="notasSeleccionadas" style="display:none; padding:25px; background:linear-gradient(135deg,#e8f5e8,#d4edda); border-radius:15px; margin-bottom:30px; text-align:center; font-weight:700; border:3px solid #28a745; color:#155724;"></div>
            
            <button onclick="guardarNotaDocente('${usuarioAlumno}', '${nombreAlumno}')" 
                    style="width:100%; padding:20px; background:linear-gradient(135deg,#28a745,#20c997); color:white; border:none; border-radius:15px; font-weight:700; font-size:20px; cursor:pointer;">
                ✅ Guardar Todas las Notas
            </button>
        </div>
    `;
    document.body.appendChild(modal);
    notasSeleccionadas = {p1: '', p2: '', examen: ''};
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

function mostrarDocentesAsignadosRector() {

    // 🔥 OCULTAR TODAS
    document.querySelectorAll(
        "#panelRector .seccionDocente"
    ).forEach(sec => {

        sec.style.display = "none";
    });

    // 🔥 MOSTRAR SECCIÓN
    document.getElementById(
        "seccionDocentesAsignados"
    ).style.display = "block";

    // 🔥 CARGAR DOCENTES
    cargarDocentesAsignados();
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

        alert("❌ Error guardando nota");

    }
}

function cerrarModal(modalId = "modalAlumnos") {
    let modal = document.getElementById(modalId);

    if (modal) {

        if (
            modalId === "modalCalificar" ||
            modalId === "modalNotas"
        ) {
            modal.remove();
        } else {
            modal.style.display = "none";
        }
    }
}

function mostrarRegistro(){

    document.getElementById("registro").style.display="block";
    document.getElementById("formLogin").style.display="none";

    document.getElementById("regRol").value = "";
    document.getElementById("cursoAlumno").value = "";
    document.getElementById("especialidadAlumno").value = "";

    document.getElementById("materiasDocente").style.display = "none";
    document.getElementById("cursoAlumno").style.display = "none";
    document.getElementById("especialidadAlumno").style.display = "none";
    document.getElementById("claveRector").style.display = "none";
}

function mostrarLogin(){
    document.getElementById("formLogin").style.display="block";
    document.getElementById("registro").style.display="none";
}

async function login(){

    let userInput =
        document.getElementById("logNombre").value.trim();

    let passInput =
        document.getElementById("logPass").value;

    try {

const respuesta = await fetch("http://localhost:3000/login", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        nombre: userInput,
        password: passInput
    })
});

const datos = await respuesta.json();

let user = datos.usuario;

    if(datos.encontrado){

    let sesionNormalizada = {
    id: user.id,
    nombreCompleto: user.nombre,
    rol: user.rol,
    clave: user.password,
    paralelo: "",
    asignado: false
};

 localStorage.setItem(
    "sesion",
    JSON.stringify(sesionNormalizada)
 );

document.getElementById("inicio").style.display="none";

            if(user.rol === "alumno"){

                document.getElementById("panelAlumno")
                    .style.display="block";

                    cargarMateriasAlumno();

                let usuarioActivo =
                    document.getElementById("usuarioActivo");

                if (usuarioActivo) {

                    usuarioActivo.innerText =
                        `👤 ${user.nombre || user.nombreCompleto}`;
                }

                verificarNombreReal();

                mostrarSeccion("perfil");
            }

            else if(user.rol === "docente"){

                document.getElementById("panelDocente")
                    .style.display="block";
                await cargarDatosDocentePerfil();
                await cargarPerfilDocente();

                document.body.style.background =
                    "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)";

                const sesion =
                    JSON.parse(localStorage.getItem("sesion"));

                document.getElementById("docenteActivo").innerText =
                    `👨‍🏫 ${user.nombre}`;
                
                const nombrePerfil =
                document.getElementById("nombreDocentePerfil")
                    .innerText = user.nombre;

                if(nombrePerfil){
                    nombrePerfil.innerText = user.nombre;
                }

                mostrarDocente("perfilD");
                cargarMateriaDocente();
            }

            else if(user.rol === "rector"){

                document.getElementById("panelRector")
                    .style.display = "block";

                document.body.style.background = "#ffffff";

                cargarPanelRector();
                cargarSolicitudesMaterias();
                cargarDocentesAsignados();
            }

        } else {

            document.getElementById("mensaje").innerText =
                "❌ Usuario o contraseña incorrectos";

            document.getElementById("mensaje").style.color =
                "#e74c3c";
        }

    } catch(error){

        console.error(error);

        alert("❌ Error conectando con el servidor");
    }
}

async function cargarMateriaDocente(){

    const sesion =
        JSON.parse(localStorage.getItem("sesion"));

    const respuesta =
        await fetch(
            `http://localhost:3000/materia-docente/${sesion.id}`
        );

    const datos =
        await respuesta.json();

    if(datos.ok){

        document.getElementById(
            "materiaDocentePerfil"
        ).innerText =
            "📚 " + datos.materia;
    }
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
        <div style="
            background:#f4f6f9;
            padding:10px;
            border-radius:8px;
            margin-top:8px;
        ">
            <strong>
                👨‍🎓 ${r.alumno}
            </strong>

            <p style="
                margin-top:5px;
            ">
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
                    <div style="
                        background:#f4f6f9;
                        padding:10px;
                        border-radius:8px;
                        margin-top:8px;
                    ">
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
                <p style="
                    color:#888;
                ">
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
                onclick="eliminarForo(${f.id})"
                style="
                    margin-top:15px;
                    background:#e74c3c;
                    color:white;
                    border:none;
                    padding:10px 15px;
                    border-radius:8px;
                    cursor:pointer;
                "
            >
                🗑️ Eliminar debate
            </button>
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
            perfil.nacimiento || "";

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
}

function cerrarSesion(){
    localStorage.removeItem("sesion");
    location.reload();
}

async function verificarFechaInicio() {
    const sesion =
        JSON.parse(
            localStorage.getItem("sesion")
        );

    try {

        const respuesta = await fetch(
        `http://localhost:3000/fecha-inicio/${sesion.id}`
        );

        const datos = await respuesta.json();

        if (!datos.fechaInicio) {

            let fecha = prompt(
                "📅 Ingresa la fecha de inicio de clases:\nEjemplo: 2026-05-12"
            );

            if (!fecha || fecha.trim() === "") {

                alert(
                    "⚠️ Debes ingresar la fecha de inicio de clases para continuar."
                );

                document.getElementById("asistenciaD").style.display = "none";

                return false;
            }

            await fetch(
                "http://localhost:3000/guardar-fecha-inicio",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        docente_id: sesion.id,
                        fechaInicio: fecha
                    })
                }
            );

            alert(
                "✅ Fecha de inicio guardada"
            );
        }

        return true;

    } catch (error) {

        console.error(error);

        alert(
            "❌ Error verificando fecha"
        );

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

function cambiarRolRegistro() {

    let rol =
        document.getElementById("regRol").value;

    let curso =
        document.getElementById("cursoAlumno");

    let especialidad =
        document.getElementById("especialidadAlumno");

    let materias =
        document.getElementById("materiasDocente");

    let claveRector =
        document.getElementById("claveRector");

    let contenedorTitulo =
    document.getElementById("contenedorTituloDocente");

    let nombreNormal =
    document.getElementById("regNombreSolo");

    curso.style.display = "none";
    especialidad.style.display = "none";
    materias.style.display = "none";
    claveRector.style.display = "none";
    contenedorTitulo.style.display = "none";
    nombreNormal.style.display = "block";

    if (rol === "alumno") {

        curso.style.display = "block";
    }

    if (rol === "docente") {

        materias.style.display = "block";

        contenedorTitulo.style.display = "flex";

        nombreNormal.style.display = "none";
    }

    if (rol === "rector") {

        claveRector.style.display = "block";
    }

}

document.getElementById("cursoAlumno").addEventListener("change", function() {

    let especialidad =
        document.getElementById(
            "especialidadAlumno"
        );

    if (
        ["1BGU", "2BGU", "3BGU"]
        .includes(this.value)
    ) {

        especialidad.style.display =
            "block";

    } else {

        especialidad.style.display =
            "none";

        especialidad.value = "";
    }

});

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

function editarPerfilDocente(){

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

    campos.forEach(id => {

        const campo =
            document.getElementById(id);

        if(campo){
            campo.disabled = false;
        }

    });

    const btnGuardar =
        document.querySelector(".btn-guardar");

    const btnEditar =
        document.querySelector(".btn-editar");

    if(btnGuardar)
        btnGuardar.style.display = "inline-block";

    if(btnEditar)
        btnEditar.style.display = "none";

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

    const btnEditar =
        document.querySelector(".btn-editar");

    if(btnGuardar)
        btnGuardar.style.display = "none";

    if(btnEditar)
        btnEditar.style.display = "inline-block";
}

function mostrarRector(id){

    // Ocultar todas las secciones
    document
        .querySelectorAll(".seccionRector")
        .forEach(seccion => {
            seccion.style.display = "none";
        });

    // Mostrar la seleccionada
    document.getElementById(id).style.display = "block";
}

document.getElementById("regRol").addEventListener("change", function() {

    let materias =
        document.getElementById("materiasDocente");

    let curso =
        document.getElementById("cursoAlumno");

    let especialidad =
        document.getElementById("especialidadAlumno");

    let claveRector =
        document.getElementById("claveRector");

    // Ocultar todo primero
    materias.style.display = "none";
    curso.style.display = "none";
    especialidad.style.display = "none";
    claveRector.style.display = "none";

    if (this.value === "alumno") {

        curso.style.display = "block";

        especialidad.style.display = "none";
        especialidad.value = "";

    }

    else if (this.value === "docente") {

        materias.style.display = "block";

    }

    else if (this.value === "rector") {

        claveRector.style.display = "block";

    }

});

document.getElementById("cursoAlumno").addEventListener("change", function() {

    const especialidad =
        document.getElementById("especialidadAlumno");

    if (
        this.value === "1BGU" ||
        this.value === "2BGU" ||
        this.value === "3BGU"
    ) {

        especialidad.style.display = "block";

    } else {

        especialidad.style.display = "none";
        especialidad.value = "";

    }

});

async function cargarSolicitudesMaterias() {

    let contenedor =
        document.getElementById(
            "listaSolicitudesMaterias"
        );

    if (!contenedor) return;

    contenedor.innerHTML = "";

    const respuesta = await fetch(
        "http://localhost:3000/solicitudes-docentes"
    );

    const docentes = await respuesta.json();

    docentes.forEach(data => {

        let materias =
            data.materias
                ? data.materias.split(",")
                : [];

        contenedor.innerHTML += `

            <div style="
                background:white;
                padding:20px;
                border-radius:15px;
                margin-bottom:20px;
                border-left:6px solid #3498db;
            ">

                <h3 style="
                    margin-bottom:10px;
                    color:#2c3e50;
                ">
                    👨‍🏫 ${data.nombre}
                </h3>

                <p>
                    <strong>
                        📚 Materias solicitadas:
                    </strong>
                </p>

                <p style="
                    margin-top:10px;
                    color:#555;
                ">
                    ${materias.join(", ")}
                </p>

                <p style="
                    margin-top:10px;
                    font-weight:bold;
                    color:orange;
                ">
                    ⏳ Estado: pendiente
                </p>

                <select
                    id="materia_${data.id}"
                    style="
                        margin-top:15px;
                        padding:10px;
                        border-radius:10px;
                        width:100%;
                    "
                >

                    <option value="">
                        📚 Seleccionar materia
                    </option>

                    <option value="1">Matemática</option>
                    <option value="2">Inglés</option>
                    <option value="3">Ciudadanía</option>
                    <option value="4">Química</option>
                    <option value="5">Emprendimiento</option>
                    <option value="6">Lengua y Literatura</option>
                    <option value="7">Biología</option>
                    <option value="8">Historia</option>
                    <option value="9">Educación Física</option>
                    <option value="10">Tutoría</option>
                    <option value="11">Proyecto</option>
                    <option value="12">Computación</option>

                </select>

                <button
                    onclick="
                        asignarMateriaDocente(
                            '${data.id}'
                        )
                    "
                    style="
                        margin-top:15px;
                        background:#28a745;
                        color:white;
                        border:none;
                        padding:10px 18px;
                        border-radius:10px;
                        cursor:pointer;
                        font-weight:bold;
                        width:100%;
                    "
                >
                    ✅ Guardar asignación
                </button>
            </div>

        `;
    });

}

async function asignarMateriaDocente(uid) {

    const select =
    document.getElementById(
        "materia_" + uid
    );

    const materiaNombre =
        select.options[
            select.selectedIndex
        ].text;
//seccion arreglada?
  if(!materiaNombre || materiaNombre === "📚 Seleccionar materia"){
        alert("Seleccione una materia");
        return;
    }

    try {

        await fetch(
            "http://localhost:3000/asignar-materia",
            {
                method:"POST",
                headers:{
                    "Content-Type":"application/json"
                },
                body:JSON.stringify({
                    docente_id: uid,
                    materia_id: materiaNombre
                })
            }
        );

        alert(
            "✅ Materia asignada"
        );

        await cargarSolicitudesMaterias();
        await cargarDocentesAsignados();

    } catch(error){

        console.error(error);

        alert(
            "❌ Error asignando"
        );
    }
}

async function cargarMateriasAlumno() {

    console.log("FUNCION CARGADA");

    const tabla =
        document.getElementById(
            "tablaMateriasAlumno"
        );

    if (!tabla) return;

    tabla.innerHTML = "";

    const materias = [

        "Matemática",
        "Inglés",
        "Ciudadanía",
        "Química",
        "Emprendimiento",
        "Lengua y Literatura",
        "Historia",
        "Biología",
        "Educación Física",
        "Computación",
        "Tutoría",
        "Proyecto"

    ];

    const respuesta = await fetch(
        "http://localhost:3000/docentes-asignados"
    );

    const docentesAsignados =
        await respuesta.json();

    console.log(docentesAsignados);

    materias.forEach(materia => {

        let asignacion =
            docentesAsignados.find(
                d => d.materia === materia
            );

        tabla.innerHTML += `

            <tr>

                <td>${materia}</td>

                <td>
                    ${
                        asignacion
                        ? `<span
                                class="docente-link"
                                onclick="verPerfilDocente('${asignacion.id}')">
                                ${asignacion.docente}
                        </span>`
                        : "-"
                    }
                </td>
            </tr>

        `;

    });

}

async function cargarDocentesAsignados() {

    let contenedor =
        document.getElementById(
            "listaDocentesAsignados"
        );

    if (!contenedor) return;

    contenedor.innerHTML = "";

    const respuesta =
        await fetch(
            "http://localhost:3000/docentes-asignados"
        );

    const docentes =
        await respuesta.json();

    docentes.forEach(docente => {

        contenedor.innerHTML += `

            <div style="
                background:white;
                padding:20px;
                border-radius:15px;
                margin-bottom:20px;
                border-left:6px solid #28a745;
            ">

                <h3>
                    👨‍🏫 ${docente.docente}
                </h3>

                <p>
                    📚 Materia:
                    <strong>
                        ${docente.materia}
                    </strong>
                </p>

                <button
                    onclick="
                        editarMateria(
                            ${docente.id}
                        )
                    "
                >
                    ✏️ Modificar
                </button>

                <button
                    onclick="
                        eliminarDocente(
                            ${docente.id}
                        )
                    "
                    style="
                        margin-left:10px;
                        background:#dc3545;
                        color:white;
                        border:none;
                        padding:8px 15px;
                        border-radius:8px;
                        cursor:pointer;
                    "
                >
                    🗑️ Eliminar
                </button>
            </div>

        `;
    });
}

async function editarMateria(idAsignacion){

    let nuevaMateria =
        prompt(
            "Ingrese el ID de la nueva materia"
        );

    if(!nuevaMateria) return;

    await fetch(
        "http://localhost:3000/editar-materia",
        {
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify({
                id:idAsignacion,
                materia_id:nuevaMateria
            })
        }
    );

    alert(
        "✅ Materia actualizada"
    );

    cargarDocentesAsignados();
}

function mostrarDocentesAsignados() {

    document.getElementById(
        "docentesAsignados"
    ).style.display = "block";

    cargarDocentesAsignados();
}

async function eliminarDocente(id) {

    const confirmar = confirm(
        "⚠️ ¿Seguro que deseas eliminar este docente definitivamente?"
    );

    if (!confirmar) return;

    try {

        const res = await fetch(
            "http://localhost:3000/eliminar-docente",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ id })
            }
        );

        const data = await res.json();

        mostrarMensaje(
            "✅ Docente eliminado",
            "success"
        );

        cargarSolicitudesMaterias();
        cargarDocentesAsignados();

    } catch(error) {

        console.error(error);

        mostrarMensaje(
            "❌ Error eliminando docente",
            "error"
        );

    }

}

function actualizarFechaHora() {

    const ahora = new Date();

    const fecha =
        ahora.toLocaleDateString("es-EC");

    const hora =
        ahora.toLocaleTimeString("es-EC");

    const texto =
        `📅 ${fecha} | 🕒 ${hora}`;

    const alumno =
        document.getElementById(
            "fechaHoraAlumno"
        );

    const docente =
        document.getElementById(
            "fechaHoraDocente"
        );

    const rector =
        document.getElementById(
            "fechaHoraRector"
        );

    if (alumno) alumno.innerHTML = texto;

    if (docente) docente.innerHTML = texto;

    if (rector) rector.innerHTML = texto;
}
actualizarFechaHora();

setInterval(
    actualizarFechaHora,
    1000
);

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

    let titulo =
        document.getElementById("tituloQuizziz").value.trim();

    let materia =
        document.getElementById("materiaQuizziz").value.trim();

    if (!titulo || !materia) {

        alert("⚠️ Completa el título y la materia");
        return;
    }

    let preguntas = [];

    let items =
        document.querySelectorAll(".pregunta-item");

    items.forEach(item => {

        let pregunta =
            item.querySelector(".pregunta-input")
            .value.trim();

        let correcta =
            item.querySelector(".correcta-input")
            .value.trim();

        let incorrectas = [

            item.querySelector(".incorrecta1-input")
            .value.trim(),

            item.querySelector(".incorrecta2-input")
            .value.trim(),

            item.querySelector(".incorrecta3-input")
            .value.trim()

        ];

        if(pregunta && correcta){

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

    if(preguntas.length === 0){

        alert("⚠️ Agrega al menos una pregunta");
        return;
    }

    const sesion =
        JSON.parse(
            localStorage.getItem("sesion")
        );

    try{

        const respuestaMateria =
            await fetch(
                `http://localhost:3000/materia-docente/${sesion.id}`
            );

        const datosMateria =
            await respuestaMateria.json();

        const respuesta =
            await fetch(
                "http://localhost:3000/quizzes",
                {
                    method:"POST",
                    headers:{
                        "Content-Type":"application/json"
                    },
                    body: JSON.stringify({

                        titulo: titulo,

                        materia_id:
                            datosMateria.materia_id,

                        docente_id:
                            sesion.id,

                        preguntas: preguntas
                    })
                }
            );

        const datos =
            await respuesta.json();

        alert("✅ Quiz guardado correctamente");

        document.getElementById(
            "tituloQuizziz"
        ).value = "";

        document.getElementById(
            "materiaQuizziz"
        ).value = "";

    }
    catch(error){

        console.error(error);

        alert(
            "❌ Error al guardar el Quiz"
        );
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

            div.style.cssText =
                "background:white; border-radius:15px; padding:20px; margin-bottom:20px; box-shadow:0 2px 10px rgba(0,0,0,0.1); border-left:6px solid #4facfe;";

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
// --- CARGAR RESULTADOS PARA DOCENTE ---
async function cargarResultadosQuizziz() {

    let container =
        document.getElementById(
            "listaResultadosQuizziz"
        );

    if(!container) return;

    const sesion =
        JSON.parse(
            localStorage.getItem("sesion")
        );

    try{

        const respuesta =
            await fetch(
                `http://localhost:3000/resultados-quiz-docente/${sesion.id}`
            );

        const resultados =
            await respuesta.json();

        container.innerHTML = "";

        if(resultados.length === 0){

            container.innerHTML = `
                <div style="text-align:center; padding:50px; color:#666;">
                    <h3>📊 No hay resultados disponibles</h3>
                    <p>Aún no existen respuestas de estudiantes</p>
                </div>
            `;

            return;
        }

        resultados.forEach(r => {

            let div =
                document.createElement("div");

            div.className =
                "resultado-card";

            div.style.cssText =
                "background:white; border-radius:15px; padding:20px; margin-bottom:20px; box-shadow:0 2px 10px rgba(0,0,0,0.1);";

            div.innerHTML = `

                <h3>
                    ${r.quiz}
                </h3>

                <p>
                    👨‍🎓 ${r.alumno}
                </p>

                <p>
                    🎯 ${r.aciertos}/${r.total}
                </p>

                <span
                    style="
                        background:
                        ${r.puntaje >= 7 ? '#27ae60' : '#e74c3c'};
                        color:white;
                        padding:5px 15px;
                        border-radius:20px;
                        font-weight:bold;
                    ">
                    ${r.puntaje}/10
                </span>

            `;

            container.appendChild(div);

        });

    }
    catch(error){

        console.error(error);

        container.innerHTML = `
            <div style="text-align:center; color:red;">
                Error al cargar resultados
            </div>
        `;
    }
}
