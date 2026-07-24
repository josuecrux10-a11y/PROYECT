/* ==========================================
   SOPA DE LETRAS
========================================== */

const palabrasSopa = [

    "HTML",
    "CSS",
    "PHP",
    "MYSQL",
    "JAVA"

];

const tamaño = 10;

let tablero = [];

let encontradas = 0;

let puntaje = 0;

let tiempo = 0;

let temporizador = null;

// ==============================
// SELECCIÓN DEL JUGADOR
// ==============================

let palabraActual = "";

let casillasSeleccionadas = [];
let palabrasEncontradas = [];

function iniciarSopa(){

    encontradas = 0;

    puntaje = 0;

    tiempo = 0;

    tablero = [];

    palabraActual = "";

    casillasSeleccionadas = [];

    palabrasEncontradas = [];

    crearTablero();

    llenarTablero();

    colocarPalabras();

    mostrarTablero();

    mostrarListaPalabras();

    actualizarPanel();

    mostrarPalabraActual();

}

function crearTablero(){

    for(let i=0;i<tamaño;i++){

        tablero[i]=[];

        for(let j=0;j<tamaño;j++){

            tablero[i][j]="";

        }

    }

}

/* ==========================================
   RELLENAR EL TABLERO CON LETRAS
========================================== */

function llenarTablero(){

    const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    for(let fila=0; fila<tamaño; fila++){

        for(let columna=0; columna<tamaño; columna++){

            let letra =
                letras.charAt(
                    Math.floor(
                        Math.random() * letras.length
                    )
                );

            tablero[fila][columna] = letra;

        }

    }

}

/* ==========================================
   COLOCAR PALABRAS HORIZONTALMENTE
========================================== */

function colocarPalabras(){

    palabrasSopa.forEach((palabra, indice)=>{

        let fila = indice * 2;

        let inicio = Math.floor(
            Math.random() * (tamaño - palabra.length)
        );

        for(let i=0; i<palabra.length; i++){

            tablero[fila][inicio+i] = palabra[i];

        }

    });

}


/* ==========================================
   MOSTRAR TABLERO
========================================== */

function mostrarTablero(){

    let contenedor =
        document.getElementById("tableroSopa");

    contenedor.innerHTML = "";

    for(let fila=0; fila<tamaño; fila++){

        let linea =
            document.createElement("div");

        for(let columna=0; columna<tamaño; columna++){

            let casilla =
                document.createElement("div");

            casilla.className = "casilla";

            casilla.textContent =
                tablero[fila][columna];
                casilla.dataset.fila = fila;
                casilla.dataset.columna = columna;
                casilla.addEventListener("click", function(){

                    seleccionarCasilla(this);

            });

            linea.appendChild(casilla);

        }

        contenedor.appendChild(linea);

    }

}

/* ==========================================
   MOSTRAR PALABRAS
========================================== */

function mostrarListaPalabras(){

    let lista =
        document.getElementById("listaPalabras");

    lista.innerHTML = "";

    palabrasSopa.forEach(p=>{

        let div =
            document.createElement("div");

        div.className = "palabra";

        div.id = "palabra_" + p;

        div.textContent = p;

        lista.appendChild(div);

    });

}
/* ==========================================
   MARCAR PALABRA EN LA LISTA
========================================== */

function actualizarLista(){

    let palabra = document.getElementById(

        "palabra_" + palabraActual

    );

    if(palabra){

        palabra.style.background="#27ae60";

        palabra.style.color="white";

        palabra.style.textDecoration="line-through";

    }

}

/* ==========================================
   SELECCIONAR CASILLA
========================================== */

function seleccionarCasilla(casilla){

    if(casilla.classList.contains("seleccionada")){

        return;

    }

    casilla.classList.add("seleccionada");

    palabraActual += casilla.textContent;

    casillasSeleccionadas.push(casilla);
    mostrarPalabraActual();
    verificarPalabra();

}
/* ==========================================
   VERIFICAR PALABRA
========================================== */

function verificarPalabra(){

    if(
        palabrasSopa.includes(palabraActual)
        &&
        !palabrasEncontradas.includes(palabraActual)
    ){

        palabrasEncontradas.push(palabraActual);

        palabraEncontrada();

    }

}

/* ==========================================
   PALABRA ENCONTRADA
========================================== */

function palabraEncontrada(){

    alert("🎉 ¡Encontraste la palabra: " + palabraActual + "!");

    encontradas++;

    puntaje += 20;

    actualizarPanel();

    actualizarLista();

    marcarPalabra();

    limpiarSeleccion();

}

/* ==========================================
   ACTUALIZAR PANEL
========================================== */

function actualizarPanel(){

    document.getElementById("contadorPalabras").textContent =
        encontradas + " / " + palabrasSopa.length;

    document.getElementById("puntajeJuego").textContent =
        puntaje;

}
/* ==========================================
   MARCAR PALABRA
========================================== */

function marcarPalabra(){

    casillasSeleccionadas.forEach(casilla=>{

        casilla.classList.remove("seleccionada");

        casilla.classList.add("encontrada");

    });

}
/* ==========================================
   LIMPIAR SELECCIÓN
========================================== */

function limpiarSeleccion(){

    palabraActual = "";

    casillasSeleccionadas = [];

    mostrarPalabraActual();

}


/* ==========================================
   MOSTRAR PALABRA ACTUAL
========================================== */

function mostrarPalabraActual(){

    let texto =
        document.getElementById("palabraActual");

    if(texto){

        texto.textContent = palabraActual;

    }

}
/* ==========================================
   ABRIR SOPA DE LETRAS
========================================== */

function abrirSopaLetras(){

    document.getElementById("contenedorSopa").style.display = "block";

    iniciarSopa();

}

function reiniciarSopa(){

    iniciarSopa();

}

/* ==========================================
   REINICIAR JUEGO
========================================== */

function reiniciarSopa(){

    iniciarSopa();

}
window.onload = function(){

    iniciarSopa();

};


