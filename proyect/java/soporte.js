let modoBotonFlotante = "login";
let ticketActual = null;
let respaldoAbierto = "";
let respaldoActual = "";
let archivoActual = "";

function escaparHTML(texto) {
    if (!texto) return "";
    return texto
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function accionBotonFlotante(){

    if(modoBotonFlotante==="login"){

        abrirLoginSoporte();

    }else{

        abrirTicketSoporte();

    }

}
function abrirLoginSoporte(){

    document.getElementById("loginSoporte").style.display = "flex";

    document.getElementById("usuarioSoporte").value = "";

    document.getElementById("claveSoporte").value = "";

    document.getElementById("usuarioSoporte").focus();

}
function cerrarLoginSoporte(){

    document.getElementById("loginSoporte").style.display = "none";

    document.getElementById("usuarioSoporte").value = "";

    document.getElementById("claveSoporte").value = "";

}
document.getElementById("claveSoporte").addEventListener("keypress", function(e){

    if(e.key === "Enter"){

        loginSoporte();

    }

});
//Funcion modificada
async function loginSoporte(){
    const usuario = document.getElementById("usuarioSoporte").value.trim();
    const password = document.getElementById("claveSoporte").value.trim();

    if(usuario === "" || password === ""){
        alert("Complete todos los campos.");
        return;
    }

    try{
        const respuesta = await fetch(
            "http://localhost:3000/login",
            {
                method:"POST",
                headers:{
                    "Content-Type":"application/json"
                },
                body:JSON.stringify({
                    nombre:usuario,
                    password:password
                })
            }
        );

        const datos = await respuesta.json();

        if(!datos.encontrado){
            alert("Usuario o contraseña incorrectos.");
            return;
        }

        if(datos.usuario.rol !== "soporte"){
            alert("Este acceso es exclusivo para Soporte.");
            return;
        }

        localStorage.setItem(
            "sesionSoporte",
            JSON.stringify(datos.usuario)
        );

        cerrarLoginSoporte();

        // Ocultar la pantalla principal
        document.getElementById("pantallaInicio").style.display = "none";
        document.getElementById("formLogin").style.display = "none";
        document.getElementById("registro").style.display = "none";

        // Mostrar el panel del soporte
        document.getElementById("panelSoporte").style.display = "block";

        // ✅ Ocultar botón flotante
        document.getElementById("botonFlotante").style.display = "none";

        // Mostrar la primera sección
        mostrarSoporte("tickets");

        // Cargar información
        cargarTicketsSoporte();
        cargarSolicitudesSoporte();

        /*// ✅ NUEVO: Verificar si la contraseña es temporal
        setTimeout(() => {
            verificarYCambiarContrasena(datos.usuario.id);
        }, 500);
        */
    }catch(error){
        console.error(error);
        alert("Error de conexión con el servidor.");
    }
}

function mostrarSoporte(seccion) {
    const secciones = document.querySelectorAll(".seccionSoporte");
    secciones.forEach(sec => {
        sec.style.display = "none";
    });

    const elemento = document.getElementById(seccion);
    if (elemento) {
        elemento.style.display = "block";
    }

    // Cargar datos según la sección
    if (seccion === "gestionForos") {
        if (typeof cargarForosSoporte === 'function') {
            cargarForosSoporte();
        }
    } else if (seccion === "gestionQuizzes") {
        if (typeof cargarQuizzesSoporte === 'function') {
            cargarQuizzesSoporte();
        }
    } else if (seccion === "tickets") {
        if (typeof cargarTicketsSoporte === 'function') {
            cargarTicketsSoporte();
        }
    } else if (seccion === "autorizaciones") {
        if (typeof cargarSolicitudesSoporte === 'function') {
            cargarSolicitudesSoporte();
        }
    } else if (seccion === "usuarios") {
        if (typeof buscarUsuarios === 'function') {
            buscarUsuarios();
        }
    }
}

function cerrarSesionSoporte(){

    localStorage.removeItem("sesionSoporte");

    document.getElementById("panelSoporte").style.display = "none";

    // Volver al inicio
    document.getElementById("pantallaInicio").style.display = "block";

    // Ocultar formularios
    document.getElementById("formLogin").style.display = "none";
    document.getElementById("registro").style.display = "none";

    // ✅ Mostrar nuevamente el botón flotante
    document.getElementById("botonFlotante").style.display = "flex";

}
async function solicitarRestablecimiento(){

    let confirmar = confirm(
        "¿Deseas enviar una solicitud al Centro de Soporte para restablecer el ciclo de asistencia?"
    );

    if(!confirmar) return;

    try{

        const sesion = JSON.parse(localStorage.getItem("sesion"));

        const respuesta = await fetch(
            "http://localhost:3000/solicitar-restablecer-asistencia",
            {
                method:"POST",
                headers:{
                    "Content-Type":"application/json"
                },
                body:JSON.stringify({
                    rector_id: sesion.id
                })
            }
        );

        const datos = await respuesta.json();

        if(datos.ok){

            alert(datos.mensaje);

        }else{

            alert("⚠️ " + datos.mensaje);

        }

    }catch(error){

        console.error(error);

        alert("❌ Error de conexión.");

    }

}
async function cargarSolicitudesSoporte(){

    try{

        const respuesta = await fetch(
            "http://localhost:3000/autorizaciones-pendientes"
        );

        const solicitudes = await respuesta.json();
        let html = "";

        if(solicitudes.length === 0){

            html = `
                <p style="text-align:center;">
                    ✅ No existen solicitudes pendientes.
                </p>
            `;

        }else{

            solicitudes.forEach(solicitud=>{

                html += `
                    <div class="caja" style="margin-bottom:15px;">

                        <h3>📩 ${solicitud.nombre}</h3>

                        <p><b>Acción:</b> ${solicitud.accion}</p>

                        <p><b>Estado:</b> ${solicitud.estado}</p>

                            <button
                                onclick="aprobarAutorizacion(${solicitud.id})"
                                style="
                                    background:#27ae60;
                                    color:white;
                                    border:none;
                                    padding:8px 15px;
                                    border-radius:8px;
                                    cursor:pointer;
                                    margin-right:10px;
                                ">

                                ✔ Aprobar

                            </button>

                            <button
                                style="
                                    background:#e74c3c;
                                    color:white;
                                    border:none;
                                    padding:8px 15px;
                                    border-radius:8px;
                                    cursor:pointer;
                                ">

                                ✖ Rechazar

                            </button>

                    </div>
                `;

            });

        }

        document.getElementById("listaAutorizaciones").innerHTML = html;

    }catch(error){

        console.error(error);

    }

}
async function aprobarAutorizacion(id){

    let confirmar = confirm(
        "¿Deseas aprobar esta solicitud?"
    );

    if(!confirmar) return;

    try{

        const soporte = JSON.parse(
            localStorage.getItem("sesionSoporte")
        );

        const respuesta = await fetch(
            "http://localhost:3000/aprobar-autorizacion",
            {
                method:"POST",
                headers:{
                    "Content-Type":"application/json"
                },
                body:JSON.stringify({

                    id:id,

                    soporte_id: soporte.id

                })
            }
        );

        const datos = await respuesta.json();

        if(datos.ok){

            alert("✅ Solicitud aprobada.");

            cargarSolicitudesSoporte();

        }else{

            alert("❌ No se pudo aprobar.");

        }

    }catch(error){

        console.error(error);

        alert("❌ Error de conexión.");

    }

}
async function verificarAutorizacionRestablecimiento(){

    try{

        const sesion = JSON.parse(
            localStorage.getItem("sesion")
        );

        const respuesta = await fetch(
            `http://localhost:3000/autorizacion-restablecimiento/${sesion.id}`
        );

        const datos = await respuesta.json();

        const boton = document.getElementById("btnRestablecerAsistencia");

        if(datos.autorizado){

            boton.innerHTML =
                "🔄 Restablecer ciclo de asistencia";

            boton.style.background =
                "#27ae60";

            boton.onclick = function(){

                restablecerFechaInicio(datos.autorizacionId);

            };

        }else{

            boton.innerHTML =
                "📩 Solicitar autorización al Soporte";

            boton.style.background =
                "#f39c12";

            boton.onclick = function(){

                solicitarRestablecimiento();

            };

        }

    }catch(error){

        console.error(error);

    }

}
function abrirTicketSoporte(){

    document.getElementById("modalTicketSoporte").style.display="flex";

}
function cerrarTicketSoporte(){

    document.getElementById("modalTicketSoporte").style.display="none";

    document.getElementById("categoriaTicket").value="";

    document.getElementById("asuntoTicket").value="";

    document.getElementById("descripcionTicket").value="";

}
async function enviarTicket(){

    const categoria =
        document.getElementById("categoriaTicket").value;

    const asunto =
        document.getElementById("asuntoTicket").value.trim();

    const descripcion =
        document.getElementById("descripcionTicket").value.trim();

    if(categoria==="" || asunto==="" || descripcion===""){

        alert("⚠ Complete todos los campos.");

        return;

    }

    const sesion =
        JSON.parse(localStorage.getItem("sesion"));

    try{

        const respuesta = await fetch(
            "http://localhost:3000/crear-ticket",
            {

                method:"POST",

                headers:{
                    "Content-Type":"application/json"
                },

                body:JSON.stringify({

                    usuario_id: sesion.id,

                    nombre_usuario: sesion.nombreCompleto,

                    rol: sesion.rol,

                    categoria,

                    asunto,

                    descripcion

                })

            }
        );

        const datos = await respuesta.json();

        if(datos.ok){

            alert("✅ Solicitud enviada correctamente.");

            cerrarTicketSoporte();

        }else{

            alert("❌ No se pudo enviar la solicitud.");

        }

    }catch(error){

        console.error(error);

        alert("❌ Error conectando con el servidor.");

    }

}
async function cargarTicketsSoporte(){

    try{

        const respuesta = await fetch(
            "http://localhost:3000/tickets-soporte"
        );

        const tickets = await respuesta.json();

        const contenedor = document.getElementById("listaTickets");

        contenedor.innerHTML = "";

        if(tickets.length === 0){

            contenedor.innerHTML = `
                <p>✅ No existen tickets pendientes.</p>
            `;

            return;

        }

        tickets.forEach(ticket=>{

            contenedor.innerHTML += `
                <div class="ticketCard">

                    <h3>🎫 Ticket #${ticket.id}</h3>

                    <p><strong>👤 Usuario:</strong> ${ticket.nombre_usuario}</p>

                    <p><strong>🎓 Rol:</strong> ${ticket.rol}</p>

                    <p><strong>📂 Categoría:</strong> ${ticket.categoria}</p>

                    <p><strong>📝 Asunto:</strong> ${ticket.asunto}</p>

                    <p>
                        <strong>Estado:</strong>

                        <span class="${
                            ticket.estado==="resuelto"
                            ?"badgeResuelto"
                            :"badgePendiente"
                        }">

                            ${
                                ticket.estado==="resuelto"
                                ?"🟢 Resuelto"
                                :"🟡 Pendiente"
                            }

                        </span>

                    </p>

                    <button
                        class="btnVerTicket"
                        onclick="verTicket(${ticket.id})">

                        👁 Ver Ticket

                    </button>

                </div>
            `;

        });

    }catch(error){

        console.error(error);

    }

}
async function verTicket(id){

document.getElementById("modalMisTickets").style.display = "none";
const sesionNormal = JSON.parse(localStorage.getItem("sesion"));
const sesionSoporte = JSON.parse(localStorage.getItem("sesionSoporte"));

if(sesionSoporte){

    document.getElementById("btnResponderTicket").style.display = "inline-block";
    document.getElementById("respuestaTicket").readOnly = false;

}else{

    document.getElementById("btnResponderTicket").style.display = "none";
    document.getElementById("respuestaTicket").readOnly = true;

}

    ticketActual = id;

    try{

        const respuesta = await fetch(
            "http://localhost:3000/tickets-soporte"
        );

        const tickets = await respuesta.json();

        const ticket = tickets.find(t => t.id == id);

        if(!ticket) return;

        // Si es un usuario normal y el ticket ya está resuelto,
        // lo marcamos como visto.
        if(sesionNormal && ticket.estado === "resuelto"){

            await fetch(
                `http://localhost:3000/ticket-visto/${ticket.id}`,
                {
                    method:"PUT"
                }
            );

        }

        document.getElementById("detalleNumero").innerText =
            "#" + ticket.id;

        document.getElementById("detalleUsuario").innerText =
            ticket.nombre_usuario;

        document.getElementById("detalleRol").innerText =
            ticket.rol;

        document.getElementById("detalleCategoria").innerText =
            ticket.categoria;

        document.getElementById("detalleAsunto").innerText =
            ticket.asunto;

        document.getElementById("detalleDescripcion").textContent =
            ticket.descripcion;

        document.getElementById("respuestaTicket").value =
            ticket.respuesta || "Aún no existe una respuesta del soporte.";

        // Estado
        const estado =
            document.getElementById("detalleEstado");

        if(ticket.estado === "resuelto"){

            estado.innerText = "🟢 Resuelto";
            estado.className = "badgeResuelto";

        }else{

            estado.innerText = "🟡 Pendiente";
            estado.className = "badgePendiente";

        }

        document.getElementById("modalVerTicket").style.display =
            "flex";

    }catch(error){

        console.error(error);

    }

}
function cerrarModalTicket(){

    document.getElementById("modalVerTicket").style.display = "none";

    const sesionSoporte =
        JSON.parse(localStorage.getItem("sesionSoporte"));

    if(!sesionSoporte){

        document.getElementById("modalMisTickets").style.display = "flex";

    }

}
async function guardarRespuestaTicket(){

    const respuesta =
        document.getElementById("respuestaTicket").value.trim();

    if(respuesta===""){

        alert("Escriba una respuesta.");

        return;

    }

    try{

        const peticion = await fetch(

            "http://localhost:3000/responder-ticket",

            {

                method:"POST",

                headers:{
                    "Content-Type":"application/json"
                },

                body:JSON.stringify({

                    id:ticketActual,

                    respuesta:respuesta

                })

            }

        );

        const datos = await peticion.json();

        if(datos.ok){

            alert("✅ Ticket respondido correctamente.");

            cerrarModalTicket();

            cargarTicketsSoporte();

        }

    }catch(error){

        console.error(error);

    }
}
async function abrirMisTickets(){

    document.getElementById("modalMisTickets").style.display = "flex";

    cargarMisTickets();

}
function cerrarMisTickets(){

    document.getElementById("modalMisTickets").style.display = "none";

}
async function cargarMisTickets(){

    const sesion = JSON.parse(localStorage.getItem("sesion"));

    if(!sesion) return;

    try{

        const respuesta = await fetch(

            `http://localhost:3000/mis-tickets/${sesion.id}`

        );

        const tickets = await respuesta.json();

        const lista =
            document.getElementById("listaMisTickets");

        lista.innerHTML = "";

        if(tickets.length===0){

            lista.innerHTML = `
                <p style="text-align:center;">
                    No ha enviado solicitudes.
                </p>
            `;

            return;

        }

        tickets.forEach(ticket=>{

            lista.innerHTML += `

                <div class="ticketCard">

                    <div class="ticketHeader">

                        <h3>🎫 Ticket #${ticket.id}</h3>

                        <span class="${
                            ticket.estado==="resuelto"
                            ? "badgeResuelto"
                            : "badgePendiente"
                        }">

                            ${
                                ticket.estado==="resuelto"
                                ? "🟢 Resuelto"
                                : "🟡 Pendiente"
                            }

                        </span>

                    </div>

                    <p><strong>📂 Categoría:</strong> ${ticket.categoria}</p>

                    <p><strong>📝 Asunto:</strong> ${ticket.asunto}</p>

                    <div class="accionesTicket">

                        <button
                            class="btnVerTicket"
                            onclick="verMiTicket(${ticket.id})">
                            
                            👁 Ver detalle

                        </button>

                    </div>

                </div>

            `;

        });

    }catch(error){

        console.error(error);

    }

}
async function verMiTicket(id){

    document.getElementById("modalMisTickets").style.display = "none";

    try{

        const respuesta = await fetch(
            "http://localhost:3000/tickets-soporte"
        );

        const tickets = await respuesta.json();

        const ticket = tickets.find(t => t.id == id);

        if(!ticket) return;

        document.getElementById("miDetalleNumero").innerText =
            "#" + ticket.id;

        document.getElementById("miDetalleCategoria").innerText =
            ticket.categoria;

        document.getElementById("miDetalleAsunto").innerText =
            ticket.asunto;

        document.getElementById("miDetalleDescripcion").innerText =
            ticket.descripcion;

        document.getElementById("miRespuestaTicket").innerText =
            ticket.respuesta || "Aún no existe una respuesta del soporte.";

        const estado =
            document.getElementById("miDetalleEstado");

        if(ticket.estado === "resuelto"){

            estado.innerText = "🟢 Resuelto";
            estado.className = "badgeResuelto";

        }else{

            estado.innerText = "🟡 Pendiente";
            estado.className = "badgePendiente";

        }

        document.getElementById("modalVerMiTicket").style.display =
            "flex";

    }catch(error){

        console.error(error);

    }

}
function cerrarMiTicket(){

    document.getElementById("modalVerMiTicket").style.display = "none";

    document.getElementById("modalMisTickets").style.display = "flex";

}
async function verificarRespuestasSoporte(){

    const sesion = JSON.parse(localStorage.getItem("sesion"));

    if(!sesion) return;

    try{

        const respuesta = await fetch(

            `http://localhost:3000/notificaciones-soporte/${sesion.id}`

        );

        const datos = await respuesta.json();

        if(datos.total > 0){

            alert(
                `🔔 Tiene ${datos.total} respuesta(s) nueva(s) del Centro de Soporte.`
            );

        }

    }catch(error){

        console.error(error);

    }

}
async function revisarRespuestasSoporte(){

    const sesion = JSON.parse(localStorage.getItem("sesion"));

    if(!sesion) return;

    try{

        const respuesta = await fetch(

            `http://localhost:3000/tickets-no-vistos/${sesion.id}`

        );

        const datos = await respuesta.json();

        if(datos.total > 0){

            document.getElementById("botonFlotante").classList.add("notificacion");

        }else{

            document.getElementById("botonFlotante").classList.remove("notificacion");

        }

    }catch(error){

        console.error(error);

    }

}
async function buscarUsuarios(){

    try{

        const texto =
        document.getElementById("buscarUsuario")
        .value
        .toLowerCase();

        const respuesta =
        await fetch(
            "http://localhost:3000/usuarios-soporte"
        );

        const usuarios =
        await respuesta.json();

        let html="";

        usuarios
        .filter(usuario=>

            usuario.nombre
            .toLowerCase()
            .includes(texto)

        )
        .forEach(usuario=>{

            html+=`

            <div class="usuarioCard">

                <div class="usuarioInfo">

                    <h3>${usuario.nombre}</h3>

                    <p>${usuario.rol}</p>

                </div>

                <button
                    class="btnAdministrar"
                    onclick="administrarUsuario(${usuario.id})">

                    Administrar

                </button>

            </div>

            `;

        });

        document.getElementById("listaUsuarios").innerHTML =
        html;

    }catch(error){

        console.error(error);

    }

}
//Funcion modificada
async function administrarUsuario(id) {
    console.log("👤 Administrando usuario ID:", id);
    
    if (!id || id === undefined || id === null) {
        alert("❌ Error: ID de usuario no válido.");
        return;
    }

    try {
        const respuesta = await fetch(
            `http://localhost:3000/usuario-soporte/${id}`
        );

        if (!respuesta.ok) {
            throw new Error(`Error HTTP: ${respuesta.status}`);
        }

        const usuario = await respuesta.json();
        console.log("📊 Datos del usuario:", usuario);

        document.getElementById("adminNombre").innerText = usuario.nombre || "Sin nombre";
        document.getElementById("adminRol").innerText = usuario.rol || "Sin rol";

        let html = "";

        if (usuario.rol === "alumno") {
            html = `
                <button class="btnGuardar" onclick="habilitarEdicionPerfil(${usuario.id})"
                        style="background:#3498db; color:white; border:none; padding:12px; border-radius:8px; cursor:pointer; width:100%; margin-bottom:10px;">
                    🔓 Habilitar edición del perfil
                </button>
                <button class="btnGuardar" onclick="restablecerContrasena(${usuario.id})"
                        style="background:#e67e22; color:white; border:none; padding:12px; border-radius:8px; cursor:pointer; width:100%;">
                    🔑 Restablecer Contraseña
                </button>
            `;
        } else if (usuario.rol === "docente") {
            html = `
                <button class="btnGuardar" onclick="desbloquearPerfilDocente(${usuario.id})"
                        style="background:#3498db; color:white; border:none; padding:12px; border-radius:8px; cursor:pointer; width:100%; margin-bottom:10px;">
                    🔓 Desbloquear Perfil
                </button>
                <button class="btnGuardar" onclick="restablecerFechaInicioDocente(${usuario.id})"
                        style="background:#f39c12; color:white; border:none; padding:12px; border-radius:8px; cursor:pointer; width:100%; margin-bottom:10px;">
                    📅 Restablecer Fecha Inicio
                </button>
                <button class="btnGuardar" onclick="desbloquearNotasDocente(${usuario.id})"
                        style="background:#27ae60; color:white; border:none; padding:12px; border-radius:8px; cursor:pointer; width:100%; margin-bottom:10px;">
                    🔓 Desbloquear Notas (24 horas)
                </button>
                <button class="btnGuardar" onclick="desbloquearConductaDocente(${usuario.id})"
                        style="background:#8e44ad; color:white; border:none; padding:12px; border-radius:8px; cursor:pointer; width:100%; margin-bottom:10px;">
                    🔓 Desbloquear Conducta (24 horas)
                </button>
                <button class="btnGuardar" onclick="ocultarForosDocente(${usuario.id})"
                        style="background:#e74c3c; color:white; border:none; padding:12px; border-radius:8px; cursor:pointer; width:100%; margin-bottom:10px;">
                    🙈 Ocultar Foros
                </button>
                <button class="btnGuardar" onclick="mostrarForosDocente(${usuario.id})"
                        style="background:#2ecc71; color:white; border:none; padding:12px; border-radius:8px; cursor:pointer; width:100%; margin-bottom:10px;">
                    👁️ Mostrar Foros
                </button>
                <button class="btnGuardar" onclick="ocultarQuizzizDocente(${usuario.id})"
                        style="background:#e74c3c; color:white; border:none; padding:12px; border-radius:8px; cursor:pointer; width:100%; margin-bottom:10px;">
                    🙈 Ocultar Quizziz
                </button>
                <button class="btnGuardar" onclick="mostrarQuizzizDocente(${usuario.id})"
                        style="background:#2ecc71; color:white; border:none; padding:12px; border-radius:8px; cursor:pointer; width:100%;">
                    👁️ Mostrar Quizziz
                </button>
            `;
        } else {
            html = `
                <p style="color: #e74c3c; text-align: center;">
                    ⚠️ No hay acciones disponibles para este rol.
                </p>
            `;
        }

        document.getElementById("accionesUsuario").innerHTML = html;
        document.getElementById("modalUsuario").style.display = "flex";

    } catch (error) {
        console.error("❌ Error en administrarUsuario:", error);
        alert("❌ Error al cargar los datos del usuario.");
    }
}

//funcion modificada
function cerrarModalUsuario() {
    console.log("🔒 Cerrando modal de usuario...");
    const modal = document.getElementById("modalUsuario");
    if (modal) {
        modal.style.display = "none";
    }
    // Limpiar el contenido para evitar problemas
    const acciones = document.getElementById("accionesUsuario");
    if (acciones) {
        acciones.innerHTML = "";
    }
    const nombre = document.getElementById("adminNombre");
    if (nombre) {
        nombre.innerText = "";
    }
    const rol = document.getElementById("adminRol");
    if (rol) {
        rol.innerText = "";
    }
}

async function habilitarEdicionPerfil(usuario_id){

    let confirmar = confirm(
        "¿Desea permitir que el alumno vuelva a editar su perfil?"
    );

    if(!confirmar) return;

    try{

        const respuesta = await fetch(

            `http://localhost:3000/habilitar-edicion-perfil/${usuario_id}`,

            {
                method:"PUT"
            }

        );

        const datos = await respuesta.json();

        if(datos.ok){

            alert(datos.mensaje);

            cerrarModalUsuario();

        }else{

            alert("No fue posible habilitar la edición.");

        }

    }catch(error){

        console.error(error);

        alert("Error de conexión.");

    }

}

//Funcion Restablecer Contraseña
async function restablecerContrasena(usuario_id) {
    console.log("🔑 Intentando restablecer contraseña para el usuario ID:", usuario_id);
    
    // Verificar que el ID sea válido
    if (!usuario_id || usuario_id === undefined || usuario_id === null) {
        alert("❌ Error: No se pudo identificar al usuario.");
        console.error("❌ ID de usuario inválido:", usuario_id);
        return;
    }

    let confirmar = confirm(
        `🔐 ¿Desea restablecer la contraseña de este usuario?\n\n` +
        `La nueva contraseña será: 12345678\n\n` +
        `⚠️ El usuario deberá cambiarla en su próximo inicio de sesión.`
    );

    if (!confirmar) {
        console.log("⏹️ Operación cancelada por el usuario.");
        return;
    }

    try {
        // Mostrar mensaje de carga
        const boton = document.querySelector(`button[onclick="restablecerContrasena(${usuario_id})"]`);
        if (boton) {
            boton.textContent = "⏳ Procesando...";
            boton.disabled = true;
            boton.style.opacity = "0.7";
        }

        console.log("📡 Enviando petición al servidor...");
        console.log("📡 URL:", `http://localhost:3000/restablecer-contrasena/${usuario_id}`);

        const respuesta = await fetch(
            `http://localhost:3000/restablecer-contrasena/${usuario_id}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    nueva_contrasena: "12345678"
                })
            }
        );

        console.log("📩 Respuesta del servidor:", respuesta.status);
        console.log("📩 Respuesta OK:", respuesta.ok);

        // Intentar parsear la respuesta
        let datos;
        try {
            datos = await respuesta.json();
            console.log("📊 Datos recibidos:", datos);
        } catch (parseError) {
            console.error("❌ Error al parsear JSON:", parseError);
            throw new Error("El servidor no respondió con un JSON válido");
        }

        if (respuesta.ok && datos.ok) {
            alert(
                "✅ ¡CONTRASEÑA RESTABLECIDA EXITOSAMENTE!\n\n" +
                `👤 Usuario: ${datos.usuario || 'Usuario'}\n` +
                "🔑 Nueva contraseña: 12345678\n\n" +
                "📌 Recomendación: El usuario debe cambiar su contraseña\n" +
                "en el próximo inicio de sesión por seguridad."
            );
            
            // Cerrar el modal
            cerrarModalUsuario();
            
            // Recargar la lista de usuarios
            if (typeof buscarUsuarios === 'function') {
                buscarUsuarios();
            }
            
            console.log("✅ Proceso completado con éxito.");
        } else {
            const mensajeError = datos?.mensaje || "Error desconocido";
            alert(`❌ No se pudo restablecer la contraseña.\n\nMotivo: ${mensajeError}`);
            console.error("❌ Error del servidor:", datos);
        }

    } catch (error) {
        console.error("❌ Error detallado:", error);
        alert(
            "❌ Error al restablecer la contraseña.\n\n" +
            "Detalles: " + error.message + "\n\n" +
            "⚠️ Verifica que el servidor esté corriendo en http://localhost:3000\n" +
            "⚠️ Revisa la consola del servidor para más detalles."
        );
    } finally {
        // Restaurar el botón
        const boton = document.querySelector(`button[onclick="restablecerContrasena(${usuario_id})"]`);
        if (boton) {
            boton.textContent = "🔑 Restablecer Contraseña";
            boton.disabled = false;
            boton.style.opacity = "1";
        }
    }
}

// ============================================
// 🛡️ VERIFICAR Y CAMBIAR CONTRASEÑA TEMPORAL
// ============================================
async function verificarYCambiarContrasenaAlumno(usuario_id) {
    try {
        console.log("🔍 Verificando si la contraseña es temporal para el usuario:", usuario_id);
        
        const respuesta = await fetch(
            "http://localhost:3000/verificar-contrasena-temporal",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    usuario_id: usuario_id
                })
            }
        );

        const datos = await respuesta.json();
        console.log("📊 Resultado de verificación:", datos);

        if (datos.esTemporal) {
            console.log("🔐 ¡Contraseña temporal detectada! Mostrando modal...");
            // Mostrar el modal para cambiar contraseña
            const modal = document.getElementById("modalCambiarContrasenaAlumno");
            if (modal) {
                modal.style.display = "flex";
                document.getElementById("nuevaContrasenaAlumno").value = "";
                document.getElementById("confirmarContrasenaAlumno").value = "";
                setTimeout(() => {
                    document.getElementById("nuevaContrasenaAlumno").focus();
                }, 300);
            } else {
                console.error("❌ No se encontró el modal de cambio de contraseña");
                alert("⚠️ Por seguridad, debes cambiar tu contraseña temporal.\n\nContacta al soporte si no ves el formulario.");
            }
        } else {
            console.log("✅ La contraseña es segura. No se requiere cambio.");
        }

    } catch (error) {
        console.error("❌ Error al verificar contraseña:", error);
    }
}

// ============================================
// 🔑 CAMBIAR CONTRASEÑA PARA ALUMNOS
// ============================================
async function cambiarContrasenaAlumno() {
    const nuevaContrasena = document.getElementById("nuevaContrasenaAlumno").value.trim();
    const confirmarContrasena = document.getElementById("confirmarContrasenaAlumno").value.trim();

    // Validaciones
    if (nuevaContrasena === "") {
        alert("⚠️ Por favor, ingresa una nueva contraseña.");
        document.getElementById("nuevaContrasenaAlumno").focus();
        return;
    }

    if (nuevaContrasena.length < 4) {
        alert("⚠️ La contraseña debe tener al menos 4 caracteres.");
        document.getElementById("nuevaContrasenaAlumno").focus();
        return;
    }

    if (nuevaContrasena !== confirmarContrasena) {
        alert("⚠️ Las contraseñas no coinciden.");
        document.getElementById("confirmarContrasenaAlumno").focus();
        return;
    }

    if (nuevaContrasena === "12345678") {
        alert("⚠️ No puedes usar la contraseña temporal. Elige una contraseña diferente.");
        document.getElementById("nuevaContrasenaAlumno").value = "";
        document.getElementById("confirmarContrasenaAlumno").value = "";
        document.getElementById("nuevaContrasenaAlumno").focus();
        return;
    }

    try {
        // Obtener el ID del usuario de la sesión
        const sesion = JSON.parse(localStorage.getItem("sesion"));
        
        if (!sesion) {
            alert("❌ No se encontró la sesión. Por favor, inicia sesión nuevamente.");
            return;
        }
        
        // Mostrar mensaje de carga
        const boton = document.getElementById("btnCambiarContrasenaAlumno");
        if (boton) {
            boton.textContent = "⏳ Procesando...";
            boton.disabled = true;
        }

        console.log("📡 Enviando petición para cambiar contraseña del alumno...");

        const respuesta = await fetch(
            "http://localhost:3000/cambiar-contrasena",
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    usuario_id: sesion.id,
                    nueva_contrasena: nuevaContrasena
                })
            }
        );

        const datos = await respuesta.json();
        console.log("📊 Respuesta del servidor:", datos);

        if (datos.ok) {
            alert("✅ ¡Contraseña actualizada exitosamente!\n\n" +
                  "🔐 Tu nueva contraseña ha sido guardada.\n" +
                  "💡 Recuerda tu nueva contraseña para futuros inicios de sesión.");
            
            // Cerrar el modal
            const modal = document.getElementById("modalCambiarContrasenaAlumno");
            if (modal) {
                modal.style.display = "none";
            }
            
            // Actualizar la contraseña en la sesión local
            sesion.password = nuevaContrasena;
            sesion.clave = nuevaContrasena;
            localStorage.setItem("sesion", JSON.stringify(sesion));

        } else {
            alert("❌ Error al cambiar la contraseña:\n\n" + datos.mensaje);
        }

    } catch (error) {
        console.error("❌ Error al cambiar contraseña:", error);
        alert("❌ Error de conexión con el servidor.\n\n" + error.message);
    } finally {
        // Restaurar el botón
        const boton = document.getElementById("btnCambiarContrasenaAlumno");
        if (boton) {
            boton.textContent = "🔐 Cambiar Contraseña";
            boton.disabled = false;
        }
    }
}

// ============================================
// ❌ CERRAR MODAL DE CAMBIO DE CONTRASEÑA
// ============================================
function cerrarModalCambiarContrasenaAlumno() {
    if (confirm("⚠️ ¿Estás seguro de que quieres cerrar?\n\nDebes cambiar tu contraseña temporal por seguridad.\n\nSi cierras, seguirás usando la contraseña temporal.")) {
        if (confirm("🔐 ¿Realmente quieres continuar con la contraseña temporal?\n\nEsto no es seguro.")) {
            document.getElementById("modalCambiarContrasenaAlumno").style.display = "none";
        }
    }
}
//FUNCIONES DE SOPORTE PARA EL DOCENTE SELECCIONADO
// ============================================
// FUNCIONES PARA ADMINISTRAR DOCENTES (SOPORTE)
// ============================================

// ============================================
// 1. EDITAR PERFIL DEL DOCENTE
// ============================================
async function desbloquearPerfilDocente(usuario_id){

    try{

        const respuesta = await fetch(
            `http://localhost:3000/desbloquear-perfil-docente/${usuario_id}`,
            {
                method:"PUT"
            }
        );

        const datos = await respuesta.json();

        if(datos.ok){

            cerrarModalUsuario();

            buscarUsuarios();

        }

    }catch(error){

        console.error(error);

    }

}

// ============================================
// 2. RESTABLECER FECHA INICIO
// ============================================
async function restablecerFechaInicioDocente(usuario_id){

    const confirmar = confirm(

        "¿Desea restablecer la fecha de inicio de este docente?\n\n" +
        "Se eliminarán únicamente las asistencias registradas por este docente."

    );

    if(!confirmar) return;

    const respuesta = await fetch(

        `http://localhost:3000/restablecer-fecha-inicio/${usuario_id}`,

        {

            method:"PUT"

        }

    );

    const datos = await respuesta.json();

    if(datos.ok){

        alert("✅ Fecha restablecida correctamente.");

    }else{

        alert("❌ No se pudo restablecer.");

    }

}

// ============================================
// 3. DESBLOQUEAR NOTAS
// ============================================
async function desbloquearNotasDocente(docenteId){

    const confirmar = confirm(

        "⚠️ ¿Desea habilitar las NOTAS de este docente durante 24 horas?\n\nAl finalizar ese tiempo volverán a bloquearse automáticamente."

    );

    if(!confirmar){

        return;

    }

    const sesion =
        JSON.parse(localStorage.getItem("sesion") || "{}");

    try{

        const respuesta = await fetch(

            "http://localhost:3000/desbloquear-notas-docente",

            {

                method:"POST",

                headers:{
                    "Content-Type":"application/json"
                },

                body:JSON.stringify({

                    docente_id: docenteId,

                    soporte_id: sesion.id

                })

            }

        );

        const datos =
            await respuesta.json();

        if(datos.ok){

            alert(
                "✅ Las notas fueron habilitadas durante 24 horas."
            );

        }else{

            alert(
                datos.mensaje ||
                "❌ No fue posible habilitar las notas."
            );

        }

    }catch(error){

        console.error(error);

        alert(
            "❌ Error de conexión con el servidor."
        );

    }

}

// ============================================
// 4. DESBLOQUEAR CONDUCTA
// ============================================
async function desbloquearConductaDocente(docenteId){

    const confirmar = confirm(

        "⚠️ ¿Desea habilitar la CONDUCTA de este docente durante 24 horas?\n\nAl finalizar ese tiempo volverá a bloquearse automáticamente."

    );

    if(!confirmar){

        return;

    }

    const sesion =
        JSON.parse(localStorage.getItem("sesionSoporte") || "{}");

    console.log("SESION:", sesion);
    console.log("ID SOPORTE:", sesion.id);
    console.log("DOCENTE:", docenteId);

    try{

        console.log("🚀 VOY A ENVIAR EL FETCH");

        const respuesta = await fetch(

            "http://localhost:3000/desbloquear-conducta-docente",

            {

                method:"POST",

                headers:{
                    "Content-Type":"application/json"
                },

                body:JSON.stringify({

                    docente_id: docenteId,

                    soporte_id: sesion.id

                })

            }

        );

        console.log("✅ FETCH TERMINÓ");
        console.log("STATUS:", respuesta.status);

        const datos =
            await respuesta.json();

        console.log("RESPUESTA:", datos);

        if(datos.ok){

            alert(
                "✅ La conducta fue habilitada durante 24 horas."
            );

        }else{

            alert(
                datos.mensaje ||
                "❌ No fue posible habilitar la conducta."
            );

        }

    }catch(error){

        console.error("ERROR FETCH:", error);

        alert(
            "❌ Error de conexión con el servidor."
        );

    }

}

// ============================================
// RESPALDOS
// ============================================

const btnCrearRespaldo =
    document.getElementById("btnCrearRespaldo");

const btnVerRespaldos =
    document.getElementById("btnVerRespaldos");

const modalRespaldos =
    document.getElementById("modalRespaldos");

const cerrarRespaldos =
    document.getElementById("cerrarRespaldos");

const btnRestablecerSistema =
    document.getElementById("btnRestablecerSistema");

btnCrearRespaldo.addEventListener("click", async () => {

    try {

        const respuesta = await fetch(
            "http://localhost:3000/crear-respaldo",
            {
                method: "POST"
            }
        );

        const datos = await respuesta.json();

        if (datos.ok) {

            alert(
                "✅ Respaldo creado correctamente.\n\n" +
                datos.ruta
            );

        } else {

            alert(datos.mensaje);

        }

    } catch (error) {

        console.error(error);
        alert("❌ Error al crear el respaldo.");

    }

});    
    
// Abrir modal para ver respaldos
btnVerRespaldos.onclick = async () => {

    modalRespaldos.style.display = "flex";

    try {

        const respuesta = await fetch(
            "http://localhost:3000/respaldos"
        );

        const respaldos = await respuesta.json();

        let html = "";

        if (respaldos.length == 0) {

            html = `
                <tr>
                    <td colspan="4"
                        style="text-align:center;">
                        No existen respaldos.
                    </td>
                </tr>
            `;

        } else {

            respaldos.forEach(r => {

                html += `

                    <tr>

                        <td>${r.nombre}</td>

                        <td>${new Date(r.fecha).toLocaleString()}</td>

                        <td>${r.tamaño}</td>

                        <td>

                            <button
                                onclick="abrirRespaldo('${r.nombre}')"
                                class="btnAbrirRespaldo">

                                <span>📂</span>
                                Abrir

                            </button>

                        </td>

                    </tr>

                `;

            });

        }

        document.getElementById(
            "listaRespaldos"
        ).innerHTML = html;

    } catch (e) {

        console.error(e);

    }

};
// ABRIR RESPALDO
async function abrirRespaldo(nombreRespaldo) {

    respaldoAbierto = nombreRespaldo;

    document.querySelector("#modalRespaldos h2").textContent =
        "📁 Archivos del Respaldo";

    document.querySelector("#modalRespaldos p").textContent =
        "Seleccione un archivo para visualizar su contenido.";

    // Cambiar encabezados
    document.getElementById("encabezadoRespaldos").innerHTML = `
        <tr style="background:#f5f5f5;">

            <th style="padding:12px;">Archivo</th>

            <th style="padding:12px;">Tamaño</th>

            <th style="padding:12px;">Acciones</th>

        </tr>
    `;

    try {

        const respuesta = await fetch(
            `http://localhost:3000/respaldos/${nombreRespaldo}`
        );

        const archivos = await respuesta.json();

        let html = "";

        if (archivos.length === 0) {

            html = `
                <tr>

                    <td colspan="3"
                        style="text-align:center;padding:20px;">

                        Este respaldo no contiene archivos.

                    </td>

                </tr>
            `;

        } else {

            archivos.forEach(archivo => {

                html += `

                    <tr>

                        <td>${archivo.nombre}</td>

                        <td>${archivo.tamaño}</td>

                       <td>

                            <div
                                style="
                                    display:flex;
                                    justify-content:center;
                                    gap:8px;
                                ">

                                <button
                                    class="btnAbrirRespaldo"
                                    onclick="verArchivoRespaldo('${nombreRespaldo}','${archivo.nombre}')">

                                    👁 Ver

                                </button>

                                <button
                                    class="btnAbrirRespaldo"
                                    style="background:#27ae60;"
                                    onclick="window.open('http://localhost:3000/descargar-respaldo/${encodeURIComponent(nombreRespaldo)}/${encodeURIComponent(archivo.nombre)}','_blank')">

                                    ⬇ Descargar

                                </button>

                            </div>

                        </td>

                    </tr>

                `;

            });

        }

        document.getElementById("listaRespaldos").innerHTML = html;

    } catch (error) {

        console.error(error);

        alert("❌ No fue posible abrir el respaldo.");

    }

}
// VER ARCHIVO DEL RESPALDO
async function verArchivoRespaldo(respaldo, archivo){
    respaldoActual = respaldo;
    archivoActual = archivo;
    try{

        const respuesta = await fetch(

            `http://localhost:3000/respaldos/${respaldo}/${archivo}`

        );

        const contenido = await respuesta.text();

        document.getElementById("tituloArchivoRespaldo").textContent =
            "📄 " + archivo;

        document.getElementById("contenidoArchivoRespaldo").textContent =
            contenido;

        document.getElementById("modalArchivoRespaldo").style.display =
            "flex";

    }catch(error){

        console.error(error);

        alert("❌ No fue posible abrir el archivo.");

    }

}

// Cerrar modal del archivo
document.getElementById("cerrarArchivoRespaldo").onclick = () => {

    document.getElementById("modalArchivoRespaldo").style.display = "none";

};

// Descargar archivo
document.getElementById("btnDescargarArchivo").onclick = () => {

    window.open(

        `http://localhost:3000/descargar-respaldo/${encodeURIComponent(respaldoActual)}/${encodeURIComponent(archivoActual)}`,

        "_blank"

    );

};

// Cerrar modal de respaldos
cerrarRespaldos.onclick = async () => {

    // Si estamos viendo los archivos de un respaldo,
    // volver a la lista principal.
    if (respaldoAbierto !== "") {

        respaldoAbierto = "";

        btnVerRespaldos.onclick();

        return;

    }

    // Si estamos en la lista principal,
    // cerrar el modal.
    modalRespaldos.style.display = "none";

};

// Cerrar al hacer clic fuera
window.onclick = (e) => {

    if (e.target === modalRespaldos) {

        modalRespaldos.style.display = "none";

    }

    if (e.target === document.getElementById("modalArchivoRespaldo")) {

        document.getElementById("modalArchivoRespaldo").style.display = "none";

    }

};

//REINICIO DEL SISTEMA
const modalReiniciarSistema =
    document.getElementById("modalReiniciarSistema");

const btnCancelarReinicio =
    document.getElementById("btnCancelarReinicio");

const btnConfirmarReinicio =
    document.getElementById("btnConfirmarReinicio");

btnRestablecerSistema.onclick = () => {

    modalReiniciarSistema.style.display = "flex";

};

btnCancelarReinicio.onclick = () => {

    modalReiniciarSistema.style.display = "none";

};
btnConfirmarReinicio.onclick = ejecutarReinicioSistema;

async function ejecutarReinicioSistema() {

    modalReiniciarSistema.style.display = "none";

    btnRestablecerSistema.disabled = true;
    btnRestablecerSistema.textContent = "⏳ Restableciendo...";

    try {

        const respuesta = await fetch(

            "http://localhost:3000/restablecer-sistema",

            {
                method: "POST"
            }

        );

        const datos = await respuesta.json();

        if (datos.ok) {

            alert(

                "✅ Sistema restablecido correctamente.\n\n" +

                "Se creó un respaldo automático en:\n\n" +

                datos.ruta

            );

            location.reload();

        } else {

            alert(datos.mensaje);

        }

    } catch (error) {

        console.error(error);

        alert("❌ Error al restablecer el sistema.");

    }

    btnRestablecerSistema.disabled = false;
    btnRestablecerSistema.textContent =
        "🔄 Reiniciar Sistema Escolar";

}

// ============================================
// FUNCIONES DE OCULTAR/MOSTRAR PARA DOCENTE
// ============================================

// Ocultar todos los foros del docente
async function ocultarForosDocente(usuario_id) {
    console.log("🙈 Ocultando foros para docente ID:", usuario_id);
    
    let confirmar = confirm(
        "⚠️ ¿Estás seguro de ocultar TODOS los foros de este docente?\n\n" +
        "Los foros NO serán visibles para los estudiantes.\n" +
        "Las preguntas y respuestas se MANTIENEN guardadas.\n" +
        "Puedes volver a mostrarlos cuando quieras."
    );
    
    if (!confirmar) return;
    
    try {
        const respuesta = await fetch(
            `http://localhost:3000/ocultar-foros-docente/${usuario_id}`,
            {
                method: "PUT"
            }
        );
        
        const datos = await respuesta.json();
        
        if (datos.ok) {
            alert(`✅ Foros ocultados correctamente.\n\nSe ocultaron ${datos.ocultados || 0} foros.\nLas respuestas se mantienen guardadas.`);
        } else {
            alert("❌ Error al ocultar foros: " + datos.mensaje);
        }
    } catch (error) {
        console.error("❌ Error al ocultar foros:", error);
        alert("❌ Error de conexión.");
    }
}

// Mostrar todos los foros del docente
async function mostrarForosDocente(usuario_id) {
    console.log("👁️ Mostrando foros para docente ID:", usuario_id);
    
    let confirmar = confirm(
        "⚠️ ¿Estás seguro de mostrar TODOS los foros de este docente?\n\n" +
        "Los foros volverán a ser visibles para los estudiantes."
    );
    
    if (!confirmar) return;
    
    try {
        const respuesta = await fetch(
            `http://localhost:3000/mostrar-foros-docente/${usuario_id}`,
            {
                method: "PUT"
            }
        );
        
        const datos = await respuesta.json();
        
        if (datos.ok) {
            alert(`✅ Foros mostrados correctamente.\n\nSe mostraron ${datos.mostrados || 0} foros.`);
        } else {
            alert("❌ Error al mostrar foros: " + datos.mensaje);
        }
    } catch (error) {
        console.error("❌ Error al mostrar foros:", error);
        alert("❌ Error de conexión.");
    }
}

// Ocultar todos los Quizziz del docente
async function ocultarQuizzizDocente(usuario_id) {
    console.log("🙈 Ocultando Quizziz para docente ID:", usuario_id);
    
    let confirmar = confirm(
        "⚠️ ¿Estás seguro de ocultar TODOS los Quizziz de este docente?\n\n" +
        "Los Quizziz NO serán visibles para los estudiantes.\n" +
        "Las preguntas y resultados se MANTIENEN guardados.\n" +
        "Puedes volver a mostrarlos cuando quieras."
    );
    
    if (!confirmar) return;
    
    try {
        const respuesta = await fetch(
            `http://localhost:3000/ocultar-quizziz-docente/${usuario_id}`,
            {
                method: "PUT"
            }
        );
        
        const datos = await respuesta.json();
        
        if (datos.ok) {
            alert(`✅ Quizziz ocultados correctamente.\n\nSe ocultaron ${datos.ocultados || 0} Quizziz.\nLas preguntas y resultados se mantienen guardados.`);
        } else {
            alert("❌ Error al ocultar Quizziz: " + datos.mensaje);
        }
    } catch (error) {
        console.error("❌ Error al ocultar Quizziz:", error);
        alert("❌ Error de conexión.");
    }
}

// Mostrar todos los Quizziz del docente
async function mostrarQuizzizDocente(usuario_id) {
    console.log("👁️ Mostrando Quizziz para docente ID:", usuario_id);
    
    let confirmar = confirm(
        "⚠️ ¿Estás seguro de mostrar TODOS los Quizziz de este docente?\n\n" +
        "Los Quizziz volverán a ser visibles para los estudiantes."
    );
    
    if (!confirmar) return;
    
    try {
        const respuesta = await fetch(
            `http://localhost:3000/mostrar-quizziz-docente/${usuario_id}`,
            {
                method: "PUT"
            }
        );
        
        const datos = await respuesta.json();
        
        if (datos.ok) {
            alert(`✅ Quizziz mostrados correctamente.\n\nSe mostraron ${datos.mostrados || 0} Quizziz.`);
        } else {
            alert("❌ Error al mostrar Quizziz: " + datos.mensaje);
        }
    } catch (error) {
        console.error("❌ Error al mostrar Quizziz:", error);
        alert("❌ Error de conexión.");
    }
}

// ============================================
// OCULTAR/MOSTRAR FORO INDIVIDUAL
// ============================================

async function ocultarForo(id) {
    if (!confirm("⚠️ ¿Estás seguro de ocultar este foro?\n\nLos usuarios no podrán verlo, pero las respuestas se mantendrán guardadas.")) {
        return;
    }
    
    try {
        const respuesta = await fetch(`http://localhost:3000/ocultar-foro/${id}`, {
            method: "PUT"
        });
        
        const datos = await respuesta.json();
        
        if (datos.ok) {
            alert("✅ Foro ocultado correctamente.");
            cargarForosSoporte();
        } else {
            alert("❌ Error al ocultar el foro: " + datos.mensaje);
        }
    } catch (error) {
        console.error("❌ Error:", error);
        alert("❌ Error de conexión.");
    }
}

async function mostrarForo(id) {
    if (!confirm("⚠️ ¿Estás seguro de mostrar este foro?\n\nLos usuarios podrán verlo nuevamente.")) {
        return;
    }
    
    try {
        const respuesta = await fetch(`http://localhost:3000/mostrar-foro/${id}`, {
            method: "PUT"
        });
        
        const datos = await respuesta.json();
        
        if (datos.ok) {
            alert("✅ Foro mostrado correctamente.");
            cargarForosSoporte();
        } else {
            alert("❌ Error al mostrar el foro: " + datos.mensaje);
        }
    } catch (error) {
        console.error("❌ Error:", error);
        alert("❌ Error de conexión.");
    }
}

// ============================================
// OCULTAR/MOSTRAR QUIZZIZ INDIVIDUAL
// ============================================

async function ocultarQuiz(id) {
    if (!confirm("⚠️ ¿Estás seguro de ocultar este Quizziz?\n\nLos estudiantes no podrán verlo, pero las preguntas y resultados se mantendrán guardados.")) {
        return;
    }
    
    try {
        const respuesta = await fetch(`http://localhost:3000/ocultar-quiz/${id}`, {
            method: "PUT"
        });
        
        const datos = await respuesta.json();
        
        if (datos.ok) {
            alert("✅ Quizziz ocultado correctamente.");
            cargarQuizzesSoporte();
        } else {
            alert("❌ Error al ocultar el Quizziz: " + datos.mensaje);
        }
    } catch (error) {
        console.error("❌ Error:", error);
        alert("❌ Error de conexión.");
    }
}

async function mostrarQuiz(id) {
    if (!confirm("⚠️ ¿Estás seguro de mostrar este Quizziz?\n\nLos estudiantes podrán verlo nuevamente.")) {
        return;
    }
    
    try {
        const respuesta = await fetch(`http://localhost:3000/mostrar-quiz/${id}`, {
            method: "PUT"
        });
        
        const datos = await respuesta.json();
        
        if (datos.ok) {
            alert("✅ Quizziz mostrado correctamente.");
            cargarQuizzesSoporte();
        } else {
            alert("❌ Error al mostrar el Quizziz: " + datos.mensaje);
        }
    } catch (error) {
        console.error("❌ Error:", error);
        alert("❌ Error de conexión.");
    }
}

// ============================================
// CARGAR FOROS PARA SOPORTE
// ============================================
async function cargarForosSoporte() {
    try {
        const respuesta = await fetch("http://localhost:3000/foros-soporte");
        const foros = await respuesta.json();
        
        const contenedor = document.getElementById("listaForosSoporte");
        contenedor.innerHTML = "";
        
        if (foros.length === 0) {
            contenedor.innerHTML = `
                <div style="text-align:center; padding:40px; color:#999;">
                    📭 No hay foros registrados en el sistema.
                </div>
            `;
            return;
        }
        
        foros.forEach(foro => {
            const esVisible = foro.visible === 1;
            const badgeColor = esVisible ? "#27ae60" : "#e74c3c";
            const badgeText = esVisible ? "🟢 Visible" : "🔴 Oculto";
            
            contenedor.innerHTML += `
                <div class="foro-card" style="
                    background: white;
                    border: 2px solid ${esVisible ? '#27ae60' : '#e74c3c'};
                    border-radius: 12px;
                    padding: 20px;
                    margin-bottom: 15px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                ">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap;">
                        <div style="flex:1; min-width:200px;">
                            <h3 style="margin:0 0 8px 0; color:#2c3e50;">
                                💬 ${escaparHTML(foro.pregunta)}
                            </h3>
                            <p style="margin:5px 0; color:#666; font-size:14px;">
                                👨‍🏫 <strong>Docente:</strong> ${escaparHTML(foro.docente_nombre || foro.docente)}
                            </p>
                            <p style="margin:5px 0; color:#666; font-size:14px;">
                                📅 <strong>Fecha:</strong> ${new Date(foro.fecha).toLocaleDateString()}
                            </p>
                        </div>
                        <div style="text-align:right;">
                            <span style="
                                display:inline-block;
                                background:${badgeColor};
                                color:white;
                                padding:5px 15px;
                                border-radius:20px;
                                font-size:14px;
                                font-weight:bold;
                                margin-bottom:10px;
                            ">
                                ${badgeText}
                            </span>
                            <br>
                            ${esVisible ? `
                                <button onclick="ocultarForo(${foro.id})" 
                                        style="background:#e74c3c; color:white; border:none; padding:8px 15px; border-radius:8px; cursor:pointer; margin-top:5px;">
                                    🙈 Ocultar
                                </button>
                            ` : `
                                <button onclick="mostrarForo(${foro.id})" 
                                        style="background:#27ae60; color:white; border:none; padding:8px 15px; border-radius:8px; cursor:pointer; margin-top:5px;">
                                    👁️ Mostrar
                                </button>
                            `}
                        </div>
                    </div>
                </div>
            `;
        });
        
    } catch (error) {
        console.error("❌ Error al cargar foros:", error);
        document.getElementById("listaForosSoporte").innerHTML = `
            <div style="text-align:center; padding:40px; color:#e74c3c;">
                ❌ Error al cargar los foros. Verifica la conexión con el servidor.
            </div>
        `;
    }
}

// ============================================
// CARGAR QUIZZIZ PARA SOPORTE
// ============================================
async function cargarQuizzesSoporte() {
    try {
        const respuesta = await fetch("http://localhost:3000/quizzes-soporte");
        const quizzes = await respuesta.json();
        
        const contenedor = document.getElementById("listaQuizzesSoporte");
        contenedor.innerHTML = "";
        
        if (quizzes.length === 0) {
            contenedor.innerHTML = `
                <div style="text-align:center; padding:40px; color:#999;">
                    🎮 No hay Quizziz registrados en el sistema.
                </div>
            `;
            return;
        }
        
        quizzes.forEach(quiz => {
            const esVisible = quiz.visible === 1;
            const badgeColor = esVisible ? "#27ae60" : "#e74c3c";
            const badgeText = esVisible ? "🟢 Visible" : "🔴 Oculto";
            
            contenedor.innerHTML += `
                <div class="quiz-card" style="
                    background: white;
                    border: 2px solid ${esVisible ? '#27ae60' : '#e74c3c'};
                    border-radius: 12px;
                    padding: 20px;
                    margin-bottom: 15px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                ">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap;">
                        <div style="flex:1; min-width:200px;">
                            <h3 style="margin:0 0 8px 0; color:#2c3e50;">
                                📝 ${escaparHTML(quiz.titulo)}
                            </h3>
                            <p style="margin:5px 0; color:#666; font-size:14px;">
                                📚 <strong>Materia:</strong> ${escaparHTML(quiz.materia_nombre || 'Sin materia')}
                            </p>
                            <p style="margin:5px 0; color:#666; font-size:14px;">
                                👨‍🏫 <strong>Docente:</strong> ${escaparHTML(quiz.docente_nombre || 'Desconocido')}
                            </p>
                            <p style="margin:5px 0; color:#666; font-size:14px;">
                                ❓ <strong>Preguntas:</strong> ${quiz.total_preguntas || 0}
                            </p>
                            <p style="margin:5px 0; color:#666; font-size:14px;">
                                📊 <strong>Resultados:</strong> ${quiz.total_resultados || 0}
                            </p>
                        </div>
                        <div style="text-align:right;">
                            <span style="
                                display:inline-block;
                                background:${badgeColor};
                                color:white;
                                padding:5px 15px;
                                border-radius:20px;
                                font-size:14px;
                                font-weight:bold;
                                margin-bottom:10px;
                            ">
                                ${badgeText}
                            </span>
                            <br>
                            ${esVisible ? `
                                <button onclick="ocultarQuiz(${quiz.id})" 
                                        style="background:#e74c3c; color:white; border:none; padding:8px 15px; border-radius:8px; cursor:pointer; margin-top:5px;">
                                    🙈 Ocultar
                                </button>
                            ` : `
                                <button onclick="mostrarQuiz(${quiz.id})" 
                                        style="background:#27ae60; color:white; border:none; padding:8px 15px; border-radius:8px; cursor:pointer; margin-top:5px;">
                                    👁️ Mostrar
                                </button>
                            `}
                        </div>
                    </div>
                </div>
            `;
        });
        
    } catch (error) {
        console.error("❌ Error al cargar quizzes:", error);
        document.getElementById("listaQuizzesSoporte").innerHTML = `
            <div style="text-align:center; padding:40px; color:#e74c3c;">
                ❌ Error al cargar los Quizziz. Verifica la conexión con el servidor.
            </div>
        `;
    }
}