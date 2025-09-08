// Paleta institucional
const COLOR_VERDE = '#097137';
const COLOR_GRIS = '#575656';

// Depuración: Verificar que el script se carga
console.log('=== SCRIPT FORM-WIZARD.JS CARGADO ===');
console.log('Función saveEpisodiosData disponible:', typeof saveEpisodiosData);

const steps = [
  { title: 'Datos Generales de la Obra', render: renderStep1 },
  { title: 'Exhibición Internacional', render: renderStep2 },
  { title: 'Datos Técnicos', render: renderStepDatosTecnicos },
  { title: 'Participaciones', render: renderStepParticipaciones },
  { title: 'Episodios', render: renderStepEpisodios },
  { title: 'Firma Digital', render: renderStepFirma }
];

let currentStep = 0;
let formData = {};
let generosData = [];

// Variables globales para bloques de episodios
let contadorBloquesEpisodios = 0;

function saveEpisodiosData() {
  console.log('=== INICIO saveEpisodiosData ===');
  // Solo buscar bloques colapsables para evitar duplicados
  const bloques = document.querySelectorAll('.bloque-episodios-colapsable');
  console.log('Bloques encontrados:', bloques.length);
  let bloquesData = [];
  
  bloques.forEach((bloque, bloqueIndex) => {
    console.log(`Procesando bloque ${bloqueIndex}:`, bloque);
    const temporada = bloque.querySelector('.temporada')?.value || '';
    const desdeEpisodio = bloque.querySelector('.desde-episodio')?.value || '';
    const hastaEpisodio = bloque.querySelector('.hasta-episodio')?.value || '';
    console.log(`Bloque ${bloqueIndex} - Temporada: ${temporada}, Desde: ${desdeEpisodio}, Hasta: ${hastaEpisodio}`);
    
    // Obtener el ID del bloque desde el atributo id
    const bloqueId = bloque.id.replace('bloque-episodios-colapsable-', '');
    console.log(`Bloque ${bloqueIndex} - ID: ${bloqueId}`);
    
    // Obtener participaciones del almacenamiento por bloque
    let participacionesBloque = participacionesPorBloque[bloqueId] || [];
    console.log(`Bloque ${bloqueIndex} - Participaciones desde participacionesPorBloque:`, participacionesBloque);
    
    // Recopilar episodios del bloque
    const episodios = bloque.querySelectorAll('.episodio-item');
    console.log(`Episodios en bloque ${bloqueIndex}:`, episodios.length);
    let episodiosDelBloque = [];
    
    episodios.forEach((epi, epiIndex) => {
      console.log(`Procesando episodio ${epiIndex}:`, epi);
      const episodioObj = {
        numero: epi.getAttribute('data-episodio'),
        titulo: epi.querySelector('.titulo-episodio')?.value || '',
        participaciones: [...participacionesBloque]
      };
      console.log(`Episodio ${epiIndex} objeto final:`, episodioObj);
      episodiosDelBloque.push(episodioObj);
    });
    
    // Crear objeto del bloque
    const bloqueObj = {
      temporada,
      desde: desdeEpisodio,
      hasta: hastaEpisodio,
      participaciones: participacionesBloque,
      episodios: episodiosDelBloque
    };
    console.log(`Bloque ${bloqueIndex} objeto final:`, bloqueObj);
    bloquesData.push(bloqueObj);
  });
  
  console.log('Bloques data final:', bloquesData);
  
  // Transformar bloques al formato esperado por el esquema
  let episodiosParaEsquema = [];
  bloquesData.forEach((bloque, bloqueIndex) => {
    // Obtener el ID del bloque para buscar títulos
    const bloqueElement = document.querySelectorAll('.bloque-episodios-colapsable')[bloqueIndex];
    const bloqueId = bloqueElement ? bloqueElement.id.replace('bloque-episodios-colapsable-', '') : null;
    
    bloque.episodios.forEach(episodio => {
      // Buscar títulos alternativos del almacenamiento por bloque
      const titulosDelBloque = titulosPorBloque[bloqueId] || [];
      const titulosAlternativos = titulosDelBloque.filter(titulo => 
        titulo.episodio === episodio.numero
      );
      console.log(`Títulos alternativos para episodio ${episodio.numero} del bloque ${bloqueId}:`, titulosAlternativos);
      
      // Generar título automático si no hay título ingresado
      let tituloFinal = episodio.titulo || '';
      if (!tituloFinal.trim()) {
        // Formato: T01E001 (temporada con 2 dígitos, episodio con 3 dígitos)
        const temporadaFormateada = String(bloque.temporada).padStart(2, '0');
        const episodioFormateado = String(episodio.numero).padStart(3, '0');
        tituloFinal = `T${temporadaFormateada}E${episodioFormateado}`;
      }
      
      const episodioParaEsquema = {
        temporada: bloque.temporada,
        numero: episodio.numero || '',
        tituloEpisodio: tituloFinal,
        desdeEpisodio: bloque.desde,
        hastaEpisodio: bloque.hasta,
        participaciones: episodio.participaciones || [],
        titulosAlternativos: titulosAlternativos || []
      };
      episodiosParaEsquema.push(episodioParaEsquema);
      });
    });
  
  console.log('Episodios transformados para esquema:', episodiosParaEsquema);
  
  // Verificar si es obra serializada
  const formatoField = document.getElementById('formato');
  const formatoSeleccionado = formatoField ? formatoField.value : (formData.formato || '');
  const obrasSerializadas = ['Serie', 'Telenovela'];
  const esSerializada = obrasSerializadas.includes(formatoSeleccionado);
  
  console.log('Formato seleccionado:', formatoSeleccionado);
  console.log('Es obra serializada:', esSerializada);
  
  if (!esSerializada) {
    console.log('Obra NO serializada - Creando entrada única en stepEpisodios');
    // Recopilar participaciones generales del modal principal
    const participacionesGenerales = [];
    const filasGenerales = document.querySelectorAll('.tabla-participaciones-modal tbody tr');
    console.log('Filas de participaciones generales encontradas:', filasGenerales.length);
    
    // Obtener la lista de socios para buscar correos
    fetchJSON('socios.json').then(socios => {
      filasGenerales.forEach((tr, index) => {
        const rol = tr.querySelector('.rol-participacion')?.value || '';
        const autor = tr.querySelector('.autor-participacion')?.value || '';
        const porcentaje = tr.querySelector('.porcentaje-participacion')?.value || '';
        
        // Buscar el correo del autor en la lista de socios
        const socioEncontrado = socios.find(socio => socio["Nombre completo"] === autor);
        const correo = socioEncontrado ? socioEncontrado["Correo electrónico"] : '';
        
        const participacion = {
          rol,
          autor,
          porcentaje,
          correo
        };
        
        console.log(`Participación general ${index}:`, participacion);
        if (participacion.rol || participacion.autor || participacion.porcentaje) {
          participacionesGenerales.push(participacion);
        }
      });
      
      // Para obras no serializadas, crear una entrada única en stepEpisodios
      // que contenga las participaciones para que Power Automate pueda procesarla
      window.formData.stepEpisodios = [{
        temporada: '',
        numero: '',
        tituloEpisodio: '',
        desdeEpisodio: '',
        hastaEpisodio: '',
        participaciones: participacionesGenerales,
        titulosAlternativos: formData.episodiosTitulos?.titulosOtros || []
      }];
      
      console.log('stepEpisodios para obra no serializada:', window.formData.stepEpisodios);
      
      // Actualizar la sección de notificación a participantes
      actualizarSeccionNotificacion();
    }).catch(error => {
      console.error('Error al obtener socios para correos:', error);
      // Si hay error, guardar sin correos
      filasGenerales.forEach((tr, index) => {
        const participacion = {
          rol: tr.querySelector('.rol-participacion')?.value || '',
          autor: tr.querySelector('.autor-participacion')?.value || '',
          porcentaje: tr.querySelector('.porcentaje-participacion')?.value || '',
          correo: ''
        };
        console.log(`Participación general ${index}:`, participacion);
        if (participacion.rol || participacion.autor || participacion.porcentaje) {
          participacionesGenerales.push(participacion);
        }
      });
      
      // Para obras no serializadas, crear una entrada única en stepEpisodios
      window.formData.stepEpisodios = [{
        temporada: '',
        numero: '',
        tituloEpisodio: '',
        desdeEpisodio: '',
        hastaEpisodio: '',
        participaciones: participacionesGenerales,
        titulosAlternativos: formData.episodiosTitulos?.titulosOtros || []
      }];
      
      console.log('stepEpisodios para obra no serializada (sin correos):', window.formData.stepEpisodios);
    });
    
    // Para obras no serializadas, crear una entrada única en stepEpisodios
    // que contenga las participaciones para que Power Automate pueda procesarla
    window.formData.stepEpisodios = [{
      temporada: '',
      numero: '',
      tituloEpisodio: '',
      desdeEpisodio: '',
      hastaEpisodio: '',
      participaciones: participacionesGenerales,
      titulosAlternativos: formData.episodiosTitulos?.titulosOtros || []
    }];
    
    console.log('stepEpisodios para obra no serializada:', window.formData.stepEpisodios);
  } else {
    console.log('Obra serializada - Guardando episodios normalmente');
    // Obtener la lista de socios para buscar correos
    fetchJSON('socios.json').then(socios => {
      // Añadir correos a las participaciones de cada episodio
      episodiosParaEsquema.forEach(episodio => {
        if (episodio.participaciones && episodio.participaciones.length > 0) {
          episodio.participaciones = episodio.participaciones.map(participacion => {
            // Buscar el correo del autor en la lista de socios
            const socioEncontrado = socios.find(socio => socio["Nombre completo"] === participacion.autor);
            const correo = socioEncontrado ? socioEncontrado["Correo electrónico"] : '';
            return { ...participacion, correo };
          });
        }
      });
      
      // Guardar episodios en el formato esperado por el esquema
      window.formData.stepEpisodios = episodiosParaEsquema;
      console.log('Episodios guardados en stepEpisodios con correos:', window.formData.stepEpisodios);
      
      // Actualizar la sección de notificación a participantes
      actualizarSeccionNotificacion();
    }).catch(error => {
      console.error('Error al obtener socios para correos:', error);
      // Si hay error, guardar sin correos
      window.formData.stepEpisodios = episodiosParaEsquema;
      console.log('Episodios guardados en stepEpisodios sin correos:', window.formData.stepEpisodios);
    });
  }
  
  console.log('=== FIN saveEpisodiosData ===');
  console.log('formData final:', window.formData);
}



// Cargar datos de los JSON
const fetchJSON = async (file) => {
  const res = await fetch(`assets/${file}`);
  return res.json();
};

// Función para actualizar la sección de notificación a participantes
function actualizarSeccionNotificacion() {
  const seccionNotificacion = document.getElementById('seccion-notificacion-participantes');
  if (!seccionNotificacion) return;
  
  // Obtener todos los participantes de formData
  const participantes = [];
  
  // Añadir participaciones de obras no serializadas
  if (formData.participaciones && formData.participaciones.length > 0) {
    formData.participaciones.forEach(p => {
      if (p.autor && !participantes.some(existente => existente.autor === p.autor)) {
        participantes.push(p);
      }
    });
  }
  
  // Añadir participaciones de episodios
  if (formData.stepEpisodios && formData.stepEpisodios.length > 0) {
    formData.stepEpisodios.forEach(episodio => {
      if (episodio.participaciones && episodio.participaciones.length > 0) {
        episodio.participaciones.forEach(p => {
          if (p.autor && !participantes.some(existente => existente.autor === p.autor)) {
            participantes.push(p);
          }
        });
      }
    });
  }
  
  // Generar HTML para la lista de participantes
  let listaHTML = '';
  let conCorreo = 0;
  let sinCorreo = 0;
  
  participantes.forEach(p => {
    const tieneCorreo = p.correo && p.correo.trim() !== '';
    const claseCorreo = tieneCorreo ? 'tiene-correo' : 'sin-correo';
    const iconoCorreo = tieneCorreo ? '✓' : '✗';
    const mensajeCorreo = tieneCorreo ? p.correo : 'No se encontró correo';
    
    listaHTML += `<li class="${claseCorreo}">
      <span class="nombre-participante">${p.autor}</span>
      <span class="estado-correo">${iconoCorreo}</span>
      <span class="correo-participante">${mensajeCorreo}</span>
    </li>`;
    
    if (tieneCorreo) conCorreo++;
    else sinCorreo++;
  });
  
  // Actualizar el contenido de la sección
  const mensajeInicial = sinCorreo > 0 ?
    `<div class="alerta-correos">Se encontraron ${sinCorreo} participantes sin correo electrónico. Se recomienda notificarlos manualmente mientras se actualizan los datos en ATN.</div>` :
    '';
  
  seccionNotificacion.innerHTML = `
    <div class="notificacion-header">
      <h4>Notificación a participantes</h4>
      <p>Al enviar este formulario, se notificará automáticamente a los siguientes participantes:</p>
      ${mensajeInicial}
    </div>
    <ul class="lista-participantes-notificacion">
      ${listaHTML || '<li>No hay participantes para notificar</li>'}
    </ul>
    <div class="notificacion-footer">
      <p>Total: ${participantes.length} participantes (${conCorreo} con correo, ${sinCorreo} sin correo)</p>
    </div>
  `;
}

// Inicializar el carrusel de progreso
function inicializarCarruselProgreso() {
  const track = document.querySelector('.progress-track');
  const slides = document.querySelectorAll('.progress-slide');
  const prevBtn = document.querySelector('.nav-arrow.prev');
  const nextBtn = document.querySelector('.nav-arrow.next');
  const slidesToShow = 3; // Número de pasos visibles a la vez
  
  if (!track || !slides.length) return;
  
  // Calcular el ancho de cada slide basado en el número de slides a mostrar
  const slideWidth = 100 / slidesToShow;
  slides.forEach(slide => {
    slide.style.minWidth = `calc(${slideWidth}% - 10px)`;
  });
  
  // Función para actualizar la visibilidad de los botones de navegación
  function updateNavButtons() {
    if (!prevBtn || !nextBtn) return;
    const maxIndex = Math.max(0, slides.length - slidesToShow);
    prevBtn.disabled = window.currentIndex <= 0;
    nextBtn.disabled = window.currentIndex >= maxIndex;
  }
  
  // Función para mover el carrusel
  function moveToSlide(index) {
    if (!track) return;
    
    // Asegurarse de que el índice esté dentro de los límites
    const maxIndex = Math.max(0, slides.length - slidesToShow);
    const newIndex = Math.max(0, Math.min(index, maxIndex));
    
    // Solo actualizar si el índice ha cambiado
    if (window.currentIndex !== newIndex) {
      window.currentIndex = newIndex;
      const offset = -window.currentIndex * (100 / slidesToShow);
      track.style.transition = 'transform 0.3s ease';
      track.style.transform = `translateX(${offset}%)`;
      updateNavButtons();
      
      // Forzar actualización del DOM
      track.offsetHeight;
    }
  }
  
  // Event listeners para los botones de navegación
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      moveToSlide(window.currentIndex - 1);
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      moveToSlide(window.currentIndex + 1);
    });
  }
  
  // Inicializar botones de navegación
  window.currentIndex = 0;
  updateNavButtons();
}

// Actualizar la barra de progreso
function actualizarBarraProgreso(pasoActual) {
  const slides = document.querySelectorAll('.progress-slide');
  if (!slides.length) return;
  
  const slidesToShow = 3;
  const totalSlides = slides.length;
  const maxIndex = Math.max(0, totalSlides - slidesToShow);
  const track = document.querySelector('.progress-track');
  if (!track) return;
  
  // Actualizar clases activas
  slides.forEach((slide, index) => {
    const step = slide.querySelector('.progress-step');
    const label = slide.querySelector('.step-label');
    const isActive = (index + 1) === pasoActual;
    
    slide.classList.toggle('active', isActive);
    if (step) step.classList.toggle('active', isActive);
    if (label) label.classList.toggle('active', isActive);
    
    // Si es el paso actual, asegurarse de que sea visible
    if (isActive) {
      let targetIndex = 0;
      const currentIndex = index;
      
      // Calcular el índice objetivo según la posición del paso actual
      if (currentIndex <= 1) {
        targetIndex = 0; // Primeros dos pasos
      } else if (currentIndex >= totalSlides - 2) {
        targetIndex = Math.max(0, totalSlides - slidesToShow); // Últimos dos pasos
      } else {
        targetIndex = currentIndex - 1; // Pasos intermedios
      }
      
      // Asegurar que no nos pasemos del máximo índice
      targetIndex = Math.min(targetIndex, maxIndex);
      
      // Solo actualizar si es necesario
      const isOutOfView = currentIndex < window.currentIndex || 
                         currentIndex >= window.currentIndex + slidesToShow;
      
      if (isOutOfView || window.currentIndex > maxIndex) {
        window.currentIndex = targetIndex;
        const offset = -window.currentIndex * (100 / slidesToShow);
        track.style.transition = 'transform 0.3s ease';
        track.style.transform = `translateX(${offset}%)`;
        track.offsetHeight; // Forzar actualización del DOM
      }
    }
  });
  
  // Actualizar estado de los botones de navegación
  const prevBtn = document.querySelector('.nav-arrow.prev');
  const nextBtn = document.querySelector('.nav-arrow.next');
  
  if (prevBtn) prevBtn.disabled = window.currentIndex <= 0;
  if (nextBtn) nextBtn.disabled = window.currentIndex >= maxIndex;
}

// Reemplazar la función renderProgress
function renderProgress() {
  // La cinta ya está en el HTML, solo actualizar el estado
  actualizarBarraProgreso(currentStep + 1);
}

// Renderizar la sección de exhibición internacional
async function renderStep2(container) {
  container.innerHTML = `
    <div class="note-box">
      <div class="note-icon">ℹ️</div>
      <div class="note-content">
        <strong>Nota:</strong> Complete esta sección solo si la obra ha tenido exhibición internacional. No es obligatorio completar este apartado.
      </div>
    </div>
    
    <div class="tabla-exhibiciones-container">
      <table class="tabla-exhibiciones">
        <thead>
          <tr>
            <th>Otro título</th>
            <th>Idioma</th>
            <th>País de exhibición</th>
            <th>Canal / Plataforma / Sala</th>
            <th>Eliminar</th>
          </tr>
        </thead>
        <tbody>
          <!-- Filas dinámicas -->
        </tbody>
      </table>
    </div>
    
    <div style="display: flex; gap: 10px; margin-top: 15px; flex-wrap: wrap;">
      <button type="button" class="btn btn-outline-success btn-agregar-exhibicion">
        <i class="fas fa-plus"></i> Agregar exhibición
      </button>
    </div>
  `;
  
  // Manejador para agregar más exhibiciones
  document.querySelector('.btn-agregar-exhibicion').addEventListener('click', agregarFilaExhibicion);
  
  // Restaurar datos si existen, o agregar una fila vacía si no hay datos
  if (formData.step2 && formData.step2.exhibiciones && formData.step2.exhibiciones.length > 0) {
    restaurarExhibiciones();
  } else {
    // Solo agregar una fila vacía si no hay datos existentes
    agregarFilaExhibicion();
  }
}

async function agregarFilaExhibicion() {
  const tbody = document.querySelector('.tabla-exhibiciones tbody');
  const exhibicionId = Date.now(); // ID único para cada exhibición
  
  // Cargar datos necesarios
  const [paisesRaw, idiomas] = await Promise.all([
    fetchJSON('paises.json'),
    fetchJSON('idioma.json')
  ]);
  const paises = paisesRaw;
  
  const fila = document.createElement('tr');
  fila.setAttribute('data-exhibicion-id', exhibicionId);
  
  fila.innerHTML = `
    <td>
      <input type="text" 
             class="form-control" 
             name="exhibiciones[${exhibicionId}][otro_titulo]" 
             placeholder="Título con el que se exhibió">
    </td>
    <td>
      <select class="form-control idioma-select" 
              name="exhibiciones[${exhibicionId}][idioma]">
        <option value="">Seleccione...</option>
        ${idiomas.map(idioma => `<option value="${idioma.Idioma}">${idioma.Idioma}</option>`).join('')}
      </select>
    </td>
    <td>
      <select class="form-control pais-select" 
              name="exhibiciones[${exhibicionId}][pais]">
        <option value="">Seleccione...</option>
        ${paises.map(pais => `<option value="${pais["Nombre del país"]}">${pais["Nombre del país"]}</option>`).join('')}
      </select>
    </td>
    <td>
      <input type="text" 
             class="form-control" 
             name="exhibiciones[${exhibicionId}][canal]" 
             placeholder="Canal, plataforma o sala">
    </td>
    <td>
      <button type="button" 
              class="btn btn-sm btn-outline-danger btn-eliminar-exhibicion" 
              data-exhibicion-id="${exhibicionId}">
        <i class="fas fa-trash"></i>
      </button>
    </td>
  `;
  
  tbody.appendChild(fila);
  
  // Inicializar Select2 para los nuevos selects
  if (window.$ && window.$.fn.select2) {
    $(fila.querySelector('.idioma-select')).select2({
      placeholder: 'Seleccione...',
      width: '100%',
      allowClear: true
    });
    
    $(fila.querySelector('.pais-select')).select2({
      placeholder: 'Seleccione...',
      width: '100%',
      allowClear: true
    });
  }
  
  // Agregar evento para eliminar fila con animación
  fila.querySelector('.btn-eliminar-exhibicion').addEventListener('click', function() {
    eliminarFilaExhibicionConAnimacion(fila);
  });
}

// Función para eliminar fila con animación
function eliminarFilaExhibicionConAnimacion(fila) {
  // Agregar clase de animación de salida
  fila.classList.add('removing');
  
  // Esperar a que termine la animación antes de remover
  setTimeout(() => {
    fila.remove();
  }, 300); // 300ms coincide con la duración de la animación CSS
}

// Función para restaurar exhibiciones desde formData
function restaurarExhibiciones() {
  const tbody = document.querySelector('.tabla-exhibiciones tbody');
  tbody.innerHTML = ''; // Limpiar tabla
  
  if (formData.step2 && formData.step2.exhibiciones) {
    formData.step2.exhibiciones.forEach(exhibicion => {
      agregarFilaExhibicionConDatos(exhibicion);
    });
  }
}

// Función para agregar fila con datos específicos
async function agregarFilaExhibicionConDatos(datos) {
  const tbody = document.querySelector('.tabla-exhibiciones tbody');
  const exhibicionId = datos.id || Date.now();
  
  // Cargar datos necesarios
  const [paisesRaw, idiomas] = await Promise.all([
    fetchJSON('paises.json'),
    fetchJSON('idioma.json')
  ]);
  const paises = paisesRaw;
  
  const fila = document.createElement('tr');
  fila.setAttribute('data-exhibicion-id', exhibicionId);
  
  fila.innerHTML = `
    <td>
      <input type="text" 
             class="form-control" 
             name="exhibiciones[${exhibicionId}][otro_titulo]" 
             placeholder="Título con el que se exhibió"
             value="${datos.otro_titulo || ''}">
    </td>
    <td>
      <select class="form-control idioma-select" 
              name="exhibiciones[${exhibicionId}][idioma]">
        <option value="">Seleccione...</option>
        ${idiomas.map(idioma => `<option value="${idioma.Idioma}" ${idioma.Idioma === datos.idioma ? 'selected' : ''}>${idioma.Idioma}</option>`).join('')}
      </select>
    </td>
    <td>
      <select class="form-control pais-select" 
              name="exhibiciones[${exhibicionId}][pais]">
        <option value="">Seleccione...</option>
        ${paises.map(pais => `<option value="${pais["Nombre del país"]}" ${pais["Nombre del país"] === datos.pais ? 'selected' : ''}>${pais["Nombre del país"]}</option>`).join('')}
      </select>
    </td>
    <td>
      <input type="text" 
             class="form-control" 
             name="exhibiciones[${exhibicionId}][canal]" 
             placeholder="Canal, plataforma o sala"
             value="${datos.canal || ''}">
    </td>
    <td>
      <button type="button" 
              class="btn btn-sm btn-outline-danger btn-eliminar-exhibicion" 
              data-exhibicion-id="${exhibicionId}">
        <i class="fas fa-trash"></i>
      </button>
    </td>
  `;
  
  tbody.appendChild(fila);
  
  // Inicializar Select2 para los nuevos selects
  if (window.$ && window.$.fn.select2) {
    $(fila.querySelector('.idioma-select')).select2({
      placeholder: 'Seleccione...',
      width: '100%',
      allowClear: true
    });
    
    $(fila.querySelector('.pais-select')).select2({
      placeholder: 'Seleccione...',
      width: '100%',
      allowClear: true
    });
  }
  
  // Agregar evento para eliminar fila con animación
  fila.querySelector('.btn-eliminar-exhibicion').addEventListener('click', function() {
    eliminarFilaExhibicionConAnimacion(fila);
  });
}

async function inicializarSelect2() {
  // Cargar datos necesarios
  const [paisesRaw, idiomas] = await Promise.all([
    fetchJSON('paises.json'),
    fetchJSON('idioma.json')
  ]);
  const paises = paisesRaw;
  // Inicializar selects de idioma
  $('.idioma-select').each(function() {
    if (!$(this).hasClass('select2-hidden-accessible')) {
      const select = $(this);
      select.empty().append('<option value="">Seleccione...</option>');
      idiomas.forEach(idioma => {
        if (idioma.Idioma) {
          select.append(new Option(idioma.Idioma, idioma.Idioma));
        }
      });
      select.select2({
        placeholder: 'Seleccione...',
        width: '100%',
        allowClear: true
      });
    }
  });
  // Inicializar selects de país
  $('.pais-select').each(function() {
    if (!$(this).hasClass('select2-hidden-accessible')) {
      const select = $(this);
      select.empty().append('<option value="">Seleccione...</option>');
      paises.forEach(pais => {
        select.append(new Option(pais["Nombre del país"], pais["Nombre del país"]));
      });
      select.select2({
        placeholder: 'Seleccione...',
        width: '100%',
        allowClear: true
      });
      select.trigger('change.select2');
    }
  });
  
  // Restaurar las variables globales participacionesPorBloque y titulosPorBloque
  bloquesAgrupados.forEach((bloqueData, claveBloque) => {
    const bloqueId = bloqueIndex - bloquesAgrupados.size + Array.from(bloquesAgrupados.keys()).indexOf(claveBloque);
    
    // Restaurar participaciones por bloque
    if (bloqueData.participaciones && bloqueData.participaciones.length > 0) {
      participacionesPorBloque[bloqueId] = bloqueData.participaciones;
    }
    
    // Restaurar títulos por bloque
    if (bloqueData.titulosAlternativos && bloqueData.titulosAlternativos.length > 0) {
      titulosPorBloque[bloqueId] = bloqueData.titulosAlternativos;
    }
  });
  
  console.log('Variables globales restauradas:', {
    participacionesPorBloque,
    titulosPorBloque
  });
}

// Renderizar el primer paso
async function renderStep1(container) {
  // Cargar datos
  const [formatos, generos, productoras, paises, idiomas] = await Promise.all([
    fetchJSON('formato.json'),
    fetchJSON('genero.json'),
    fetchJSON('productoras.json'),
    fetchJSON('paises.json'),
    fetchJSON('idioma.json')
  ]);
  generosData = generos; // Guardar para filtrar dinámicamente

  function getGenerosByFormato(formato) {
    if (formato === 'Largometraje' || formato === 'Cortometraje') {
      return generos.filter(g => g.genero === 'Ficción' || g.genero === 'Documental');
    }
    if (formato === 'Serie' || formato === 'Telenovela') {
      return generos.filter(g => g.genero === 'Ficción');
    }
    if (formato === 'Serie documental') {
      return generos.filter(g => g.genero === 'Noticias' || g.genero === 'Reportaje' || g.genero === 'Documental');
    }
    return generos;
  }

  function renderGeneroOptions(formato) {
    if (!formato) {
      return '<option value="">Seleccione formato antes para mostrar opciones</option>';
    }
    const generosFiltrados = getGenerosByFormato(formato);
    return [
      '<option value="">Seleccione...</option>',
      ...generosFiltrados.filter(g => g.genero).map(g => `<option value="${g.genero}">${g.genero}</option>`)
    ].join('');
  }

  container.innerHTML = `
    <div class="form-group">
      <label for="titulo">Título original <span style="color:${COLOR_VERDE}">*</span></label>
      <input type="text" id="titulo" name="titulo" placeholder="Ej: El laberinto del fauno" required>
    </div>
    <div class="form-group">
      <label for="formato">Tipo de formato <span style="color:${COLOR_VERDE}">*</span></label>
      <select id="formato" name="formato" required>
        <option value="">Seleccione...</option>
        ${formatos.filter(f => f.formato).map(f => `<option value="${f.formato}">${f.formato}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label for="genero">Género <span style="color:${COLOR_VERDE}">*</span></label>
      <select id="genero" name="genero" required disabled>
        <option value="">Seleccione formato antes para mostrar opciones</option>
      </select>
    </div>
    <div class="form-group">
      <label for="productora">Empresa productora <span style="color:${COLOR_VERDE}">*</span></label>
      <select id="productora" name="productora" multiple required>
        ${productoras.map(p => `<option value="${p.Productora}">${p.Productora}</option>`).join('')}
      </select>
      <div class="input-hint">Si no aparece, escriba el nombre completo para agregarla. Puede seleccionar varias.</div>
    </div>
    <div class="form-group">
      <label for="paises">País de producción</label>
      <select id="paises" name="paises" multiple>
        ${paises.map(p => `<option value="${p["Nombre del país"]}">${p["Nombre del país"]}</option>`).join('')}
      </select>
      <div class="input-hint">Puede seleccionar varios países.</div>
    </div>
    <div class="form-group">
      <label for="anio">Año de producción <span style="color:${COLOR_VERDE}">*</span></label>
      <input type="number" id="anio" name="anio" min="1900" max="${new Date().getFullYear()}" placeholder="Ej: 2019" required>
    </div>
    <div class="form-group">
      <label for="idioma">Idioma</label>
      <select id="idioma" name="idioma">
        <option value="">Seleccione...</option>
        ${idiomas.filter(i => i.Idioma).map(i => `<option value="${i.Idioma}">${i.Idioma}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label for="actores">Actores</label>
      <input type="text" id="actores" name="actores" placeholder="Ej: Juan Pérez, María García">
      <div class="input-hint">Separe los nombres con coma y espacio.</div>
    </div>
    <div class="form-group">
      <label for="directores">Directores</label>
      <input type="text" id="directores" name="directores" placeholder="Ej: Pedro Almodóvar, Alejandro Amenábar">
    </div>
    <div class="form-group">
      <label for="guionistas">Guionistas</label>
      <input type="text" id="guionistas" name="guionistas" placeholder="Ej: Guillermo del Toro, Pedro Peirano">
    </div>
  `;

  // Activar Select2 en todos los selects
  if (window.$ && window.$.fn.select2) {
    $(container).find('select').each(function() {
      const isMultiple = $(this).prop('multiple');
      let id = $(this).attr('id');
      let placeholder = (id === 'paises' || id === 'productora')
        ? 'Seleccione o escriba...'
        : $(this).find('option:first').text();
      $(this).select2({
        placeholder: placeholder,
        width: '100%',
        allowClear: true,
        tags: id === 'productora' || id === 'paises',
        multiple: isMultiple
      });
    });
  }

  // Lógica para actualizar género según formato
  $('#formato').on('change', function() {
    const formatoSel = $(this).val();
    const generoSelect = $('#genero');
    generoSelect.html(renderGeneroOptions(formatoSel));
    generoSelect.val('').trigger('change');
    
    // Habilitar/deshabilitar el select de género según si hay formato seleccionado
    if (formatoSel) {
      generoSelect.prop('disabled', false);
      generoSelect.select2({
        placeholder: 'Seleccione...',
        width: '100%',
        allowClear: true
      });
    } else {
      generoSelect.prop('disabled', true);
      generoSelect.select2({
        placeholder: 'Seleccione formato antes para mostrar opciones',
        width: '100%'
      });
    }
  });
}

// Normaliza nombres: quita espacios extra y pone espacio tras coma
function normalizarNombres(str) {
  return str
    .replace(/\s{2,}/g, ' ') // más de un espacio a uno
    .replace(/,\s*/g, ', ')  // coma seguida de cualquier espacio a coma+espacio
    .replace(/, +/g, ', ')   // varias espacios tras coma a uno
    .replace(/^\s+|\s+$/g, ''); // quita espacios al inicio/fin
}

// Función para guardar los datos del paso 2 (exhibiciones internacionales)
function saveStep2Data() {
  // Asegurarse de que formData.step2 existe
  if (!formData) formData = { step1: {}, step2: { exhibiciones: [] } };
  if (!formData.step2) formData.step2 = { exhibiciones: [] };
  
  // Inicializar array de exhibiciones
  formData.step2.exhibiciones = [];
  
  // Obtener todas las filas de la tabla de exhibiciones
  const filas = document.querySelectorAll('.tabla-exhibiciones tbody tr');
  
  filas.forEach((fila) => {
    const exhibicionId = fila.getAttribute('data-exhibicion-id');
    const datosExhibicion = {
      id: exhibicionId,
      otro_titulo: fila.querySelector('input[name$="[otro_titulo]"]')?.value || '',
      idioma: fila.querySelector('select[name$="[idioma]"]')?.value || '',
      pais: fila.querySelector('select[name$="[pais]"]')?.value || '',
      canal: fila.querySelector('input[name$="[canal]"]')?.value || ''
    };
    
    // Solo agregar si al menos un campo tiene datos
    if (datosExhibicion.otro_titulo || datosExhibicion.idioma || datosExhibicion.pais || datosExhibicion.canal) {
      formData.step2.exhibiciones.push(datosExhibicion);
    }
  });
  
  console.log('Datos del paso 2 guardados:', formData.step2);
  return true;
}

function saveStepFirmaData() {
  console.log('=== GUARDANDO DATOS PASO FIRMA ===');
  
  // Guardar datos del declarante
  const nombreDeclarante = document.getElementById('declarante-nombre')?.value || '';
  const rutDeclarante = document.getElementById('declarante-rut')?.value || '';
  const correoDeclarante = document.getElementById('declarante-correo')?.value || '';
  
  // Calcular fecha de declaración automáticamente (invisible para el usuario)
  // Enviar solo la fecha en formato YYYY-MM-DD para cumplir formato date requerido por Power Automate
  const ahora = new Date();
  
  // Obtener solo la fecha actual en zona horaria de Chile usando Intl.DateTimeFormat
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const fechaDeclaracion = formatter.format(ahora); // Formato YYYY-MM-DD
  
  // Inicializar objeto declarante si no existe
  if (!formData.declarante) {
    formData.declarante = {};
  }
  
  // Obtener estado del checkbox de declaración de veracidad
  const declaracionVeracidad = document.getElementById('declaracion-veracidad')?.checked || false;
  
  formData.declarante.nombre = nombreDeclarante;
  formData.declarante.rut = rutDeclarante;
  formData.declarante.correoDeclarante = correoDeclarante; // Nuevo campo de correo
  formData.declarante.fechaDeclaracion = fechaDeclaracion;
  formData.declarante.declaracionVeracidad = declaracionVeracidad; // Nuevo campo para el checkbox
  
  console.log('Datos del declarante guardados:', {
    nombre: nombreDeclarante,
    rut: rutDeclarante,
    correoDeclarante: correoDeclarante,
    fechaDeclaracion: fechaDeclaracion,
    declaracionVeracidad: declaracionVeracidad
  });
}

// Función para obtener los datos de las participaciones del modal
function obtenerDatosParticipacionesModal() {
  const filas = document.querySelectorAll('#modalParticipaciones .tabla-participaciones tbody tr');
  const participaciones = [];
  filas.forEach(fila => {
    participaciones.push({
      rol: fila.querySelector('.rol-modal-participacion')?.value || '',
      autor: fila.querySelector('.autor-modal-participacion')?.value || '',
      porcentaje: fila.querySelector('.porcentaje-modal-participacion')?.value || ''
    });
  });
  return participaciones;
}

// Función para guardar participaciones del modal al navegar entre pasos
function saveParticipacionesModal() {
  // Verificar si el modal tiene datos
  const filas = document.querySelectorAll('#modalParticipaciones .tabla-participaciones tbody tr');
  if (!filas || filas.length === 0) {
    return; // No hay datos que guardar
  }
  
  // Verificar si hay al menos una fila con datos
  let hayDatos = false;
  filas.forEach(fila => {
    const rol = fila.querySelector('.rol-modal-participacion')?.value || '';
    const autor = fila.querySelector('.autor-modal-participacion')?.value || '';
    const porcentaje = fila.querySelector('.porcentaje-modal-participacion')?.value || '';
    if (rol || autor || porcentaje) {
      hayDatos = true;
    }
  });
  
  if (!hayDatos) {
    return; // No hay datos reales que guardar
  }
  
  console.log('=== GUARDANDO PARTICIPACIONES DEL MODAL AL NAVEGAR ===');
  console.log('Bloque actual del modal:', bloqueActualModal);
  
  // Obtener las participaciones del modal
  const participacionesModal = obtenerDatosParticipacionesModal();
  console.log('Participaciones del modal:', participacionesModal);
  
  // Si hay un bloque específico, guardar las participaciones para ese bloque
  if (bloqueActualModal) {
    participacionesPorBloque[bloqueActualModal] = [...participacionesModal];
    console.log('Participaciones guardadas para bloque', bloqueActualModal, ':', participacionesPorBloque[bloqueActualModal]);
  } else {
    // Fallback para obras no serializadas
    const formatoSelect = document.getElementById('formato');
    const esSerializada = formatoSelect && (formatoSelect.value === 'Serie' || formatoSelect.value === 'Miniserie');
    
    if (!esSerializada) {
      console.log('Obra no serializada: Guardando en stepParticipaciones');
      formData.stepParticipaciones = participacionesModal;
      console.log('Participaciones guardadas en stepParticipaciones:', formData.stepParticipaciones);
    }
  }
}

// Función para guardar los datos del paso actual
function saveCurrentStepData() {
  if (currentStep === 0) {
    saveStep1Data();
  } else if (currentStep === 1) {
    saveStep2Data();
  } else if (currentStep === 2) {
    // Guardar datos técnicos en step1 ya que están relacionados
    saveStep1Data();
  } else if (currentStep === 3) {
    saveParticipacionesData();
  } else if (currentStep === 4) {
    saveEpisodiosData();
    // También guardar participaciones del modal si está abierto o tiene datos
    saveParticipacionesModal();
  } else if (currentStep === 5) {
    saveStepFirmaData();
  }
  // Agregar más pasos según sea necesario
}

// Función para restaurar los datos de un paso
function restoreStepData(stepIndex, container) {
  if (stepIndex === 0 && formData.step1) {
    restoreStep1Data(container);
  } else if (stepIndex === 1 && formData.step2) {
    restoreStep2Data(container);
  } else if (stepIndex === 2 && formData.step1) {
    // Restaurar datos técnicos desde step1
    restoreStepDatosTecnicos(container);
  } else if (stepIndex === 3 && formData.participaciones) {
    // La restauración de participaciones se maneja en renderStepParticipaciones
    console.log('Datos de participaciones disponibles para restaurar');
  } else if (stepIndex === 4 && formData.stepEpisodios) {
    restoreStepEpisodios(container);
  }
  // Agregar más pasos según sea necesario
}

// Función para hacer scroll suave al principio de la página
function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

// Navegación y lógica principal con animaciones
async function showStep(idx) {
  console.log('Mostrando paso:', idx + 1);
  
  // Validar que el índice esté dentro de los límites
  if (idx < 0 || idx >= steps.length) {
    console.error('Índice de paso no válido:', idx);
    return;
  }
  
  // Obtener el elemento del paso actual y el siguiente
  const currentStepId = `step-${currentStep + 1}`;
  const nextStepId = `step-${idx + 1}`;
  const currentStepElement = document.getElementById(currentStepId);
  const nextStepElement = document.getElementById(nextStepId);
  
  if (!nextStepElement) {
    console.error('No se encontró el elemento del paso:', nextStepId);
    return;
  }
  
  // Guardar datos del paso actual antes de cambiar
  if (currentStep >= 0 && currentStep < steps.length) {
    saveCurrentStepData();
  }
  
  // Iniciar animación de transición
  if (currentStepElement) {
    currentStepElement.classList.remove('active');
  }
  
  // Mostrar el siguiente paso
  nextStepElement.style.display = 'block';
  
  // Forzar un reflow para que la animación funcione
  void nextStepElement.offsetHeight;
  
  // Aplicar la clase active para iniciar la animación
  nextStepElement.classList.add('active');
  
  // Actualizar paso actual
  currentStep = idx;
  
  // Actualizar la barra de progreso
  actualizarBarraProgreso(currentStep + 1);
  
  // Renderizar el paso si es necesario
  if (steps[idx]) {
    console.log('Renderizando paso:', idx + 1);
    try {
      await steps[idx].render(nextStepElement);
      // Restaurar datos guardados para este paso
      restoreStepData(idx, nextStepElement);
      
      // Configurar validación de nombres después de renderizar el paso 1
      if (idx === 0) {
        setupNameValidation();
      }
    } catch (error) {
      console.error('Error al renderizar el paso:', error);
    }
  }
  
  // Desplazarse al principio del formulario
  scrollToTop();
  
  // Actualizar controles de navegación
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const submitBtn = document.getElementById('submit-btn');
  
  if (prevBtn) prevBtn.disabled = idx === 0;
  if (nextBtn) nextBtn.style.display = idx === steps.length - 1 ? 'none' : '';
  if (submitBtn) submitBtn.style.display = idx === steps.length - 1 ? '' : 'none';
}

// Mostrar mensaje de error
function showError(element, message) {
  const formGroup = element.closest('.form-group');
  if (!formGroup) return;
  
  // Marcar el grupo como con error
  formGroup.classList.add('has-error');
  
  // Agregar o actualizar el mensaje de error
  let errorElement = formGroup.querySelector('.error-message');
  if (!errorElement) {
    errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    
    // Insertar después del elemento de entrada o select
    if (element.nextSibling) {
      element.parentNode.insertBefore(errorElement, element.nextSibling);
    } else {
      formGroup.appendChild(errorElement);
    }
  }
  
  errorElement.textContent = message;
  
  // Agregar clase de error al campo
  element.classList.add('error');
  
  // Enfocar el primer campo con error
  if (!document.querySelector('.has-error')) {
    setTimeout(() => element.focus(), 100);
  }
}

// Limpiar mensaje de error
function clearError(element) {
  if (!element) return;
  
  const formGroup = element.closest('.form-group');
  if (!formGroup) return;
  
  // Quitar clases de error
  formGroup.classList.remove('has-error');
  element.classList.remove('error');
  
  // Eliminar mensaje de error si existe
  const errorElement = formGroup.querySelector('.error-message');
  if (errorElement) {
    errorElement.remove();
  }
  
  // Limpiar también en los selects de Select2
  if ($.fn.select2 && $(element).hasClass('select2-hidden-accessible')) {
    const $select2 = $(element).data('select2');
    if ($select2) {
      $select2.$container.removeClass('error');
    }
  }
}

// Validar campos obligatorios del paso 1
function validarAnio(anio) {
  if (!anio) return false;
  const year = parseInt(anio, 10);
  return !isNaN(year) && year >= 1900 && year <= 2025;
}

function validateStep1() {
  let isValid = true;
  const currentYear = new Date().getFullYear();
  
  // Limpiar errores previos
  document.querySelectorAll('.error-message').forEach(el => el.remove());
  document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
  
  // Validar año primero
  const anioInput = document.getElementById('anio');
  if (anioInput) {
    const anio = anioInput.value.trim();
    if (!anio) {
      showError(anioInput, 'El año de producción es obligatorio');
      isValid = false;
    } else if (!validarAnio(anio)) {
      showError(anioInput, 'El año debe estar entre 1900 y 2025');
      isValid = false;
    }
  }
  
  // Campos obligatorios (excluyendo año que ya validamos)
  const requiredFields = [
    { id: 'titulo', label: 'Título' },
    { id: 'formato', label: 'Formato' },
    { id: 'genero', label: 'Género' },
    { id: 'productora', label: 'Productora' },
    { id: 'paises', label: 'País de producción' },
    { id: 'idioma', label: 'Idioma original' }
    // Nota: actores, directores y guionistas son opcionales
  ];
  
  requiredFields.forEach(field => {
    // Ya validamos el año, lo saltamos
    if (field.id === 'anio') return;
    
    const element = document.getElementById(field.id);
    if (!element) return;
    
    let value = element.value;
    let isEmpty = false;
    
    // Manejar diferentes tipos de campos
    if (element.type === 'select-multiple') {
      // Para selects múltiples
      isEmpty = element.selectedOptions.length === 0;
    } else {
      // Para campos de texto, select simples, etc.
      isEmpty = !value || value.trim() === '';
    }
    
    if (isEmpty) {
      showError(element, `El campo ${field.label} es obligatorio`);
      isValid = false;
    } else {
      clearError(element);
    }
  });
  
  // Si hay errores, desplazarse al primer error
  if (!isValid) {
    const firstError = document.querySelector('.has-error');
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
  
  return isValid;
}

// Validación de la segunda sección (siempre retorna true ya que es opcional)
function validateStep2() {
  return true; // No hay validaciones requeridas para esta sección
}

// Validación de la sección de Datos Técnicos (campos obligatorios)
function validateStepDatosTecnicos() {
  console.log('=== VALIDANDO DATOS TÉCNICOS ===');
  let isValid = true;
  const requiredFields = [
    { id: 'sonido', name: 'Sonido' },
    { id: 'color', name: 'Color' },
    { id: 'caracteristicas_tecnicas', name: 'Características técnicas' },
    { id: 'destino', name: 'Destino' }
  ];

  // Limpiar errores previos
  requiredFields.forEach(field => {
    const element = document.getElementById(field.id);
    if (element) {
      clearError(element);
    }
  });

  // Validar cada campo requerido
  requiredFields.forEach(field => {
    const element = document.getElementById(field.id);
    if (!element) {
      console.error(`Campo ${field.id} no encontrado`);
      return;
    }

    const value = element.value.trim();
    if (!value) {
      showError(element, `El campo ${field.name} es obligatorio`);
      isValid = false;
      console.log(`Campo ${field.name} está vacío`);
    } else {
      console.log(`Campo ${field.name}: ${value}`);
    }
  });

  console.log('Validación datos técnicos resultado:', isValid);
  return isValid;
}

// Mostrar mensajes
function showMessage(msg, error = false) {
  const el = document.getElementById('form-message');
  el.textContent = msg;
  el.style.color = error ? '#c0392b' : COLOR_VERDE;
  setTimeout(() => { el.textContent = ''; }, 3500);
}

// Mostrar mensaje de éxito prominente
function showSuccessMessage(msg, type = 'success') {
  // Crear overlay si no existe
  let overlay = document.getElementById('message-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'message-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    document.body.appendChild(overlay);
  }
  
  // Crear contenedor del mensaje
  const messageContainer = document.createElement('div');
  messageContainer.style.cssText = `
    background: white;
    padding: 2rem 3rem;
    border-radius: 12px;
    text-align: center;
    max-width: 400px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    transform: scale(0.8);
    transition: transform 0.3s ease;
  `;
  
  // Icono según el tipo
  let icon = '';
  let iconColor = '';
  if (type === 'loading') {
    icon = '<i class="fas fa-spinner fa-spin"></i>';
    iconColor = '#097137';
  } else if (type === 'success') {
    icon = '<i class="fas fa-check-circle"></i>';
    iconColor = '#28a745';
  }
  
  messageContainer.innerHTML = `
    <div style="font-size: 3rem; color: ${iconColor}; margin-bottom: 1rem;">
      ${icon}
    </div>
    <div style="font-size: 1.2rem; color: #333; font-weight: 500;">
      ${msg}
    </div>
  `;
  
  overlay.innerHTML = '';
  overlay.appendChild(messageContainer);
  
  // Mostrar con animación
  overlay.style.display = 'flex';
  setTimeout(() => {
    overlay.style.opacity = '1';
    messageContainer.style.transform = 'scale(1)';
  }, 10);
}

// Mostrar mensaje de error prominente
function showErrorMessage(msg) {
  // Crear overlay si no existe
  let overlay = document.getElementById('message-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'message-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    document.body.appendChild(overlay);
  }
  
  // Crear contenedor del mensaje
  const messageContainer = document.createElement('div');
  messageContainer.style.cssText = `
    background: white;
    padding: 2rem 3rem;
    border-radius: 12px;
    text-align: center;
    max-width: 500px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    transform: scale(0.8);
    transition: transform 0.3s ease;
  `;
  
  messageContainer.innerHTML = `
    <div style="font-size: 3rem; color: #dc3545; margin-bottom: 1rem;">
      <i class="fas fa-exclamation-triangle"></i>
    </div>
    <div style="font-size: 1.1rem; color: #333; margin-bottom: 1.5rem; line-height: 1.5;">
      ${msg}
    </div>
    <button onclick="closeErrorMessage()" style="
      background: #dc3545;
      color: white;
      border: none;
      padding: 0.75rem 2rem;
      border-radius: 6px;
      font-size: 1rem;
      cursor: pointer;
      transition: background 0.2s ease;
    " onmouseover="this.style.background='#c82333'" onmouseout="this.style.background='#dc3545'">
      Entendido
    </button>
  `;
  
  overlay.innerHTML = '';
  overlay.appendChild(messageContainer);
  
  // Mostrar con animación
  overlay.style.display = 'flex';
  setTimeout(() => {
    overlay.style.opacity = '1';
    messageContainer.style.transform = 'scale(1)';
  }, 10);
}

// Función para cerrar mensaje de error
function closeErrorMessage() {
  const overlay = document.getElementById('message-overlay');
  if (overlay) {
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.style.display = 'none';
    }, 300);
  }
}

// Inicializar formData si no existe
if (!window.formData) {
  window.formData = {
    titulo: '',
    formato: '',
    genero: '',
    productora: '',
    paises: [],
    anio: '',
    idioma: '',
    actores: '',
    directores: '',
    guionistas: '',
    sonido: '',
    color: '',
    caracteristicas_tecnicas: '',
    destino: '',
    participaciones: [],
    episodios: [],
    exhibiciones: [],
    firma: null
  };
}

// Guardar datos del paso 1
function saveStep1Data() {
  if (!formData) formData = {};
  const campos = {
    titulo: document.getElementById('titulo'),
    formato: document.getElementById('formato'),
    genero: document.getElementById('genero'),
    productora: document.getElementById('productora'),
    paises: document.getElementById('paises'),
    anio: document.getElementById('anio'),
    idioma: document.getElementById('idioma'),
    actores: document.getElementById('actores'),
    directores: document.getElementById('directores'),
    guionistas: document.getElementById('guionistas'),
    sonido: document.getElementById('sonido'),
    color: document.getElementById('color'),
    caracteristicas_tecnicas: document.getElementById('caracteristicas_tecnicas'),
    destino: document.getElementById('destino')
  };
  let step1 = {};
  Object.entries(campos).forEach(([key, element]) => {
    if (!element) return;
    if ((key === 'paises' || key === 'productora') && element.multiple) {
      step1[key] = Array.from(element.selectedOptions).map(opt => opt.value);
      if (!step1[key] || step1[key].length === 0) step1[key] = [];
    } else if (element.type === 'checkbox' || element.type === 'radio') {
      step1[key] = element.checked;
    } else {
      step1[key] = element.value.trim ? element.value.trim() : element.value;
    }
  });
  formData = { ...formData, ...step1, step1: { ...step1 } };
  window.formData = formData;
  console.log('Datos guardados:', formData);
  return true;
}

// Restaurar datos del paso 1
function restoreStep1Data(container) {
  if (!formData.step1) return;
  console.log('Restaurando datos del paso 1:', formData.step1);
  const fields = {
    'titulo': formData.step1.titulo || '',
    'formato': formData.step1.formato || '',
    'genero': formData.step1.genero || '',
    'productora': Array.isArray(formData.step1.productora) ? formData.step1.productora : (formData.step1.productora ? [formData.step1.productora] : []),
    'paises': Array.isArray(formData.step1.paises) ? formData.step1.paises : (formData.step1.paises ? [formData.step1.paises] : []),
    'anio': formData.step1.anio || '',
    'idioma': formData.step1.idioma || '',
    'actores': formData.step1.actores || '',
    'directores': formData.step1.directores || '',
    'guionistas': formData.step1.guionistas || '',
    'sonido': formData.step1.sonido || '',
    'color': formData.step1.color || '',
    'caracteristicas_tecnicas': formData.step1.caracteristicas_tecnicas || '',
    'destino': formData.step1.destino || ''
  };
  Object.keys(fields).forEach(fieldName => {
    const element = container.querySelector(`[name="${fieldName}"]`);
    if (!element) return;
    if (element.type === 'select-multiple' || element.multiple) {
      const values = Array.isArray(fields[fieldName]) ? fields[fieldName] : [];
      Array.from(element.options).forEach(option => {
        option.selected = values.includes(option.value);
      });
      if (window.$ && $.fn.select2) {
        $(element).trigger('change');
      }
    } else if (element.tagName === 'SELECT') {
      element.value = fields[fieldName];
      if (window.$ && $.fn.select2) {
        $(element).trigger('change');
      }
    } else {
      element.value = fields[fieldName];
    }
  });
  setupNameValidation();
  console.log('Datos del paso 1 restaurados');
}

// Restaurar datos técnicos
function restoreStepDatosTecnicos(container) {
  if (!formData.step1) return;
  console.log('Restaurando datos técnicos:', formData.step1);
  
  const technicalFields = {
    'sonido': formData.step1.sonido || '',
    'color': formData.step1.color || '',
    'caracteristicas_tecnicas': formData.step1.caracteristicas_tecnicas || '',
    'destino': formData.step1.destino || ''
  };
  
  // Usar setTimeout para asegurar que los elementos estén completamente renderizados
  setTimeout(() => {
    Object.keys(technicalFields).forEach(fieldName => {
      const element = container.querySelector(`[name="${fieldName}"]`) || document.getElementById(fieldName);
      if (element && element.tagName === 'SELECT') {
        element.value = technicalFields[fieldName];
        console.log(`Restaurado ${fieldName}: ${technicalFields[fieldName]}`);
        
        // Disparar evento change para actualizar cualquier listener
        const event = new Event('change', { bubbles: true });
        element.dispatchEvent(event);
      } else {
        console.warn(`Elemento ${fieldName} no encontrado o no es SELECT`);
      }
    });
    
    console.log('Datos técnicos restaurados');
  }, 100);
}

// Función para formatear nombres separados por comas
function formatNames(input) {
    if (!input || !input.value) return true;
    
    // Eliminar espacios múltiples y espacios alrededor de comas
    let value = input.value
        .replace(/\s*,\s*/g, ', ')  // Reemplazar comas con o sin espacios por coma + espacio
        .replace(/\s+/g, ' ')        // Reemplazar múltiples espacios por uno solo
        .replace(/,\s*$/, '');      // Eliminar coma al final si existe
    
    // Actualizar el valor del input
    input.value = value;
    return true;
}

// Función para configurar la validación de campos de nombres
function setupNameValidation() {
    const nameFields = ['actores', 'directores', 'guionistas'];
    
    nameFields.forEach(fieldId => {
        const input = document.getElementById(fieldId);
        if (input) {
            // Validar al perder el foco
            input.addEventListener('blur', function() {
                formatNames(this);
            });
            
            // Validar al presionar Enter
            input.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    formatNames(this);
                }
            });
        }
    });
}

// Función para formatear los campos de nombres antes del envío
function validarCamposNombres() {
    const nameFields = ['actores', 'directores', 'guionistas'];
    
    nameFields.forEach(fieldId => {
        const input = document.getElementById(fieldId);
        if (input) {
            formatNames(input);
        }
    });
    
    return true;
}

// Envío simulado
// Función auxiliar para filtrar participantes sin correo
function filtrarParticipantesSinCorreo(formDataToFilter) {
  // Crear una copia profunda para no modificar el original
  const filteredData = JSON.parse(JSON.stringify(formDataToFilter));
  
  // Filtrar participaciones principales
  if (filteredData.participaciones && Array.isArray(filteredData.participaciones)) {
    filteredData.participaciones = filteredData.participaciones.filter(p => 
      p.correo && p.correo.trim() !== ''
    );
  }
  
  // Filtrar participaciones en episodios
  if (filteredData.stepEpisodios && Array.isArray(filteredData.stepEpisodios)) {
    filteredData.stepEpisodios = filteredData.stepEpisodios.map(episodio => {
      if (episodio.participaciones && Array.isArray(episodio.participaciones)) {
        return {
          ...episodio,
          participaciones: episodio.participaciones.filter(p => 
            p.correo && p.correo.trim() !== ''
          )
        };
      }
      return episodio;
    });
  }
  
  return filteredData;
}

async function submitForm(e) {
  e.preventDefault();
  if (!validateStep1()) return;
  
  // Formatear campos de nombres (actores, directores, guionistas)
  validarCamposNombres();
  
  // Guardar datos de todos los pasos antes del envío
  saveCurrentStepData();
  saveStep1Data();
  saveStepFirmaData(); // Asegurar que los datos del declarante se guarden
  
  // Solo llamar saveEpisodiosData si stepEpisodios no existe o está vacío
  // para evitar sobrescribir las participaciones guardadas desde el modal
  if (!formData.stepEpisodios || !Array.isArray(formData.stepEpisodios) || formData.stepEpisodios.length === 0) {
    console.log('Llamando saveEpisodiosData desde submitForm porque stepEpisodios no existe');
    saveEpisodiosData();
  } else {
    console.log('NO llamando saveEpisodiosData desde submitForm para preservar participaciones existentes');
  }
  
  // Filtrar participantes sin correo antes del envío
  const formDataParaEnvio = filtrarParticipantesSinCorreo(window.formData);
  
  document.getElementById('submit-btn').disabled = true;
  showSuccessMessage('Enviando declaración...', 'loading');
  // DEPURACIÓN: Mostrar el JSON que se enviará
  console.log('Payload original:', JSON.stringify(window.formData, null, 2));
  console.log('Payload filtrado enviado:', JSON.stringify(formDataParaEnvio, null, 2));
  try {
    await new Promise(r => setTimeout(r, 1200)); // Simula espera
    const response = await fetch('https://default0c13096209bc40fc8db89d043ff625.1a.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/8b2f009b7f0c49a3be2f5b98d4f730d6/triggers/manual/paths/invoke/?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=cN4MgBD-NapZYysEoECxfSNQi8rI56haXMVmq3qAdGs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formDataParaEnvio)
    });
    // DEPURACIÓN: Mostrar status y respuesta
    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Respuesta del servidor:', text);
    if (!response.ok) throw new Error('Error en la respuesta');
    
    // Mostrar mensaje de éxito y redirigir a página de éxito
    showSuccessMessage('¡Declaración enviada correctamente!', 'success');
    setTimeout(() => {
      window.location.href = 'exito.html';
    }, 1500);
    
  } catch (err) {
    // Mostrar mensaje de error técnico más prominente
    showErrorMessage('Ocurrió un problema técnico al enviar la declaración. Por favor, inténtelo nuevamente en unos minutos. Si el problema persiste, contacte al soporte técnico.');
    console.error('Error en envío:', err);
  } finally {
    document.getElementById('submit-btn').disabled = false;
  }
}

// Función para configurar la validación en tiempo real
function setupRealTimeValidation() {
  // Limpiar errores al escribir en los campos
  document.addEventListener('input', function(e) {
    const target = e.target;
    if (target.matches('input, textarea, select')) {
      handleFieldValidation(target);
    }
  });
  
  // Limpiar errores al cambiar opciones en selects
  document.addEventListener('change', function(e) {
    if (e.target.matches('select')) {
      handleFieldValidation(e.target);
    }
  });
  
  // Manejar eventos de Select2
  $(document).on('select2:select select2:unselect', function(e) {
    const selectElement = e.target;
    handleFieldValidation(selectElement);
  });
}

// Función auxiliar para manejar la validación de campos
function handleFieldValidation(element) {
  if (!element) return;
  
  // Obtener el valor actual del campo
  let value;
  if (element.matches('select[multiple]')) {
    value = Array.from(element.selectedOptions).map(o => o.value);
  } else if (element.matches('select')) {
    value = element.value;
  } else {
    value = element.value.trim();
  }
  
  // Si el campo tiene un valor, limpiar el error
  if (value && (!Array.isArray(value) || value.length > 0)) {
    clearError(element);
    
    // Si es un Select2, también limpiar el contenedor
    if (window.$ && $.fn.select2 && $(element).hasClass('select2-hidden-accessible')) {
      const $select2 = $(element).data('select2');
      if ($select2 && $select2.$container) {
        $select2.$container.removeClass('error');
      }
    }
  }
}

// Renderizar la sección de Participaciones
async function renderStepParticipaciones(container) {
  // Verificar si la obra es serializada
  const formatoField = document.getElementById('formato');
  const formatoSeleccionado = formatoField ? formatoField.value : (formData.formato || '');
  const obrasSerializadas = ['Serie', 'Telenovela'];
  const esSerializada = obrasSerializadas.includes(formatoSeleccionado);

  if (esSerializada) {
    container.innerHTML = `
      <div class="section-blocked">
        <div class="section-blocked-icon">
          <i class="fas fa-lock"></i>
        </div>
        <h2 class="section-blocked-title">Sección Participaciones</h2>
        <p class="section-blocked-message">
          La sección de participaciones está bloqueada porque la participación se gestiona por episodio. En la siguiente sección puedes gestionar las participaciones por episodio.
        </p>
        <div class="section-blocked-hint">
          <strong>Tip:</strong> Si tu obra no es serializada, regresa a la sección "Datos Generales" y selecciona el tipo de formato correspondiente para desbloquear esta sección.
        </div>
      </div>
    `;
    return;
  }
  
  container.innerHTML = `
    <div class="note-box">
      <div class="note-icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="7" cy="8" r="3" fill="#097137"/><circle cx="17" cy="8" r="3" fill="#097137"/><ellipse cx="12" cy="17" rx="9" ry="5" fill="#097137" fill-opacity="0.13"/><ellipse cx="7" cy="17" rx="4" ry="2" fill="#097137" fill-opacity="0.13"/><ellipse cx="17" cy="17" rx="4" ry="2" fill="#097137" fill-opacity="0.13"/></svg>
      </div>
      <div class="note-content">
        <strong>Registre los derechohabientes de la obra.</strong> Puede agregar varias líneas de participación. El porcentaje de participación por rol no puede superar el 100%.
      </div>
    </div>
    
    <div class="tabla-participaciones-container">
      <table class="tabla-participaciones">
        <thead>
          <tr>
            <th>Rol</th>
            <th>Autor</th>
            <th>% Participación</th>
            <th>Eliminar</th>
          </tr>
        </thead>
        <tbody>
          <!-- Filas dinámicas -->
        </tbody>
      </table>
    </div>
    
    <div style="display: flex; gap: 10px; margin-top: 15px; flex-wrap: wrap;">
      <button type="button" class="btn btn-outline-success btn-agregar-participacion">
        <i class="fas fa-plus"></i> Agregar participación
      </button>
    </div>
    
    <div id="participacion-resumen" class="participacion-resumen"></div>
    <div id="participaciones-error" class="form-message" style="color:#dc3545;"></div>
  `;
  // Manejador para agregar más participaciones
  document.querySelector('.btn-agregar-participacion').addEventListener('click', agregarFilaParticipacion);
  
  // Restaurar datos si existen, o agregar una fila vacía si no hay datos
  if (formData.participaciones && formData.participaciones.length > 0) {
    restaurarParticipaciones();
  } else {
    // Solo agregar una fila vacía si no hay datos existentes
    agregarFilaParticipacion();
  }
}

// Función global para validar participaciones
function validarParticipaciones() {
  console.log('=== INICIANDO VALIDACIÓN DE PARTICIPACIONES ===');
  const filas = document.querySelectorAll('.tabla-participaciones tbody tr');
  console.log('Filas encontradas en tabla participaciones:', filas.length);
  const sumas = {};
  let error = '';
  let hayErrores = false;
  let mensajesError = [];
  
  // Verificar si hay filas en la tabla
  if (filas.length === 0) {
    console.log('No hay filas en la tabla de participaciones');
    hayErrores = true;
    mensajesError.push('Debe agregar al menos una participación.');
  }
  
  filas.forEach(fila => {
    const rolSelect = fila.querySelector('.rol-select');
    const autorSelect = fila.querySelector('.autor-select');
    const porcentajeInput = fila.querySelector('input[type="number"]');
    
    // Verificar que los elementos existan antes de acceder a sus propiedades
    if (!rolSelect || !autorSelect || !porcentajeInput) {
      console.error('Error: No se encontraron todos los elementos en la fila de participación');
      return;
    }
    
    // Validar que todos los campos estén llenos
    if (!rolSelect.value || !autorSelect.value || !porcentajeInput.value) {
      hayErrores = true;
      if (!mensajesError.includes('Todos los campos son obligatorios.')) {
        mensajesError.push('Todos los campos son obligatorios.');
      }
    }
    
    const rol = rolSelect.value;
    const porcentaje = parseFloat(porcentajeInput.value) || 0;
    if (!rol) return;
    if (!sumas[rol]) sumas[rol] = 0;
    sumas[rol] += porcentaje;
  });
  
  // Validar que el total por rol no supere 100%
  for (const rol in sumas) {
    if (sumas[rol] > 100.001) { // margen flotante
      hayErrores = true;
      mensajesError.push(`La suma de participación para el rol "${rol}" supera el 100%. Actual: ${sumas[rol].toFixed(2)}%`);
    }
  }
  
  // Mostrar resumen dinámico
  const resumenDiv = document.getElementById('participacion-resumen');
  if (resumenDiv) {
    resumenDiv.innerHTML = Object.keys(sumas).map(rol => {
      const total = sumas[rol];
      const esValido = total <= 100.001;
      return `<span class="${esValido ? 'ok' : 'error'}">Total ${rol}: ${total.toFixed(2)}% ${esValido ? '✅' : '❌'}</span>`;
    }).join(' ');
  }
  
  const errorElement = document.getElementById('participaciones-error');
  if (errorElement) {
    if (hayErrores) {
      errorElement.innerHTML = mensajesError.join('<br>');
      errorElement.style.display = 'block';
    } else {
      errorElement.style.display = 'none';
    }
  }
  
  console.log('Resultado validación participaciones:', !hayErrores, 'Errores:', hayErrores);
  console.log('=== FIN VALIDACIÓN DE PARTICIPACIONES ===');
  return !hayErrores;
}

// Función para agregar fila de participación en tabla
function agregarFilaParticipacion() {
  const tbody = document.querySelector('.tabla-participaciones tbody');
  const filas = tbody.querySelectorAll('tr');
  
  // Verificar si ya hay 10 participaciones
  if (filas.length >= 10) {
    alert('No se pueden agregar más de 10 participaciones.');
    return;
  }
  
  const filaId = Date.now() + Math.floor(Math.random() * 1000);
  
  const fila = document.createElement('tr');
  fila.id = `fila-participacion-${filaId}`;
  fila.innerHTML = `
    <td>
      <select id="rol-${filaId}" class="form-control rol-select" required>
        <option value="">Seleccione un rol</option>
      </select>
    </td>
    <td>
      <select id="autor-${filaId}" class="form-control autor-select" required>
        <option value="">Buscar o agregar...</option>
      </select>
    </td>
    <td>
      <input type="number" id="porcentaje-${filaId}" class="form-control" min="0" max="100" step="0.01" placeholder="0.00" required style="text-align:right;">
    </td>
    <td>
      <button type="button" class="btn-eliminar-participacion" onclick="eliminarFilaParticipacion('${filaId}')">
        <i class="fas fa-trash"></i> Eliminar
      </button>
    </td>
  `;
  
  tbody.appendChild(fila);
  
  // Cargar roles y configurar Select2
  Promise.all([
    fetchJSON('rol.json'),
    fetchJSON('socios.json')
  ]).then(([roles, socios]) => {
    const rolSelect = document.getElementById(`rol-${filaId}`);
    const autorSelect = document.getElementById(`autor-${filaId}`);
    
    // Llenar opciones de rol
    roles.filter(r => r.Rol).forEach(rol => {
      const option = document.createElement('option');
      option.value = rol.Rol;
      option.textContent = rol.Rol;
      rolSelect.appendChild(option);
    });
    
    // Inicializar Select2 para los nuevos campos
    setTimeout(() => {
      if (window.$ && window.$.fn.select2) {
        $(rolSelect).select2({
          placeholder: 'Seleccione un rol',
          width: '100%',
          allowClear: true
        });
        
        $(autorSelect).select2({
          placeholder: 'Escriba el nombre del autor para buscar coincidencias...',
          width: '100%',
          allowClear: true,
          tags: true,
          minimumInputLength: 2,
          ajax: {
            transport: function(params, success, failure) {
              fetchJSON('socios.json').then(sociosRaw => {
                const term = params.data.q ? params.data.q.toLowerCase() : '';
                const autoresData = sociosRaw
                  .filter(socio => socio["Nombre completo"] && socio["Nombre completo"].toLowerCase().includes(term))
                  .map(socio => {
                    // Verificar si tiene correo
                    const tieneCorreo = socio["Correo electrónico"] && socio["Correo electrónico"].trim() !== '';
                    const iconoCorreo = tieneCorreo ? '✓' : '✗';
                    const textoCorreo = tieneCorreo ? socio["Correo electrónico"] : 'Sin correo';
                    
                    return { 
                      id: socio["Nombre completo"], 
                      text: socio["Nombre completo"],
                      correo: socio["Correo electrónico"] || '',
                      tieneCorreo: tieneCorreo,
                      html: `<div class="autor-option ${tieneCorreo ? 'tiene-correo' : 'sin-correo'}">
                              <span class="autor-nombre">${socio["Nombre completo"]}</span>
                              <span class="autor-correo-info">${iconoCorreo} ${textoCorreo}</span>
                            </div>`
                    };
                  });
                success({ results: autoresData });
              }).catch(failure);
            },
            processResults: function(data) {
              return { results: data.results };
            },
            templateResult: function(data) {
              if (data.html) {
                return $(data.html);
              }
              return data.text;
            }
          },
          language: {
            inputTooShort: function() {
              return 'Escriba al menos 2 caracteres para buscar autores.';
            },
            noResults: function() {
              return 'No se encontró el autor. Puede crear uno nuevo.';
            }
          }
        });
      }
    }, 100);
    
    // Agregar event listeners para validación
    rolSelect.addEventListener('change', validarParticipaciones);
    document.getElementById(`porcentaje-${filaId}`).addEventListener('input', validarParticipaciones);
  }).catch(error => {
    console.error('Error cargando datos JSON:', error);
  });
}

// Función para eliminar fila de participación
function eliminarFilaParticipacion(filaId) {
  const fila = document.getElementById(`fila-participacion-${filaId}`);
  if (fila) {
    fila.classList.add('removing');
    setTimeout(() => {
      fila.remove();
      validarParticipaciones();
    }, 300);
  }
}

// Función para restaurar participaciones en tabla
function restaurarParticipaciones() {
  const participaciones = formData.participaciones || [];
  participaciones.forEach(participacion => {
    agregarFilaParticipacion();
    const filas = document.querySelectorAll('.tabla-participaciones tbody tr');
    const ultimaFila = filas[filas.length - 1];
    
    if (ultimaFila) {
      const rolSelect = ultimaFila.querySelector('.rol-select');
      const autorSelect = ultimaFila.querySelector('.autor-select');
      const porcentajeInput = ultimaFila.querySelector('input[type="number"]');
      
      // Esperar a que se carguen las opciones antes de establecer valores
      setTimeout(() => {
        if (rolSelect && participacion.rol) {
          rolSelect.value = participacion.rol;
          if (window.$ && window.$.fn.select2) {
            $(rolSelect).trigger('change');
          }
        }
        
        if (autorSelect && participacion.autor) {
          const option = new Option(participacion.autor, participacion.autor, true, true);
          autorSelect.appendChild(option);
          if (window.$ && window.$.fn.select2) {
            $(autorSelect).trigger('change');
          }
        }
        
        if (porcentajeInput && participacion.porcentaje) {
          porcentajeInput.value = participacion.porcentaje;
        }
      }, 500);
    }
  });
}

// Función para guardar datos de participaciones desde tabla
function saveParticipacionesData() {
  const filas = document.querySelectorAll('.tabla-participaciones tbody tr');
  const participaciones = [];
  
  // Obtener la lista de socios para buscar correos
  fetchJSON('socios.json').then(socios => {
    filas.forEach(fila => {
      const rol = fila.querySelector('.rol-select')?.value || '';
      const autor = fila.querySelector('.autor-select')?.value || '';
      const porcentaje = fila.querySelector('input[type="number"]')?.value || '';
      
      if (rol && autor && porcentaje) {
        // Buscar el correo del autor en la lista de socios
        const socioEncontrado = socios.find(socio => socio["Nombre completo"] === autor);
        const correo = socioEncontrado ? socioEncontrado["Correo electrónico"] : '';
        
        participaciones.push({ rol, autor, porcentaje, correo });
      }
    });
    
    formData.participaciones = participaciones;
    console.log('Participaciones guardadas con correos:', participaciones);
    
    // Actualizar la sección de notificación a participantes
    actualizarSeccionNotificacion();
  }).catch(error => {
    console.error('Error al obtener socios para correos:', error);
    // Si hay error, guardar sin correos
    filas.forEach(fila => {
      const rol = fila.querySelector('.rol-select')?.value || '';
      const autor = fila.querySelector('.autor-select')?.value || '';
      const porcentaje = fila.querySelector('input[type="number"]')?.value || '';
      
      if (rol && autor && porcentaje) {
        participaciones.push({ rol, autor, porcentaje, correo: '' });
      }
    });
    
    formData.participaciones = participaciones;
    console.log('Participaciones guardadas sin correos:', participaciones);
  });
}

// Renderizar la sección de Datos Técnicos
async function renderStepDatosTecnicos(container) {
  // Cargar datos de los JSON
  const [sonidos, colores, caracteristicas, destinos] = await Promise.all([
    fetchJSON('specs/sonido.json'),
    fetchJSON('specs/color.json'),
    fetchJSON('specs/caracteristicastecnicas.json'),
    fetchJSON('specs/destino.json')
  ]);

  container.innerHTML = `
    <div class="note-box">
      <div class="note-icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#097137" stroke-width="2" fill="none"/>
          <path d="M2 17L12 22L22 17" stroke="#097137" stroke-width="2" fill="none"/>
          <path d="M2 12L12 17L22 12" stroke="#097137" stroke-width="2" fill="none"/>
        </svg>
      </div>
      <div class="note-content">
        <strong>Complete los datos técnicos de la obra.</strong> Esta información es importante para la catalogación y clasificación de la obra audiovisual.
      </div>
    </div>
    
    <div class="datos-tecnicos-container">
      <h2 style="color:#097137;margin:0 0 1.5rem 0;font-size:1.5rem;">Información Técnica</h2>
      
      <div class="form-group required">
        <label for="sonido">Sonido</label>
        <select id="sonido" name="sonido">
          <option value="">Seleccione...</option>
          ${sonidos.filter(s => s.Sonido).map(s => `<option value="${s.Sonido}">${s.Sonido}</option>`).join('')}
        </select>
      </div>
      
      <div class="form-group required">
        <label for="color">Color</label>
        <select id="color" name="color">
          <option value="">Seleccione...</option>
          ${colores.filter(c => c.Color).map(c => `<option value="${c.Color}">${c.Color}</option>`).join('')}
        </select>
      </div>
      
      <div class="form-group required">
        <label for="caracteristicas_tecnicas">Características técnicas</label>
        <select id="caracteristicas_tecnicas" name="caracteristicas_tecnicas">
          <option value="">Seleccione...</option>
          ${caracteristicas.filter(c => c['Caracteristicas técnicas']).map(c => `<option value="${c['Caracteristicas técnicas']}">${c['Caracteristicas técnicas']}</option>`).join('')}
        </select>
      </div>
      
      <div class="form-group required">
        <label for="destino">Destino</label>
        <select id="destino" name="destino">
          <option value="">Seleccione...</option>
          ${destinos.filter(d => d.Destino).map(d => `<option value="${d.Destino}">${d.Destino}</option>`).join('')}
        </select>
      </div>
    </div>
  `;
  
  // Inicializar Select2 en los selects
  if (window.$ && window.$.fn.select2) {
    $(container).find('select').each(function() {
      $(this).select2({
        placeholder: $(this).find('option:first').text(),
        width: '100%',
        allowClear: true
      });
    });
  }
}

async function renderStepEpisodios(container) {
  // Verificar si la obra es serializada
  // Intentar obtener el valor del campo formato directamente del DOM
  const formatoField = document.getElementById('formato');
  const formatoSeleccionado = formatoField ? formatoField.value : (formData.formato || '');
  const obrasSerializadas = ['Serie', 'Telenovela'];
  const esSerializada = obrasSerializadas.includes(formatoSeleccionado);
  
  console.log('Debug episodios:', {
    formatoField: formatoField,
    formatoSeleccionado: formatoSeleccionado,
    esSerializada: esSerializada,
    formData: formData
  });
  
  if (!esSerializada) {
    // Mostrar sección bloqueada
    container.innerHTML = `
      <div class="section-blocked">
        <div class="section-blocked-icon">
          <i class="fas fa-lock"></i>
        </div>
        <h2 class="section-blocked-title">Sección Episodios</h2>
        <p class="section-blocked-message">
          Esta sección solo está disponible para obras serializadas como <strong>Series</strong>, <strong>Telenovelas</strong> o <strong>Series documentales</strong>.
        </p>
        <div class="section-blocked-hint">
          <strong>Tip:</strong> Si tu obra es serializada, regresa a la sección "Datos Generales" y selecciona el tipo de formato correspondiente para desbloquear esta sección.
        </div>
      </div>
    `;
    return;
  }
  
  // Si es serializada, mostrar el formulario de episodios con bloques dinámicos
  container.innerHTML = `
    <div class="wizard-section">
      <div class="section-header">
        <h2>Bloques de Episodios</h2>
        <p class="section-description">
          Registre la información de los episodios de su obra serializada. Puede crear múltiples bloques para agrupar episodios con características similares.
        </p>
        <button type="button" class="btn btn-primary" id="addBloqueEpisodios">
          <i class="fas fa-plus"></i> Agregar Bloque de Episodios
        </button>
      </div>
      
      <div id="bloquesEpisodiosContainer">
        <!-- Los bloques de episodios se agregarán aquí dinámicamente -->
      </div>
    </div>
  `;
  
  // Inicializar la funcionalidad de bloques de episodios
  inicializarBloquesEpisodios();
  
  // Restaurar bloques de episodios si existen datos guardados
  if (formData.stepEpisodios && formData.stepEpisodios.length > 0) {
    restoreStepEpisodios(container);
  }
}

function validateStepEpisodios() {
  // Intentar obtener el valor del campo formato directamente del DOM
  const formatoField = document.getElementById('formato');
  const formatoSeleccionado = formatoField ? formatoField.value : (formData.formato || '');
  const obrasSerializadas = ['Serie', 'Telenovela'];
  const esSerializada = obrasSerializadas.includes(formatoSeleccionado);
  
  // Si no es serializada, no hay nada que validar
  if (!esSerializada) {
    return true;
  }
  
  // Verificar que haya al menos un bloque de episodios
  const bloques = document.querySelectorAll('.bloque-episodios');
  if (bloques.length === 0) {
    showMessage('Debe crear al menos un bloque de episodios.', true);
    return false;
  }
  
  let isValid = true;
  
  // Validar cada bloque
  bloques.forEach((bloque, index) => {
    const bloqueId = bloque.id.replace('bloque-episodios-', '');
    
    // Validar intervalo de episodios
    const desdeEpisodio = parseInt(bloque.querySelector('.desde-episodio').value) || 0;
    const hastaEpisodio = parseInt(bloque.querySelector('.hasta-episodio').value) || 0;
    
    if (desdeEpisodio === 0 || hastaEpisodio === 0) {
      showMessage(`El bloque #${index + 1} debe tener un intervalo de episodios válido.`, true);
      isValid = false;
    }
    
    // Eliminada la validación molesta de episodio final menor al inicial

    
    // Verificar si hay participaciones guardadas para este bloque específico
    const hayParticipacionesEnBloque = participacionesPorBloque[bloqueId] && 
                                       Array.isArray(participacionesPorBloque[bloqueId]) && 
                                       participacionesPorBloque[bloqueId].length > 0;
    
    // Solo validar líneas individuales si no hay participaciones guardadas en el modal para este bloque
    if (!hayParticipacionesEnBloque) {
      const lineasParticipacion = bloque.querySelectorAll('.linea-participacion');
      if (lineasParticipacion.length === 0) {
        showMessage(`El bloque #${index + 1} debe tener al menos una línea de participación. Puede usar "Gestionar participaciones" para aplicar participaciones a todos los episodios.`, true);
        isValid = false;
      }
      
      // Validar porcentajes de participación solo si hay líneas individuales
      const sumas = {};
      lineasParticipacion.forEach(linea => {
        const rol = linea.querySelector('.rol-participacion').value;
        const porcentaje = parseFloat(linea.querySelector('.porcentaje-participacion').value) || 0;
        
        if (rol && porcentaje > 0) {
          if (!sumas[rol]) sumas[rol] = 0;
          sumas[rol] += porcentaje;
        }
      });
      
      for (const rol in sumas) {
        if (sumas[rol] > 100.001) {
          showMessage(`En el bloque #${index + 1}, la suma de participación para el rol "${rol}" supera el 100%.`, true);
          isValid = false;
        }
      }
    }
  });
  
  return isValid;
}

// Función para inicializar la funcionalidad de bloques de episodios
function inicializarBloquesEpisodios() {
  const addBloqueBtn = document.getElementById('addBloqueEpisodios');
  if (addBloqueBtn) {
    addBloqueBtn.addEventListener('click', function() {
      agregarBloqueEpisodios();
    });
  }
}

// Función para restaurar los bloques de episodios guardados
function restoreStepEpisodios(container) {
  console.log('=== INICIANDO RESTAURACIÓN DE EPISODIOS ===');
  console.log('Datos de episodios a restaurar:', formData.stepEpisodios);
  console.log('Contenedor:', container);
  
  if (!formData.stepEpisodios || formData.stepEpisodios.length === 0) {
    console.log('No hay bloques de episodios para restaurar');
    return;
  }
  
  const bloquesContainer = document.getElementById('bloquesEpisodiosContainer');
  if (!bloquesContainer) {
    console.error('No se encontró el contenedor de bloques de episodios');
    return;
  }
  
  // Verificar si ya hay bloques en el DOM para evitar duplicación
  const bloquesExistentes = bloquesContainer.querySelectorAll('.bloque-episodios-colapsable');
  if (bloquesExistentes.length > 0) {
    console.log('Ya existen bloques en el DOM, evitando duplicación');
    return;
  }
  
  // Limpiar el contenedor
  bloquesContainer.innerHTML = '';
  
  // Agrupar episodios por bloque basándose en temporada, desde y hasta
  const bloquesAgrupados = new Map();
  formData.stepEpisodios.forEach((episodioData) => {
    const claveBloque = `${episodioData.temporada}-${episodioData.desdeEpisodio}-${episodioData.hastaEpisodio}`;
    if (!bloquesAgrupados.has(claveBloque)) {
      bloquesAgrupados.set(claveBloque, {
        temporada: episodioData.temporada,
        desdeEpisodio: episodioData.desdeEpisodio,
        hastaEpisodio: episodioData.hastaEpisodio,
        participaciones: episodioData.participaciones || [],
        titulosAlternativos: episodioData.titulosAlternativos || []
      });
    }
  });
  
  // Restaurar cada bloque agrupado
  let bloqueIndex = 1;
  bloquesAgrupados.forEach((bloqueData) => {
    const bloqueId = bloqueIndex;
    contadorBloquesEpisodios = Math.max(contadorBloquesEpisodios, bloqueId);
    
    // Restaurar datos en las variables globales
    if (bloqueData.participaciones && bloqueData.participaciones.length > 0) {
      participacionesPorBloque[bloqueId] = bloqueData.participaciones;
    }
    if (bloqueData.titulosAlternativos && bloqueData.titulosAlternativos.length > 0) {
      titulosPorBloque[bloqueId] = bloqueData.titulosAlternativos;
    }
    
    bloqueIndex++;
    
    // Crear el HTML del bloque con la misma estructura que agregarBloqueEpisodios
    const bloqueHTML = `
      <div class="bloque-episodios-colapsable" id="bloque-episodios-colapsable-${bloqueId}">
        <div class="bloque-episodios-header">
          <div style="display: flex; align-items: center; gap: 10px;">
            <h3>Bloque de Episodios #${bloqueId}</h3>
            <div class="help-tooltip">
              <span class="help-icon">?</span>
              <div class="tooltip-content">
                <h4>¿Instrucciones para declarar episodios:</h4>
                <p>En cada bloque de episodios, registra el intervalo de episodios que comparten los mismos autores, roles y porcentajes de participación.</p>
                <p>Esto te permitirá agrupar episodios con características similares y simplificar la declaración.</p>
                </div>
            </div>
          </div>
          <button type="button" class="btn-toggle-bloque" data-bloque-id="${bloqueId}">
            <i class="fas fa-chevron-down"></i>
          </button>
        </div>
        <div class="bloque-episodios bloque-episodios-content" id="bloque-episodios-${bloqueId}">
          <div class="bloque-header">
          <div class="bloque-tools">
            <button type="button" class="btn btn-secondary btn-importar-titulos" data-bloque-id="${bloqueId}"><i class="fas fa-file-import"></i> Importar títulos</button>
            <input type="file" accept=".csv, .xlsx, .xls" class="input-importar-titulos" data-bloque-id="${bloqueId}" style="display:none">
            <button type="button" class="btn btn-secondary btn-pegar-titulos" data-bloque-id="${bloqueId}"><i class="fas fa-paste"></i> Pegar títulos</button>
          </div>
          <button type="button" class="btn-eliminar" data-bloque-id="${bloqueId}">
            <span>×</span> Eliminar Bloque
          </button>
        </div>
            <!-- Subbloque 1: Intervalo de episodios -->
            <div class="subbloque">
              <h4>Intervalo de episodios</h4>
              <div class="form-row">
                <div class="form-group">
                  <label>Temporada</label>
                  <input type="number" class="temporada" min="1" placeholder="N°" value="${bloqueData.temporada || ''}">
                </div>
                <div class="form-group">
                  <label>Desde episodio</label>
                  <input type="number" class="desde-episodio" min="1" placeholder="Número de episodio" value="${bloqueData.desdeEpisodio || ''}">
                  <div class="input-hint hint-desde-episodio" style="color:#888;font-size:0.95em;display:none;">Debe ingresar temporada para habilitar este campo.</div>
                </div>
                <div class="form-group">
                  <label>Hasta episodio</label>
                  <input type="number" class="hasta-episodio" min="1" placeholder="Número de episodio" value="${bloqueData.hastaEpisodio || ''}">
                  <div class="input-hint hint-hasta-episodio" style="color:#888;font-size:0.95em;display:none;">Debe ingresar 'Desde episodio' para habilitar este campo.</div>
                </div>
              </div>
              <div class="tabla-episodios-container" style="display: none;">
                <div class="episodios-individuales">
                  <!-- Los episodios se generarán aquí dinámicamente -->
                </div>
              </div>
            </div>
            
            <!-- Subbloque 2: Títulos de episodios -->
            <div class="subbloque">
              <h4>Títulos de episodios</h4>
              <div class="episodios-titulos">
                <!-- Los títulos de episodios se generarán aquí -->
              </div>
              <button type="button" class="btn btn-outline-success btn-gestionar-titulos" style="margin-top:10px;">
                <i class="fas fa-table"></i> Gestionar Otros Títulos
              </button>
            </div>
            
            <!-- Subbloque 3: Líneas de participación -->
            <div class="subbloque">
              <h4>Líneas de participación</h4>
              <button type="button" class="btn btn-outline-success btn-gestionar-participaciones" style="margin-top:10px;" data-bloque-id="${bloqueId}">
                <i class="fas fa-table"></i> Gestionar participaciones
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    bloquesContainer.insertAdjacentHTML('beforeend', bloqueHTML);
    
    // Configurar eventos del bloque
    configurarEventosBloqueEpisodios(bloqueId);
    
    // Configurar eventos de colapso
    const bloqueColapsable = document.getElementById(`bloque-episodios-colapsable-${bloqueId}`);
    const headerColapsable = bloqueColapsable.querySelector('.bloque-episodios-header');
    const contentColapsable = bloqueColapsable.querySelector('.bloque-episodios-content');
    const toggleBtn = bloqueColapsable.querySelector('.btn-toggle-bloque');
    if (headerColapsable && contentColapsable && toggleBtn) {
      headerColapsable.addEventListener('click', (e) => {
        if (e.target.closest('.btn-toggle-bloque')) return;
        toggleBloqueContent(contentColapsable, toggleBtn);
      });
      toggleBtn.addEventListener('click', () => {
        toggleBloqueContent(contentColapsable, toggleBtn);
      });
    }
    
    // Generar tabla automáticamente al restaurar el bloque
    generarTablaEpisodios(bloqueId);
    
    // Si hay datos de intervalo, generar episodios
    if (bloqueData.desde && bloqueData.hasta) {
      setTimeout(() => {
        generarEpisodiosIndividuales(bloqueId, bloqueData.desde, bloqueData.hasta);
        setTimeout(() => {
          restaurarDatosEpisodios(bloqueId, bloqueData);
        }, 100);
      }, 50);
    }
  });
}

// Función auxiliar para restaurar los datos específicos de cada episodio
function restaurarDatosEpisodios(bloqueId, bloqueData) {
  console.log(`Restaurando datos de episodios del bloque ${bloqueId}:`, bloqueData);
  
  // Restaurar los datos de cada episodio
  bloqueData.episodios.forEach(episodioData => {
    const episodioNum = episodioData.numero;
    
    // Restaurar título principal
    if (episodioData.titulo) {
      const tituloInput = document.getElementById(`titulo-${bloqueId}-${episodioNum}`);
      if (tituloInput) {
        tituloInput.value = episodioData.titulo;
        actualizarPreviewTitulo(bloqueId, episodioNum, episodioData.titulo);
      }
    }
    
    // Restaurar títulos alternativos
    if (episodioData.titulosAlternativos && episodioData.titulosAlternativos.length > 0) {
      episodioData.titulosAlternativos.forEach((titulo, index) => {
        if (index > 0) { // El primer título ya está restaurado arriba
          agregarTituloAlternativo(bloqueId, episodioNum);
        }
        const tituloInput = document.querySelector(`#episodio-${bloqueId}-${episodioNum} .titulo-alternativo:nth-child(${index + 1}) input`);
        if (tituloInput) {
          tituloInput.value = titulo;
        }
      });
      actualizarContadorTitulos(bloqueId, episodioNum);
    }
  });
  
  // Restaurar participaciones del bloque (no por episodio individual)
  if (bloqueData.participaciones && bloqueData.participaciones.length > 0) {
    bloqueData.participaciones.forEach((participacion, index) => {
      if (index > 0) { // La primera línea ya existe
        agregarLineaParticipacion(bloqueId);
      }
      
      const participacionContainer = document.querySelector(`#bloque-episodios-${bloqueId} .participaciones-container .participacion-item:nth-child(${index + 1})`);
      if (participacionContainer) {
        const rolSelect = participacionContainer.querySelector('.rol-select');
        const autorInput = participacionContainer.querySelector('.autor-input');
        const porcentajeInput = participacionContainer.querySelector('.porcentaje-input');
        
        if (rolSelect) rolSelect.value = participacion.rol || '';
        if (autorInput) autorInput.value = participacion.autor || '';
        if (porcentajeInput) porcentajeInput.value = participacion.porcentaje || '';
      }
    });
  }
}

// Función para agregar un nuevo bloque de episodios
function agregarBloqueEpisodios() {
  contadorBloquesEpisodios++;
  const bloquesContainer = document.getElementById('bloquesEpisodiosContainer');
  
  const bloqueHTML = `
    <div class="bloque-episodios-colapsable" id="bloque-episodios-colapsable-${contadorBloquesEpisodios}">
      <div class="bloque-episodios-header">
        <div style="display: flex; align-items: center; gap: 10px;">
          <h3>Bloque de Episodios #${contadorBloquesEpisodios}</h3>
          <div class="help-tooltip">
            <span class="help-icon">?</span>
            <div class="tooltip-content">
              <h4>¿Instrucciones para declarar episodios:</h4>
              <p>En cada bloque de episodios, registra el intervalo de episodios que comparten los mismos autores, roles y porcentajes de participación.</p>
              <p>Esto te permitirá agrupar episodios con características similares y simplificar la declaración.</p>
              </div>
          </div>
        </div>
        <button type="button" class="btn-toggle-bloque" data-bloque-id="${contadorBloquesEpisodios}">
          <i class="fas fa-chevron-down"></i>
        </button>
      </div>
      <div class="bloque-episodios bloque-episodios-content" id="bloque-episodios-${contadorBloquesEpisodios}">
        <div class="bloque-header">
        <div class="bloque-tools">
          <button type="button" class="btn btn-secondary btn-importar-titulos" data-bloque-id="${contadorBloquesEpisodios}"><i class="fas fa-file-import"></i> Importar títulos</button>
          <input type="file" accept=".csv, .xlsx, .xls" class="input-importar-titulos" data-bloque-id="${contadorBloquesEpisodios}" style="display:none">
          <button type="button" class="btn btn-secondary btn-pegar-titulos" data-bloque-id="${contadorBloquesEpisodios}"><i class="fas fa-paste"></i> Pegar títulos</button>
        </div>
        <button type="button" class="btn-eliminar" data-bloque-id="${contadorBloquesEpisodios}">
          <span>×</span> Eliminar Bloque
        </button>
      </div>
      
      <!-- Subbloque 1: Intervalo de episodios -->
      <div class="subbloque">
        <h4>Intervalo de episodios</h4>
        <div class="form-row">
          <div class="form-group">
            <label>Temporada</label>
            <input type="number" class="temporada" min="1" placeholder="N°">
          </div>
          <div class="form-group">
            <label>Desde episodio</label>
            <input type="number" class="desde-episodio" min="1" style="background:#eee;" placeholder="Seleccione temporada primero" disabled>
            <div class="input-hint hint-desde-episodio" style="color:#888;font-size:0.95em;display:none;">Debe ingresar temporada para habilitar este campo.</div>
          </div>
          <div class="form-group">
            <label>Hasta episodio</label>
            <input type="number" class="hasta-episodio" min="1" style="background:#eee;" placeholder="Seleccione 'Desde episodio' primero" disabled>
            <div class="input-hint hint-hasta-episodio" style="color:#888;font-size:0.95em;display:none;">Debe ingresar 'Desde episodio' para habilitar este campo.</div>
          </div>
        </div>
        <div class="tabla-episodios-container" style="display: none;">
          <div class="episodios-individuales">
            <!-- Los episodios se generarán aquí dinámicamente -->
          </div>
        </div>
      </div>
      
      <!-- Subbloque 2: Títulos de episodios -->
      <div class="subbloque">
        <h4>Títulos de episodios</h4>
        <div class="episodios-titulos">
          <!-- Los títulos de episodios se generarán aquí -->
        </div>
        <button type="button" class="btn btn-outline-success btn-gestionar-titulos" style="margin-top:10px;" data-bloque-id="${contadorBloquesEpisodios}">
          <i class="fas fa-table"></i> Gestionar Otros Títulos
        </button>
      </div>
      
      <!-- Subbloque 3: Líneas de participación -->
      <div class="subbloque">
        <h4>Líneas de participación</h4>
        <button type="button" class="btn btn-outline-success btn-gestionar-participaciones" style="margin-top:10px;" data-bloque-id="${contadorBloquesEpisodios}">
          <i class="fas fa-table"></i> Gestionar participaciones
        </button>
      </div>
    </div>
  `;
  
  bloquesContainer.insertAdjacentHTML('beforeend', bloqueHTML);
  
  // Configurar eventos del nuevo bloque
  configurarEventosBloqueEpisodios(contadorBloquesEpisodios);
  
  // Lógica de colapso para el bloque completo
  const bloqueColapsable = document.getElementById(`bloque-episodios-colapsable-${contadorBloquesEpisodios}`);
  const headerColapsable = bloqueColapsable.querySelector('.bloque-episodios-header');
  const contentColapsable = bloqueColapsable.querySelector('.bloque-episodios-content');
  const toggleBtn = bloqueColapsable.querySelector('.btn-toggle-bloque');
  if (headerColapsable && contentColapsable && toggleBtn) {
    headerColapsable.addEventListener('click', (e) => {
      if (e.target.closest('.btn-toggle-bloque')) return;
      toggleBloqueContent(contentColapsable, toggleBtn);
    });
    toggleBtn.addEventListener('click', () => {
      toggleBloqueContent(contentColapsable, toggleBtn);
    });
  }

  // Agregar animación de entrada
  const nuevoBloque = document.getElementById(`bloque-episodios-${contadorBloquesEpisodios}`);
  nuevoBloque.classList.add('bloque-episodios-entering');
  setTimeout(() => {
    nuevoBloque.classList.remove('bloque-episodios-entering');
  }, 300);

  // Generar tabla automáticamente al crear el bloque
  generarTablaEpisodios(contadorBloquesEpisodios);

  // Forzar los campos a vacío para evitar que el navegador muestre 0 por defecto
  const desdeInput = nuevoBloque.querySelector('.desde-episodio');
  const hastaInput = nuevoBloque.querySelector('.hasta-episodio');
  const temporadaInput = nuevoBloque.querySelector('.temporada');
  if (desdeInput) {
    desdeInput.value = '';
    desdeInput.disabled = true;
  }
  if (hastaInput) {
    hastaInput.value = '';
    hastaInput.disabled = true;
  }
  if (temporadaInput) {
    temporadaInput.value = '';
    // Temporada habilitada por defecto
  }
  // Habilitar Desde episodio solo si Temporada tiene valor
  const hintDesde = nuevoBloque.querySelector('.hint-desde-episodio');
  const hintHasta = nuevoBloque.querySelector('.hint-hasta-episodio');
  if (temporadaInput && desdeInput) {
    temporadaInput.addEventListener('input', function() {
      if (temporadaInput.value && parseInt(temporadaInput.value) > 0) {
        desdeInput.disabled = false;
        desdeInput.style.background = '';
        desdeInput.placeholder = 'N° episodio inicial';
        if (hintDesde) hintDesde.style.display = 'none';
      } else {
        desdeInput.value = '';
        desdeInput.disabled = true;
        desdeInput.style.background = '#eee';
        desdeInput.placeholder = 'Seleccione temporada primero';
        if (hintDesde) hintDesde.style.display = '';
        hastaInput.value = '';
        hastaInput.disabled = true;
        hastaInput.style.background = '#eee';
        hastaInput.placeholder = "Seleccione 'Desde episodio' primero";
        if (hintHasta) hintHasta.style.display = '';
      }
    });
  }
  // Habilitar Hasta episodio solo si Desde episodio tiene valor
  if (desdeInput && hastaInput) {
    desdeInput.addEventListener('input', function() {
      if (desdeInput.value && parseInt(desdeInput.value) > 0) {
        hastaInput.disabled = false;
        hastaInput.style.background = '';
        hastaInput.placeholder = 'N° episodio final';
        if (hintHasta) hintHasta.style.display = 'none';
      } else {
        hastaInput.value = '';
        hastaInput.disabled = true;
        hastaInput.style.background = '#eee';
        hastaInput.placeholder = "Seleccione 'Desde episodio' primero";
        if (hintHasta) hintHasta.style.display = '';
      }
    });
    // Validación visual de intervalo incorrecto
    let alertaIntervalo = nuevoBloque.querySelector('.alerta-intervalo');
    if (!alertaIntervalo) {
      alertaIntervalo = document.createElement('div');
      alertaIntervalo.className = 'alerta-intervalo';
      alertaIntervalo.style.display = 'none';
      alertaIntervalo.style.background = '#ffe0e0';
      alertaIntervalo.style.color = '#b20000';
      alertaIntervalo.style.padding = '6px';
      alertaIntervalo.style.marginTop = '4px';
      alertaIntervalo.style.borderRadius = '4px';
      alertaIntervalo.style.fontSize = '0.95em';
      alertaIntervalo.innerText = "El intervalo es incorrecto. 'Desde episodio' no puede ser mayor que 'Hasta episodio'. Ejemplo: Desde episodio: 1, Hasta episodio: 10.";
      hastaInput.parentNode.appendChild(alertaIntervalo);
    }
    const mostrarAlerta = () => {
      if (
        desdeInput.value &&
        hastaInput.value &&
        Number(desdeInput.value) > Number(hastaInput.value)
      ) {
        alertaIntervalo.style.display = 'block';
      } else {
        alertaIntervalo.style.display = 'none';
      }
    };
    desdeInput.addEventListener('input', mostrarAlerta);
    hastaInput.addEventListener('input', mostrarAlerta);
  }
  if (desdeInput && hastaInput) {
    const autoGen = () => generarTablaEpisodios(contadorBloquesEpisodios);
    desdeInput.addEventListener('input', autoGen);
    hastaInput.addEventListener('input', autoGen);
  }

  // Evento para botón importar títulos
  const btnImportar = nuevoBloque.querySelector('.btn-importar-titulos');
  const inputImportar = nuevoBloque.querySelector('.input-importar-titulos');
  if (btnImportar && inputImportar) {
    btnImportar.addEventListener('click', () => {
       const bloque = document.getElementById(`bloque-episodios-${contadorBloquesEpisodios}`);
       if (!bloque) return;
       const desde = parseInt(bloque.querySelector('.desde-episodio')?.value || '0');
       const hasta = parseInt(bloque.querySelector('.hasta-episodio')?.value || '0');
       if (!desde || !hasta || desde > hasta) {
         alert('Por favor, registre primero un intervalo válido de episodios antes de importar títulos.');
         return;
       }
       inputImportar.click();
     });
    inputImportar.addEventListener('change', function(e) {
      if (e.target.files && e.target.files[0]) {
        importarTitulosDesdeArchivo(e.target.files[0], contadorBloquesEpisodios);
        e.target.value = '';
      }
    });
  }

  // Evento para botón pegar títulos
  const btnPegar = nuevoBloque.querySelector('.btn-pegar-titulos');
  if (btnPegar) {
    btnPegar.addEventListener('click', () => {
       const bloque = document.getElementById(`bloque-episodios-${contadorBloquesEpisodios}`);
       if (!bloque) return;
       const desde = parseInt(bloque.querySelector('.desde-episodio')?.value || '0');
       const hasta = parseInt(bloque.querySelector('.hasta-episodio')?.value || '0');
       if (!desde || !hasta || desde > hasta) {
         alert('Por favor, registre primero un intervalo válido de episodios antes de pegar títulos.');
         return;
       }
       mostrarModalPegarTitulos(contadorBloquesEpisodios);
     });
  }
}

// Función para configurar eventos de un bloque de episodios
function configurarEventosBloqueEpisodios(bloqueId) {
  const bloque = document.getElementById(`bloque-episodios-${bloqueId}`);
  if (!bloque) return;
  
  // Botón eliminar bloque
  const btnEliminar = bloque.querySelector('.btn-eliminar');
  if (btnEliminar) {
    btnEliminar.addEventListener('click', function() {
      eliminarBloqueEpisodios(bloqueId);
    });
  }
  
  // Botón agregar línea de participación
  const btnAgregarLinea = bloque.querySelector('.btn-agregar-linea');
  if (btnAgregarLinea) {
    btnAgregarLinea.addEventListener('click', function() {
      agregarLineaParticipacion(bloqueId);
    });
  }
  
  // Evento para botón importar títulos
  const btnImportar = bloque.querySelector('.btn-importar-titulos');
  const inputImportar = bloque.querySelector('.input-importar-titulos');
  if (btnImportar && inputImportar) {
    btnImportar.addEventListener('click', () => {
       const desde = parseInt(bloque.querySelector('.desde-episodio')?.value || '0');
       const hasta = parseInt(bloque.querySelector('.hasta-episodio')?.value || '0');
       if (!desde || !hasta || desde > hasta) {
         alert('Por favor, registre primero un intervalo válido de episodios antes de importar títulos.');
         return;
       }
       inputImportar.click();
     });
    inputImportar.addEventListener('change', function(e) {
      if (e.target.files && e.target.files[0]) {
        importarTitulosDesdeArchivo(e.target.files[0], bloqueId);
        e.target.value = '';
      }
    });
  }

  // Evento para botón pegar títulos
  const btnPegar = bloque.querySelector('.btn-pegar-titulos');
  if (btnPegar) {
    btnPegar.addEventListener('click', () => {
       const desde = parseInt(bloque.querySelector('.desde-episodio')?.value || '0');
       const hasta = parseInt(bloque.querySelector('.hasta-episodio')?.value || '0');
       if (!desde || !hasta || desde > hasta) {
         alert('Por favor, registre primero un intervalo válido de episodios antes de pegar títulos.');
         return;
       }
       mostrarModalPegarTitulos(bloqueId);
     });
  }

  // Eventos para campos de intervalo (ya agregados en agregarBloqueEpisodios)
}

// Función para eliminar un bloque de episodios
function eliminarBloqueEpisodios(bloqueId) {
  const bloqueColapsable = document.getElementById(`bloque-episodios-colapsable-${bloqueId}`);
  if (!bloqueColapsable) return;
  // Mostrar confirmación
  if (confirm('¿Está seguro de eliminar este bloque de episodios?')) {
    bloqueColapsable.classList.add('bloque-episodios-removing');
    setTimeout(() => {
      bloqueColapsable.remove();
      // Verificar si quedan bloques
      const bloquesRestantes = document.querySelectorAll('.bloque-episodios-colapsable');
      if (bloquesRestantes.length === 0) {
        contadorBloquesEpisodios = 0;
      } else {
        // Renumerar los bloques restantes
        bloquesRestantes.forEach((bloque, index) => {
          const nuevoNumero = index + 1;
          bloque.id = `bloque-episodios-colapsable-${nuevoNumero}`;
          const titulo = bloque.querySelector('.bloque-title h3');
          if (titulo) {
            titulo.textContent = `Bloque de Episodios #${nuevoNumero}`;
          }
          // También actualizar el id del bloque interno
          const bloqueInterno = bloque.querySelector('.bloque-episodios');
          if (bloqueInterno) {
            bloqueInterno.id = `bloque-episodios-${nuevoNumero}`;
          }
        });
        // Actualizar el contador al número de bloques restantes
        contadorBloquesEpisodios = bloquesRestantes.length;
      }
    }, 300);
  }
}

// Función para generar la tabla de episodios
function generarTablaEpisodios(bloqueId) {
  const bloque = document.getElementById(`bloque-episodios-${bloqueId}`);
  if (!bloque) return;
  
  const desdeEpisodio = parseInt(bloque.querySelector('.desde-episodio').value) || 0;
  const hastaEpisodio = parseInt(bloque.querySelector('.hasta-episodio').value) || 0;
  
  // Eliminada la advertencia molesta de episodio final menor al inicial
  if (hastaEpisodio < desdeEpisodio) {
    return;
  }
  
  if ((hastaEpisodio - desdeEpisodio + 1) > 300) {
    alert('Por favor, limita el rango a un máximo de 300 episodios por bloque.');
    return;
  }
  
  // Generar episodios individuales
  generarEpisodiosIndividuales(bloqueId, desdeEpisodio, hastaEpisodio);
  
  // Mostrar la tabla
  const tablaContainer = bloque.querySelector('.tabla-episodios-container');
  if (tablaContainer) {
    tablaContainer.style.display = 'block';
  }
}

// Función para generar episodios individuales
function generarEpisodiosIndividuales(bloqueId, desde, hasta) {
  const bloque = document.getElementById(`bloque-episodios-${bloqueId}`);
  if (!bloque) return;
  
  const episodiosContainer = bloque.querySelector('.episodios-individuales');
  if (!episodiosContainer) return;
  
  // Validar intervalo antes de generar episodios
  if (desde <= 0 || hasta < desde) {
    episodiosContainer.innerHTML = '';
    return;
  }
  episodiosContainer.innerHTML = `
    <div class="intervalo-header">
      <h4>Episodios ${desde} - ${hasta}</h4>
      <button type="button" class="btn-toggle-intervalo">
        <i class="fas fa-chevron-down"></i>
      </button>
    </div>
    <div class="intervalo-content">
      <div class="episodios-list"></div>
    </div>
  `;

  const episodiosList = episodiosContainer.querySelector('.episodios-list');
  
  console.log(`Generando episodios desde ${desde} hasta ${hasta}`);
  console.log('episodiosList encontrado:', episodiosList);
  
  for (let i = desde; i <= hasta; i++) {
    console.log(`Creando episodio ${i}`);
    const episodioHTML = `
      <div class="episodio-item" data-episodio="${i}">
        <div class="episodio-header" data-episodio="${i}">
          <div class="episodio-header-content">
            <span class="episodio-numero">Episodio ${i}</span>
            <span class="episodio-titulo-preview">Sin título</span>
          </div>
          <button type="button" class="btn-toggle-episodio" data-episodio="${i}">
            <i class="fas fa-chevron-down"></i>
          </button>
        </div>
        
        <div class="episodio-content collapsed" data-episodio="${i}">
          <div class="form-group">
            <label>Título del episodio ${i}</label>
            <input type="text" class="titulo-episodio" id="titulo-${bloqueId}-${i}" data-episodio="${i}" placeholder="Título del episodio ${i}">
          </div>
        </div>
      </div>
    `;
    
    episodiosList.insertAdjacentHTML('beforeend', episodioHTML);
    console.log(`Episodio ${i} insertado. Total episodios en lista:`, episodiosList.children.length);
  }

  // Configurar el toggle del intervalo
  const intervaloHeader = episodiosContainer.querySelector('.intervalo-header');
  const intervaloContent = episodiosContainer.querySelector('.intervalo-content');
  const intervaloToggleBtn = episodiosContainer.querySelector('.btn-toggle-intervalo');

  if (intervaloHeader && intervaloContent && intervaloToggleBtn) {
    intervaloHeader.addEventListener('click', (e) => {
      if (e.target.closest('.btn-toggle-intervalo')) return;
      toggleIntervaloContent(intervaloContent, intervaloToggleBtn);
    });

    intervaloToggleBtn.addEventListener('click', () => {
      toggleIntervaloContent(intervaloContent, intervaloToggleBtn);
    });
  }
  
  // Configurar eventos de los episodios
  configurarEventosEpisodios(bloqueId);
}

// Función para configurar eventos de episodios
function configurarEventosEpisodios(bloqueId) {
  const bloque = document.getElementById(`bloque-episodios-${bloqueId}`);
  if (!bloque) return;
  
  // Eventos para expandir/contraer episodios
  const headers = bloque.querySelectorAll('.episodio-header');
  headers.forEach(header => {
    header.addEventListener('click', function() {
      const episodioNum = this.getAttribute('data-episodio');
      toggleEpisodio(bloqueId, episodioNum);
    });
  });
  
  // Eventos para títulos de episodios
  const titulosEpisodios = bloque.querySelectorAll('.titulo-episodio');
  titulosEpisodios.forEach(titulo => {
    titulo.addEventListener('input', function() {
      actualizarPreviewTitulo(bloqueId, this.getAttribute('data-episodio'), this.value);
    });
  });
  

}

// Función para alternar la visibilidad de un episodio
function toggleEpisodio(bloqueId, episodioNum) {
  const bloque = document.getElementById(`bloque-episodios-${bloqueId}`);
  if (!bloque) return;
  
  const header = bloque.querySelector(`.episodio-header[data-episodio="${episodioNum}"]`);
  const content = bloque.querySelector(`.episodio-content[data-episodio="${episodioNum}"]`);
  const icon = header.querySelector('.btn-toggle-episodio i');
  
  content.classList.toggle('collapsed');
  icon.style.transform = content.classList.contains('collapsed') ? 'rotate(-90deg)' : '';
  icon.className = content.classList.contains('collapsed') ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
}

// Función para alternar la visibilidad del intervalo de episodios
function toggleIntervaloContent(content, toggleBtn) {
  content.classList.toggle('collapsed');
  const icon = toggleBtn.querySelector('i');
  icon.style.transform = content.classList.contains('collapsed') ? 'rotate(-90deg)' : '';
  icon.className = content.classList.contains('collapsed') ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
}

// Función para alternar la visibilidad del bloque de episodios completo
function toggleBloqueContent(content, toggleBtn) {
  content.classList.toggle('collapsed');
  const icon = toggleBtn.querySelector('i');
  icon.style.transform = content.classList.contains('collapsed') ? 'rotate(-90deg)' : '';
  icon.className = content.classList.contains('collapsed') ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
}

// Función para actualizar el preview del título
function actualizarPreviewTitulo(bloqueId, episodioNum, titulo) {
  const bloque = document.getElementById(`bloque-episodios-${bloqueId}`);
  if (!bloque) return;
  
  const preview = bloque.querySelector(`.episodio-header[data-episodio="${episodioNum}"] .episodio-titulo-preview`);
  if (preview) {
    preview.textContent = titulo || 'Sin título';
  }
}

// Función para agregar título alternativo
function agregarTituloAlternativo(bloqueId, episodioNum) {
  const bloque = document.getElementById(`bloque-episodios-${bloqueId}`);
  if (!bloque) return;
  
  const lista = bloque.querySelector(`.titulos-alternativos-lista[data-episodio="${episodioNum}"]`);
  if (!lista) return;
  
  const tituloAltHTML = `
    <div class="titulo-alternativo">
      <div class="form-row">
        <div class="form-group">
          <label>Título alternativo</label>
          <input type="text" class="titulo-alt-texto" placeholder="Título alternativo">
        </div>
        <div class="form-group">
          <label>Idioma</label>
          <select class="titulo-alt-idioma">
            <option value="">Seleccione...</option>
            <option value="Español">Español</option>
            <option value="Inglés">Inglés</option>
            <option value="Francés">Francés</option>
            <option value="Portugués">Portugués</option>
            <option value="Otro">Otro</option>
          </select>
        </div>
        <div class="form-group" style="align-self: flex-end;">
          <button type="button" class="btn-eliminar-titulo">
            <span>×</span> Eliminar
          </button>
        </div>
      </div>
    </div>
  `;
  
  lista.insertAdjacentHTML('beforeend', tituloAltHTML);
  
  // Configurar eventos del nuevo título alternativo
  const nuevoTitulo = lista.lastElementChild;
  const btnEliminar = nuevoTitulo.querySelector('.btn-eliminar-titulo');
  if (btnEliminar) {
    btnEliminar.addEventListener('click', function() {
      nuevoTitulo.remove();
      actualizarContadorTitulos(bloqueId, episodioNum);
    });
  }
  
  // Inicializar Select2 para el idioma
  const idiomaSelect = nuevoTitulo.querySelector('.titulo-alt-idioma');
  if (idiomaSelect && window.$ && window.$.fn.select2) {
    $(idiomaSelect).select2({
      placeholder: 'Seleccione...',
      width: '100%',
      allowClear: true
    });
  }
  
  actualizarContadorTitulos(bloqueId, episodioNum);
}

// Función para actualizar el contador de títulos alternativos
function actualizarContadorTitulos(bloqueId, episodioNum) {
  const bloque = document.getElementById(`bloque-episodios-${bloqueId}`);
  if (!bloque) return;
  
  const header = bloque.querySelector(`.episodio-header[data-episodio="${episodioNum}"]`);
  if (!header) return;
  
  const contador = header.querySelector('.episodio-contador-titulos');
  if (!contador) return;
  
  const titulosAlternativos = bloque.querySelectorAll(`.episodio-content[data-episodio="${episodioNum}"] .titulo-alternativo`);
  const cantidad = titulosAlternativos.length;
  
  contador.textContent = `${cantidad} título${cantidad !== 1 ? 's' : ''} traducido${cantidad !== 1 ? 's' : ''}`;
}

// Función para agregar línea de participación
function agregarLineaParticipacion(bloqueId) {
  const bloque = document.getElementById(`bloque-episodios-${bloqueId}`);
  if (!bloque) return;
  
  const lineasContainer = bloque.querySelector('.lineas-participacion');
  if (!lineasContainer) return;
  
  // Verificar si ya hay 10 participaciones
  const lineasExistentes = lineasContainer.querySelectorAll('.linea-participacion');
  if (lineasExistentes.length >= 10) {
    alert('No se pueden agregar más de 10 participaciones por episodio.');
    return;
  }
  
  const lineaHTML = `
    <div class="linea-participacion">
      <div class="form-row">
        <div class="form-group">
          <label>Rol</label>
          <select class="rol-participacion">
            <option value="">Seleccione...</option>
            <option value="Director">Director</option>
            <option value="Guionista">Guionista</option>
            <option value="Productor">Productor</option>
            <option value="Actor">Actor</option>
            <option value="Otro">Otro</option>
          </select>
        </div>
        <div class="form-group">
          <label>Autor</label>
          <select class="autor-participacion">
            <option value="">Buscar o agregar...</option>
          </select>
        </div>
        <div class="form-group">
          <label>Porcentaje de participación <span style="color: #dc3545;">*</span></label>
          <input type="number" class="porcentaje-participacion" min="0" max="100" step="0.01" placeholder="0.00" required>
        </div>
        <div class="form-group" style="align-self: flex-end;">
          <button type="button" class="btn-eliminar-linea">
            <span>×</span> Eliminar
          </button>
        </div>
      </div>
    </div>
  `;
  
  lineasContainer.insertAdjacentHTML('beforeend', lineaHTML);
  
  // Configurar eventos de la nueva línea
  const nuevaLinea = lineasContainer.lastElementChild;
  const btnEliminar = nuevaLinea.querySelector('.btn-eliminar-linea');
  if (btnEliminar) {
    btnEliminar.addEventListener('click', function() {
      nuevaLinea.remove();
    });
  }
  
  // Inicializar Select2 para el autor
  const autorSelect = nuevaLinea.querySelector('.autor-participacion');
  if (autorSelect && window.$ && window.$.fn.select2) {
    $(autorSelect).select2({
      placeholder: 'Buscar o agregar...',
      width: '100%',
      allowClear: true,
      tags: true
    });
  }
}

// Función para validar intervalo de episodios
function validarIntervaloEpisodios(bloqueId) {
  const bloque = document.getElementById(`bloque-episodios-${bloqueId}`);
  if (!bloque) return;
  
  const desdeEpisodio = parseInt(bloque.querySelector('.desde-episodio').value) || 0;
  const hastaEpisodio = parseInt(bloque.querySelector('.hasta-episodio').value) || 0;
  
  // Eliminada la advertencia molesta de episodio final menor al inicial
  if (hastaEpisodio < desdeEpisodio) {
    bloque.querySelector('.hasta-episodio').value = desdeEpisodio;
  }
}

// --- MODAL GESTIÓN OTROS TÍTULOS POR EPISODIO ---
let titulosEpisodioData = [];

// --- ALMACENAMIENTO DE DATOS POR BLOQUE ---
let participacionesPorBloque = {}; // Almacena participaciones específicas por bloque
let titulosPorBloque = {}; // Almacena títulos específicos por bloque
let bloqueActualModal = null; // ID del bloque actual en el modal

function abrirModalTitulosEpisodio() {
  console.log('Abriendo modal de títulos de episodio');
  cargarOpcionesEpisodios();
  console.log('Episodios disponibles:', window.episodiosDisponibles);
  
  // Cargar datos específicos del bloque actual
  if (bloqueActualModal && titulosPorBloque[bloqueActualModal]) {
    titulosEpisodioData = [...titulosPorBloque[bloqueActualModal]];
  } else {
    titulosEpisodioData = [];
  }
  
  renderTablaTitulosEpisodio();
  document.getElementById('modalTitulosEpisodio').style.display = 'flex';
}

function cerrarModalTitulosEpisodio() {
  // Guardar datos específicos del bloque actual
  if (bloqueActualModal) {
    titulosPorBloque[bloqueActualModal] = [...titulosEpisodioData];
  }
  
  document.getElementById('modalTitulosEpisodio').style.display = 'none';
}

function cargarOpcionesEpisodios() {
  // Buscar episodios generados solo del bloque actual
  const episodios = [];
  if (bloqueActualModal) {
    const bloqueActual = document.getElementById(`bloque-episodios-${bloqueActualModal}`);
    if (bloqueActual) {
      bloqueActual.querySelectorAll('.episodio-item').forEach(item => {
        const num = item.getAttribute('data-episodio');
        if (num) episodios.push(num);
      });
    }
  }
  window.episodiosDisponibles = episodios;
}

function renderTablaTitulosEpisodio() {
  console.log('Renderizando tabla de títulos');
  console.log('Datos a renderizar:', titulosEpisodioData);
  const tbody = document.querySelector('.tabla-titulos-episodio tbody');
  if (!tbody) {
    console.error('No se encontró el tbody de la tabla');
    return;
  }
  tbody.innerHTML = '';
  titulosEpisodioData.forEach((row, idx) => {
    const tr = document.createElement('tr');
    // Episodio select
    const tdEpisodio = document.createElement('td');
    const selectEpisodio = document.createElement('select');
    selectEpisodio.className = 'select-episodio';
    window.episodiosDisponibles.forEach(ep => {
      const opt = document.createElement('option');
      opt.value = ep;
      opt.textContent = ep;
      if (row.episodio == ep) opt.selected = true;
      selectEpisodio.appendChild(opt);
    });
    tdEpisodio.appendChild(selectEpisodio);
    tr.appendChild(tdEpisodio);
    // Otro título
    const tdTitulo = document.createElement('td');
    const inputTitulo = document.createElement('input');
    inputTitulo.type = 'text';
    inputTitulo.value = row.titulo || '';
    inputTitulo.className = 'input-titulo-otro';
    tdTitulo.appendChild(inputTitulo);
    tr.appendChild(tdTitulo);
    // Idioma
    const tdIdioma = document.createElement('td');
    const selectIdioma = document.createElement('select');
    selectIdioma.className = 'select-idioma';
    tdIdioma.appendChild(selectIdioma);
    tr.appendChild(tdIdioma);
    // País
    const tdPais = document.createElement('td');
    const selectPais = document.createElement('select');
    selectPais.className = 'select-pais';
    tdPais.appendChild(selectPais);
    tr.appendChild(tdPais);
    // Eliminar
    const tdEliminar = document.createElement('td');
    const btnEliminar = document.createElement('button');
    btnEliminar.type = 'button';
    btnEliminar.className = 'btn btn-outline-success btn-eliminar-titulo-episodio';
    btnEliminar.innerHTML = 'Eliminar';
    btnEliminar.onclick = () => {
      titulosEpisodioData.splice(idx, 1);
      renderTablaTitulosEpisodio();
    };
    tdEliminar.appendChild(btnEliminar);
    tr.appendChild(tdEliminar);
    tbody.appendChild(tr);
    // Guardar cambios en selects/inputs
    selectEpisodio.onchange = () => { row.episodio = selectEpisodio.value; };
    inputTitulo.oninput = () => { row.titulo = inputTitulo.value; };
    selectIdioma.onchange = () => { row.idioma = selectIdioma.value; };
    selectPais.onchange = () => { row.pais = selectPais.value; };
    // Cargar opciones idioma y país
    cargarOpcionesIdiomaYPais(selectIdioma, selectPais, row);
  });
}

async function cargarOpcionesIdiomaYPais(selectIdioma, selectPais, row) {
  const idiomas = await fetchJSON('idioma.json');
  selectIdioma.innerHTML = '<option value="">Seleccione...</option>' + idiomas.filter(i => i.Idioma).map(i => `<option value="${i.Idioma}" ${row.idioma===i.Idioma?'selected':''}>${i.Idioma}</option>`).join('');
  const paises = await fetchJSON('paises.json');
  selectPais.innerHTML = '<option value="">Seleccione...</option>' + paises.map(p => `<option value="${p["Nombre del país"]}" ${row.pais===p["Nombre del país"]?'selected':''}>${p["Nombre del país"]}</option>`).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  document.body.addEventListener('click', function(e) {
    // Manejadores para el modal de ayuda de importación
    if (e.target.closest('.btn-ayuda-importar')) {
      document.getElementById('modalAyudaImportar').style.display = 'flex';
    }
    if (e.target.closest('.btn-cerrar-ayuda')) {
      document.getElementById('modalAyudaImportar').style.display = 'none';
    }
    if (e.target.closest('.btn-gestionar-titulos')) {
      const boton = e.target.closest('.btn-gestionar-titulos');
      bloqueActualModal = boton.getAttribute('data-bloque-id');
      
      // Validar que existe un intervalo válido antes de abrir el modal
      if (bloqueActualModal) {
        // Caso de bloques dinámicos con data-bloque-id
        const bloque = document.getElementById(`bloque-episodios-${bloqueActualModal}`);
        if (bloque) {
          const desde = parseInt(bloque.querySelector('.desde-episodio')?.value || '0');
          const hasta = parseInt(bloque.querySelector('.hasta-episodio')?.value || '0');
          if (!desde || !hasta || desde > hasta) {
            alert('Por favor, registre primero un intervalo válido de episodios antes de gestionar títulos.');
            return;
          }
        }
      } else {
        // Caso del step-5 sin data-bloque-id - verificar si hay episodios generados
        const episodiosTitulos = document.querySelector('.episodios-titulos');
        if (!episodiosTitulos || episodiosTitulos.children.length === 0) {
          alert('Por favor, genere primero los episodios en algún bloque antes de gestionar títulos.');
          return;
        }
      }
      
      console.log('Abriendo modal de títulos para bloque:', bloqueActualModal);
      abrirModalTitulosEpisodio();
    }
    if (e.target.closest('.btn-cerrar-titulos-episodio')) cerrarModalTitulosEpisodio();
    if (e.target.closest('.btn-agregar-titulo-episodio')) {
      titulosEpisodioData.push({ episodio: window.episodiosDisponibles?.[0] || '', titulo: '', idioma: '', pais: '' });
      renderTablaTitulosEpisodio();
    }
    if (e.target.closest('.btn-guardar-titulos-episodio')) {
      // Guardar títulos específicos del bloque actual
      if (bloqueActualModal) {
        titulosPorBloque[bloqueActualModal] = [...titulosEpisodioData];
      }
      cerrarModalTitulosEpisodio();
    }
    if (e.target.closest('.btn-importar-titulos-episodio')) {
      console.log('Botón importar títulos clickeado');
      const input = document.querySelector('.input-importar-titulos-episodio');
      console.log('Input file encontrado:', !!input);
      if (input) input.click();
    }
    if (e.target.closest('.btn-pegar-titulos-episodio')) {
      mostrarModalPegarTitulosEpisodio().catch(error => {
        console.error('Error al mostrar modal de pegar títulos:', error);
      });
    }
    // Abrir modal de gestionar participaciones
    if (e.target.closest('.btn-gestionar-participaciones')) {
      const boton = e.target.closest('.btn-gestionar-participaciones');
      bloqueActualModal = boton.getAttribute('data-bloque-id');
      
      // Validar que existe un intervalo válido antes de abrir el modal
      const bloque = document.getElementById(`bloque-episodios-${bloqueActualModal}`);
      if (bloque) {
        const desde = parseInt(bloque.querySelector('.desde-episodio')?.value || '0');
        const hasta = parseInt(bloque.querySelector('.hasta-episodio')?.value || '0');
        if (!desde || !hasta || desde > hasta) {
          alert('Por favor, registre primero un intervalo válido de episodios antes de gestionar participaciones.');
          return;
        }
      }
      
      console.log('Abriendo modal de participaciones para bloque:', bloqueActualModal);
      restaurarParticipacionesModal();
      document.getElementById('modalParticipaciones').style.display = 'flex';
    }
    // Cerrar modal de gestionar participaciones
    if (e.target.closest('.btn-cerrar-participaciones')) {
      document.getElementById('modalParticipaciones').style.display = 'none';
    }
    // Agregar fila de participación en el modal
    if (e.target.closest('.btn-agregar-participacion')) {
      agregarFilaParticipacionModal();
    }
    // Eliminar fila de participación en el modal
    if (e.target.closest('.btn-eliminar-participacion')) {
      e.target.closest('tr').remove();
    }
    // Guardar participaciones desde el modal
    if (e.target.closest('.btn-guardar-participaciones')) {
      if (!validarParticipacionesModal()) {
        // Si hay error, no guardar y mostrar mensaje
        return;
      }
      
      console.log('=== GUARDANDO PARTICIPACIONES DESDE MODAL ===');
      console.log('Bloque actual del modal:', bloqueActualModal);
      
      // Obtener las participaciones del modal
      const participacionesModal = obtenerDatosParticipacionesModal();
      console.log('Participaciones del modal:', participacionesModal);
      
      // Guardar participaciones específicas del bloque actual
      if (bloqueActualModal) {
        participacionesPorBloque[bloqueActualModal] = [...participacionesModal];
        console.log('Participaciones guardadas para bloque', bloqueActualModal, ':', participacionesPorBloque[bloqueActualModal]);
      }
      
      document.getElementById('modalParticipaciones').style.display = 'none';
    }
  });



// Función para validar las participaciones en el modal
function validarParticipacionesModal() {
  const filas = document.querySelectorAll('#modalParticipaciones .tabla-participaciones tbody tr');
  const sumas = {};
  let error = '';
  filas.forEach(fila => {
    const rol = fila.querySelector('.rol-modal-participacion')?.value;
    const porcentaje = parseFloat(fila.querySelector('.porcentaje-modal-participacion')?.value) || 0;
    if (!rol) return;
    if (!sumas[rol]) sumas[rol] = 0;
    sumas[rol] += porcentaje;
  });
  for (const rol in sumas) {
    if (sumas[rol] > 100.001) {
      error = `La suma de participación para el rol "${rol}" supera el 100%. Corrija los valores.`;
      break;
    }
  }
  const errorElement = document.getElementById('participaciones-modal-error');
  if (errorElement) {
    errorElement.textContent = error;
  }
  return !error;
}

// Función para restaurar las participaciones en el modal
function restaurarParticipacionesModal() {
  const tbody = document.querySelector('#modalParticipaciones .tabla-participaciones tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  
  console.log('Restaurando participaciones modal para bloque:', bloqueActualModal);
  
  let participacionesParaRestaurar = [];
  
  // Si hay un bloque específico, usar sus participaciones
  if (bloqueActualModal && participacionesPorBloque[bloqueActualModal]) {
    participacionesParaRestaurar = participacionesPorBloque[bloqueActualModal];
    console.log('Participaciones encontradas para bloque', bloqueActualModal, ':', participacionesParaRestaurar);
  } else {
    console.log('No hay participaciones guardadas para el bloque', bloqueActualModal);
  }
  
  console.log('Participaciones para restaurar:', participacionesParaRestaurar);
  
  if (participacionesParaRestaurar && Array.isArray(participacionesParaRestaurar)) {
     participacionesParaRestaurar.forEach(part => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <select class="rol-modal-participacion">
            <option value="">Seleccione...</option>
          </select>
        </td>
        <td>
          <select class="autor-modal-participacion" style="width:100%">
            <option value="">Escriba el nombre del autor para buscar coincidencias...</option>
          </select>
        </td>
        <td>
          <input type="number" class="porcentaje-modal-participacion" min="0" max="100" step="0.01" placeholder="0.00" required style="width:80px;text-align:right;">
        </td>
        <td>
          <button type="button" class="btn btn-danger btn-eliminar-participacion">Eliminar</button>
        </td>
      `;
      tbody.appendChild(tr);
      
      // Inicializar opciones y valores
      Promise.all([
        fetch('assets/rol.json').then(r => r.json()),
        fetch('assets/socios.json').then(r => r.json())
      ]).then(([roles, autores]) => {
        const rolSelect = tr.querySelector('.rol-modal-participacion');
        rolSelect.innerHTML = '<option value="">Seleccione...</option>' + roles.map(r => `<option value="${r.Rol}">${r.Rol}</option>`).join('');
        rolSelect.value = part.rol || '';
        
        const autorSelect = tr.querySelector('.autor-modal-participacion');
        
        // Inicializar Select2 para el campo de autor
        if (autorSelect && window.$ && window.$.fn.select2) {
          $(autorSelect).select2({
            placeholder: 'Escriba el nombre del autor para buscar coincidencias...',
            width: '100%',
            allowClear: true,
            tags: true,
            minimumInputLength: 2,
            ajax: {
              transport: function(params, success, failure) {
                fetchJSON('socios.json').then(sociosRaw => {
                  const term = params.data.q ? params.data.q.toLowerCase() : '';
                  const autores = sociosRaw
                    .map(a => a["Nombre completo"])
                    .filter(nombre => nombre && nombre.toLowerCase().includes(term));
                  success({ results: autores.map(nombre => ({ id: nombre, text: nombre })) });
                }).catch(failure);
              },
              processResults: function(data) {
                return { results: data.results };
              }
            },
            language: {
              inputTooShort: function() {
                return 'Escriba al menos 2 caracteres para buscar autores.';
              },
              noResults: function() {
                return 'No se encontró el autor. Puede crear uno nuevo.';
              }
            }
          });
          
          // Establecer el valor después de inicializar Select2
          if (part.autor) {
            // Crear una opción con el valor guardado si no existe
            const option = new Option(part.autor, part.autor, true, true);
            $(autorSelect).append(option).trigger('change');
          }
        }
        
        // Agregar eventos de validación
        rolSelect.addEventListener('change', validarParticipacionesModal);
        tr.querySelector('.porcentaje-modal-participacion').addEventListener('input', validarParticipacionesModal);
      });
      
      tr.querySelector('.porcentaje-modal-participacion').value = part.porcentaje || '';
    });
  }
}

// Función para agregar una fila al modal de participaciones
function agregarFilaParticipacionModal() {
  const tbody = document.querySelector('#modalParticipaciones .tabla-participaciones tbody');
  if (!tbody) return;
  
  // Verificar si ya hay 10 participaciones
  const filas = tbody.querySelectorAll('tr');
  if (filas.length >= 10) {
    alert('No se pueden agregar más de 10 participaciones.');
    return;
  }
  
  // Obtener roles y autores desde los JSON
  Promise.all([
    fetch('assets/rol.json').then(r => r.json()),
    fetch('assets/socios.json').then(r => r.json())
  ]).then(([roles, autores]) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <select class="rol-modal-participacion">
          <option value="">Seleccione...</option>
          ${roles.map(r => `<option value="${r.Rol}">${r.Rol}</option>`).join('')}
        </select>
      </td>
      <td>
        <select class="autor-modal-participacion" style="width:100%">
  <option value="">Escriba el nombre del autor para buscar coincidencias...</option>
</select>
      </td>
      <td>
        <input type="number" class="porcentaje-modal-participacion" min="0" max="100" step="0.01" placeholder="0.00" required style="width:80px;text-align:right;">
      </td>
      <td>
        <button type="button" class="btn btn-danger btn-eliminar-participacion">Eliminar</button>
      </td>
    `;
    tbody.appendChild(tr);
    // Inicializar Select2 con carga dinámica para el autor en el modal
    const autorSelect = tr.querySelector('.autor-modal-participacion');
    // Eventos para validar porcentaje y rol en el modal
    tr.querySelector('.rol-modal-participacion').addEventListener('change', validarParticipacionesModal);
    tr.querySelector('.porcentaje-modal-participacion').addEventListener('input', validarParticipacionesModal);
    if (autorSelect && window.$ && window.$.fn.select2) {
      $(autorSelect).select2({
        placeholder: 'Escriba el nombre del autor para buscar coincidencias...',
        width: '100%',
        allowClear: true,
        tags: true,
        minimumInputLength: 2,
        ajax: {
          transport: function(params, success, failure) {
            fetchJSON('socios.json').then(sociosRaw => {
              const term = params.data.q ? params.data.q.toLowerCase() : '';
              const autoresData = sociosRaw
                .filter(socio => socio["Nombre completo"] && socio["Nombre completo"].toLowerCase().includes(term))
                .map(socio => {
                  // Verificar si tiene correo
                  const tieneCorreo = socio["Correo electrónico"] && socio["Correo electrónico"].trim() !== '';
                  const iconoCorreo = tieneCorreo ? '✓' : '✗';
                  const textoCorreo = tieneCorreo ? socio["Correo electrónico"] : 'Sin correo';
                  
                  return { 
                    id: socio["Nombre completo"], 
                    text: socio["Nombre completo"],
                    correo: socio["Correo electrónico"] || '',
                    tieneCorreo: tieneCorreo,
                    html: `<div class="autor-option ${tieneCorreo ? 'tiene-correo' : 'sin-correo'}">
                            <span class="autor-nombre">${socio["Nombre completo"]}</span>
                            <span class="autor-correo-info">${iconoCorreo} ${textoCorreo}</span>
                          </div>`
                  };
                });
              success({ results: autoresData });
            }).catch(failure);
          },
          processResults: function(data) {
            return { results: data.results };
          },
          templateResult: function(data) {
            if (data.html) {
              return $(data.html);
            }
            return data.text;
          }
        },
        language: {
          inputTooShort: function() {
            return 'Escriba al menos 2 caracteres para buscar autores.';
          },
          noResults: function() {
            return 'No se encontró el autor. Puede crear uno nuevo.';
          }
        }
      });
    }
  });
}


// Evento para input file de importar títulos en el modal
  document.body.addEventListener('change', function(e) {
    if (e.target.classList.contains('input-importar-titulos-episodio')) {
      console.log('Cambio detectado en input file');
      if (e.target.files && e.target.files[0]) {
        importarTitulosEpisodioDesdeArchivo(e.target.files[0]);
        e.target.value = '';
      }
    }
  });
});

// Importar títulos para el modal de Títulos de episodios
async function importarTitulosEpisodioDesdeArchivo(file) {
  console.log('Iniciando importación de archivo:', file.name);

  // Verificar si hay un intervalo de episodios definido
  if (!window.episodiosDisponibles || window.episodiosDisponibles.length === 0) {
    alert('Por favor, defina primero el intervalo de episodios antes de importar títulos.');
    return;
  }

  // Cargar datos de países para la validación
  const paises = await fetchJSON('paises.json');
  const mapaPaises = new Map(paises.map(p => [p["Nombre del país"].toLowerCase(), p["Nombre del país"]]));

  const reader = new FileReader();
  reader.onload = function(e) {
    let filas = [];
    if (file.name.endsWith('.csv')) {
      const text = e.target.result;
      filas = text.split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line)
        .map(line => line.split(',').map(item => item.trim()));
    } else {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      filas = XLSX.utils.sheet_to_json(sheet, { header: 1 })
        .filter(row => row.some(cell => cell)); // Filtrar filas vacías
    }

    if (filas.length) {
      const nuevosTitulos = [];
      let titulosInvalidos = [];
      let episodiosFueraDeRango = [];

      filas.forEach(fila => {
        // Asegurarse de que tenemos al menos el episodio y el título
        if (fila.length < 2) {
          titulosInvalidos.push(fila.join(','));
          return;
        }

        const [episodioStr, titulo, idioma, paisNombre] = fila;
        
        // Validar el número de episodio
        const episodio = parseInt(episodioStr);
        if (isNaN(episodio) || episodio <= 0) {
          titulosInvalidos.push(fila.join(','));
          return;
        }

        // Verificar si el episodio está dentro del rango definido
        if (!window.episodiosDisponibles.includes(episodio.toString())) {
          episodiosFueraDeRango.push(episodio);
          return;
        }

        // Buscar el código del país si se proporcionó
        const codigoPais = paisNombre ? mapaPaises.get(paisNombre.toLowerCase()) : '';

        const nuevoTitulo = {
          episodio: episodio.toString(),
          titulo: titulo || '',
          idioma: idioma || '',
          pais: codigoPais || ''
        };

        nuevosTitulos.push(nuevoTitulo);
      });

      // Mostrar mensajes de error si es necesario
      let mensajeInfo = '';
      if (titulosInvalidos.length > 0) {
        mensajeInfo += `Se omitieron ${titulosInvalidos.length} títulos con formato inválido o números de episodio incorrectos.\n`;
      }
      if (episodiosFueraDeRango.length > 0) {
        mensajeInfo += `Se omitieron los siguientes episodios por estar fuera del intervalo definido: ${episodiosFueraDeRango.join(', ')}.\n`;
      }
      if (mensajeInfo) {
        mensajeInfo += `\nSe importaron correctamente ${nuevosTitulos.length} títulos.`;
        alert(mensajeInfo);
      }

      if (nuevosTitulos.length > 0) {
        // Ordenar los títulos por número de episodio
        nuevosTitulos.sort((a, b) => parseInt(a.episodio) - parseInt(b.episodio));
        titulosEpisodioData = nuevosTitulos;
        renderTablaTitulosEpisodio();
      }
    } else {
      alert('El archivo no contiene datos válidos. Asegúrese de que el archivo tenga el formato correcto:\nEpisodio,Título,Idioma,País');
    }
  };

  if (file.name.endsWith('.csv')) {
    reader.readAsText(file);
  } else {
    reader.readAsArrayBuffer(file);
  }
}

// Modal para pegar títulos en el modal de Títulos de episodios
async function mostrarModalPegarTitulosEpisodio() {
  console.log('Abriendo modal para pegar títulos');
  const modal = document.getElementById('modalPegarTitulosEpisodio');
  const textarea = document.getElementById('textareaPegarTitulos');
  
  // Verificar si hay un intervalo de episodios definido
  if (!window.episodiosDisponibles || window.episodiosDisponibles.length === 0) {
    alert('Por favor, defina primero el intervalo de episodios antes de pegar títulos.');
    return;
  }

  // Cargar datos de países
  const paises = await fetchJSON('paises.json');
  const mapaPaises = new Map(paises.map(p => [p["Nombre del país"]?.toLowerCase(), p["Nombre del país"]]));
  console.log('Mapa de países cargado:', mapaPaises);
  
  if (modal && textarea) {
    modal.style.display = 'flex';
    textarea.value = '';
    
    // Actualizar el texto de instrucciones
    const instruccionesParrafo = modal.querySelector('p small');
    if (instruccionesParrafo) {
      instruccionesParrafo.textContent = 'Episodio,Otro título,Idioma,País';
    }
    
    // Actualizar el placeholder del textarea
    textarea.placeholder = '1,Título alternativo,Español,Chile\n2,Alternative title,Inglés,Estados Unidos';
    
    // Asignar eventos a los botones
    const btnAceptar = modal.querySelector('.btn-aceptar-pegar');
    const btnCancelar = modal.querySelector('.btn-cancelar-pegar');
    
    if (btnAceptar) {
      btnAceptar.onclick = function() {
        const texto = textarea.value;
        console.log('Texto pegado:', texto);
        const lineas = texto.split(/\r?\n/).map(line => line.trim()).filter(line => line);
        console.log('Líneas procesadas:', lineas);
        
        if (lineas.length) {
          const nuevosTitulos = [];
          let titulosInvalidos = [];
          let episodiosFueraDeRango = [];

          lineas.forEach(linea => {
            console.log('Procesando línea:', linea);
            const campos = linea.split(',').map(item => item?.trim());
            console.log('Campos separados:', campos);
            const [episodioStr, titulo, idioma, paisNombre] = campos;
            
            // Validar el número de episodio
            const episodio = parseInt(episodioStr);
            if (isNaN(episodio) || episodio <= 0) {
              titulosInvalidos.push(linea);
              return;
            }

            // Verificar si el episodio está dentro del rango definido
            if (!window.episodiosDisponibles.includes(episodio.toString())) {
              episodiosFueraDeRango.push(episodio);
              return;
            }

            // Buscar el código del país
            const codigoPais = paisNombre ? mapaPaises.get(paisNombre.toLowerCase()) : '';
            console.log('País nombre:', paisNombre, 'Código encontrado:', codigoPais);
            
            const nuevoTitulo = {
              episodio: episodio.toString(),
              titulo: titulo || '',
              idioma: idioma || '',
              pais: codigoPais || ''
            };
            console.log('Título procesado:', nuevoTitulo);
            nuevosTitulos.push(nuevoTitulo);
          });

          // Mostrar mensajes de error si es necesario
          let mensajeInfo = '';
          if (titulosInvalidos.length > 0) {
            mensajeInfo += `Se omitieron ${titulosInvalidos.length} títulos con números de episodio inválidos.\n`;
          }
          if (episodiosFueraDeRango.length > 0) {
            mensajeInfo += `Se omitieron los siguientes episodios por estar fuera del intervalo definido: ${episodiosFueraDeRango.join(', ')}.\n`;
          }
          if (mensajeInfo) {
            mensajeInfo += `\nSe importaron correctamente ${nuevosTitulos.length} títulos.`;
            alert(mensajeInfo);
          }

          if (nuevosTitulos.length > 0) {
            // Actualizar o agregar solo los episodios pegados, preservando los manuales
            const titulosMap = new Map(titulosEpisodioData.map(t => [t.episodio, t]));
            nuevosTitulos.forEach(nuevo => {
              titulosMap.set(nuevo.episodio, nuevo);
            });
            // Convertir a array y ordenar por episodio
            titulosEpisodioData = Array.from(titulosMap.values()).sort((a, b) => parseInt(a.episodio) - parseInt(b.episodio));
            renderTablaTitulosEpisodio();
          }
        }
        modal.style.display = 'none';
      };
    }
    
    if (btnCancelar) {
      btnCancelar.onclick = function() {
        modal.style.display = 'none';
      };
    }
  } else {
    console.error('No se encontró el modal o el textarea para pegar títulos');
  }
}

// Inicialización
// Función de prueba manual para depuración
window.testSaveEpisodiosData = function() {
  console.log('=== PRUEBA MANUAL saveEpisodiosData ===');
  saveEpisodiosData();
};

window.addEventListener('DOMContentLoaded', async () => {
  console.log('=== DOM CONTENT LOADED ===');
  console.log('currentStep inicial:', currentStep);
  console.log('formData inicial:', window.formData);
  console.log('Inicializando formulario...');
  
  // Configurar validación en tiempo real
  setupRealTimeValidation();
  
  // Configurar formateo automático del RUT
  setupRutFormatting();
  
  // Inicializar el carrusel de progreso
  inicializarCarruselProgreso();
  
  // Asegurarse de que todos los pasos estén ocultos al inicio
  document.querySelectorAll('.wizard-step').forEach(step => {
    step.style.display = 'none';
  });
  
  renderProgress();
  
  // Renderizar el primer paso
  const firstStepElement = document.getElementById('step-1');
  if (firstStepElement) {
    firstStepElement.style.display = 'block';
    await steps[0].render(firstStepElement);
    showStep(0);
  }

  // Normalización al salir del campo o al cambiar el valor
  ['actores', 'directores', 'guionistas'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', function(e) {
        e.target.value = normalizarNombres(e.target.value);
      });
      el.addEventListener('blur', function(e) {
        e.target.value = normalizarNombres(e.target.value);
      });
    }
  });

  document.getElementById('prev-btn').addEventListener('click', async () => {
    if (currentStep > 0) await showStep(currentStep - 1);
  });
  document.getElementById('next-btn').addEventListener('click', async () => {
    console.log('Botón siguiente presionado. Paso actual:', currentStep, 'Título del paso:', steps[currentStep]?.title);
    
    if (currentStep === 0 && !validateStep1()) {
      console.log('Validación falló en paso 1');
      return;
    }
    if (currentStep === 1 && !validateStep2()) {
      console.log('Validación falló en paso 2');
      return;
    }
    if (currentStep === 2 && !validateStepDatosTecnicos()) {
      console.log('Validación falló en datos técnicos (paso 3)');
      return;
    }
    
    // Para el paso de participaciones, verificar si es obra serializada
    if (currentStep === 3) {
      const formatoField = document.getElementById('formato');
      const formatoSeleccionado = formatoField ? formatoField.value : (formData.formato || '');
      const obrasSerializadas = ['Serie', 'Telenovela'];
      const esSerializada = obrasSerializadas.includes(formatoSeleccionado);
      
      console.log('Formato seleccionado:', formatoSeleccionado, 'Es serializada:', esSerializada);
      
      if (!esSerializada && !validarParticipaciones()) {
        console.log('Validación falló en participaciones (paso 4)');
        return;
      }
      
      if (esSerializada) {
        console.log('Obra serializada - omitiendo validación de participaciones');
      }
    }
    
    if (currentStep === 4 && !validateStepEpisodios()) {
      console.log('Validación falló en episodios (paso 5)');
      return;
    }
    if (currentStep === 5 && !validateStepFirma()) {
      console.log('Validación falló en firma (paso 6)');
      return;
    }
    
    if (currentStep < steps.length - 1) {
      if (currentStep === 0) saveStep1Data();
      console.log('Avanzando al siguiente paso:', currentStep + 1);
      await showStep(currentStep + 1);
    }
  });
  // Eliminada la función duplicada saveEpisodiosData con selectores incorrectos y lógica conflictiva.

document.getElementById('wizard-form').addEventListener('submit', function(e) {
    e.preventDefault();
    submitForm(e);
  });

  // Lógica para botón Cancelar y modal
  const btnCancelar = document.getElementById('cancel-btn');
  if (btnCancelar) {
    btnCancelar.addEventListener('click', function(e) {
      e.preventDefault();
      const modal = document.getElementById('modalCancelar');
      if (modal) modal.style.display = 'block';
    });
  }
  const modalCancelar = document.getElementById('modalCancelar');
  const modalCancelarSi = document.getElementById('modalCancelarSi');
  const modalCancelarNo = document.getElementById('modalCancelarNo');
  if (modalCancelar && modalCancelarSi && modalCancelarNo) {
    modalCancelarNo.onclick = function() {
      modalCancelar.style.display = 'none';
    };
    modalCancelarSi.onclick = function() {
      modalCancelar.style.display = 'none';
      const overlay = document.getElementById('loadingOverlay');
      if (overlay) overlay.style.display = 'flex';
      setTimeout(() => { window.location.reload(); }, 900);
    };
  }

  // Configurar validación de campos de nombres
  setupNameValidation();
});

// Función para importar títulos desde archivo Excel/CSV
async function importarTitulosDesdeArchivo(file, bloqueId) {
  // Verificar si hay un intervalo de episodios definido
  const bloque = document.getElementById(`bloque-episodios-${bloqueId}`);
  if (!bloque) return;
  
  const episodios = Array.from(bloque.querySelectorAll('.episodio-item')).map(item => item.getAttribute('data-episodio'));
  if (!episodios || episodios.length === 0) {
    alert('Por favor, defina primero el intervalo de episodios antes de importar títulos.');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    let filas = [];
    if (file.name.endsWith('.csv')) {
      const text = e.target.result;
      filas = text.split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line)
        .map(line => line.split(',').map(item => item.trim()));
    } else {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      filas = XLSX.utils.sheet_to_json(sheet, { header: 1 })
        .filter(row => row.some(cell => cell));
    }

    if (filas.length) {
      const titulosValidos = [];
      let titulosInvalidos = [];
      let episodiosFueraDeRango = [];

      filas.forEach(fila => {
        if (!Array.isArray(fila) || fila.length === 0) {
          titulosInvalidos.push(fila);
          return;
        }

        const titulo = fila[0]?.toString().trim();
        if (!titulo) {
          titulosInvalidos.push(fila);
          return;
        }

        titulosValidos.push(titulo);
      });

      if (titulosValidos.length > 0) {
        asignarTitulosAEpisodios(titulosValidos, bloqueId);
      }

      // Mostrar mensaje informativo si es necesario
      let mensajeInfo = '';
      if (titulosInvalidos.length > 0) {
        mensajeInfo += `Se omitieron ${titulosInvalidos.length} títulos con formato inválido.\n`;
      }
      if (mensajeInfo) {
        mensajeInfo += `\nSe importaron correctamente ${titulosValidos.length} títulos.`;
        alert(mensajeInfo);
      }
    } else {
      alert('El archivo no contiene datos válidos. Asegúrese de que el archivo tenga al menos una columna con los títulos.');
    }
  };

  if (file.name.endsWith('.csv')) {
    reader.readAsText(file);
  } else {
    reader.readAsArrayBuffer(file);
  }
}

// Función para mostrar modal de pegar títulos
function mostrarModalPegarTitulos(bloqueId) {
  let modalId = `modalPegarTitulos-${bloqueId}`;
  let textareaId = `textareaPegarTitulos-${bloqueId}`;
  let btnAceptarId = `btnPegarTitulosAceptar-${bloqueId}`;
  let btnCancelarId = `btnPegarTitulosCancelar-${bloqueId}`;
  let modal = document.getElementById(modalId);
  if (!modal) {
    modal = document.createElement('div');
    modal.id = modalId;
    modal.className = 'modal-atn';
    modal.innerHTML = `
      <div class="modal-atn-content">
        <div class="modal-atn-header-green">
          <h3>Pegar títulos de episodios</h3>
        </div>
        <div class="modal-atn-message">
          <p>Pega una lista de títulos, uno por línea. Se asignarán automáticamente a los episodios en orden.</p>
          <textarea id="${textareaId}" rows="10" style="width:100%;margin-top:10px;"></textarea>
        </div>
        <div class="modal-atn-buttons">
          <button type="button" id="${btnAceptarId}" class="modal-btn-lg btn-success">Asignar</button>
          <button type="button" id="${btnCancelarId}" class="modal-btn-lg btn-secondary">Cancelar</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  modal.style.display = 'block';
  document.getElementById(textareaId).value = '';
  document.getElementById(btnAceptarId).onclick = function() {
    const texto = document.getElementById(textareaId).value;
    const titulos = texto.split(/\r?\n/).map(line => line.trim()).filter(line => line);
    asignarTitulosAEpisodios(titulos, bloqueId);
    modal.style.display = 'none';
  };
  document.getElementById(btnCancelarId).onclick = function() {
    modal.style.display = 'none';
  };
}

// Función para asignar títulos a los episodios generados
function asignarTitulosAEpisodios(titulos, bloqueId) {
  const bloque = document.getElementById(`bloque-episodios-${bloqueId}`);
  if (!bloque) return;
  const episodios = bloque.querySelectorAll('.episodio-item');
  episodios.forEach((epi, idx) => {
    const input = epi.querySelector('.titulo-episodio');
    if (input && titulos[idx]) {
      input.value = titulos[idx];
      actualizarPreviewTitulo(bloqueId, input.getAttribute('data-episodio'), titulos[idx]);
    }
  });
}

// === SECCIÓN FIRMA ===
function renderStepFirma(container) {
  // El HTML ya está en el index.html, solo necesitamos configurar los eventos
  setupSignatureFileUpload();
}

function setupSignatureFileUpload() {
  const fileInput = document.getElementById('firma-file');
  const preview = document.getElementById('firma-preview');
  const previewImage = document.getElementById('firma-image');
  const fileName = document.getElementById('firma-filename');
  const fileSize = document.getElementById('firma-filesize');
  
  if (fileInput) {
    fileInput.addEventListener('change', handleSignatureFileSelect);
  }
}

function handleSignatureFileSelect(event) {
  const file = event.target.files[0];
  const preview = document.getElementById('firma-preview');
  const previewImage = document.getElementById('firma-image');
  const fileName = document.getElementById('firma-filename');
  const fileSize = document.getElementById('firma-filesize');
  
  if (file) {
    // Validar tipo de archivo
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      alert('Por favor, seleccione un archivo PNG o JPG válido.');
      event.target.value = '';
      return;
    }
    
    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('El archivo es demasiado grande. El tamaño máximo permitido es 5MB.');
      event.target.value = '';
      return;
    }
    
    // Mostrar vista previa y convertir a base64
    const reader = new FileReader();
    reader.onload = function(e) {
      const base64Data = e.target.result;
      previewImage.src = base64Data;
      fileName.textContent = file.name;
      fileSize.textContent = formatFileSize(file.size);
      preview.style.display = 'block';
      
      // Guardar en formData como base64 para Power Automate
      if (!formData.firma) {
        formData.firma = {};
      }
      // Extraer solo la parte base64 sin el prefijo data URL para Power Automate
      const base64Only = base64Data.split(',')[1]; // Remover 'data:image/...;base64,'
      formData.firma.base64 = base64Only;
      formData.firma.name = file.name;
      formData.firma.size = file.size;
      formData.firma.type = file.type;
      
      console.log('Firma guardada como base64:', {
        name: file.name,
        size: file.size,
        type: file.type,
        base64Length: formData.firma.base64.length
      });
    };
    reader.readAsDataURL(file);
  }
}

function removeSignatureFile() {
  const fileInput = document.getElementById('firma-file');
  const preview = document.getElementById('firma-preview');
  const previewImage = document.getElementById('firma-image');
  
  // Limpiar input y preview
  fileInput.value = '';
  previewImage.src = '';
  preview.style.display = 'none';
  
  // Limpiar formData
  if (formData.firma) {
    delete formData.firma;
  }
  
  console.log('Firma eliminada del formData');
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function validateStepFirma() {
  let isValid = true;
  
  // Validar nombre completo
  const nombreInput = document.getElementById('declarante-nombre');
  if (!nombreInput.value.trim()) {
    showError(nombreInput.parentElement, 'Por favor, ingrese su nombre completo.');
    isValid = false;
  } else {
    clearError(nombreInput.parentElement);
  }
  
  // Validar RUT
  const rutInput = document.getElementById('declarante-rut');
  if (!rutInput.value.trim()) {
    showError(rutInput.parentElement, 'Por favor, ingrese su RUT.');
    isValid = false;
  } else if (!validarRutChileno(rutInput.value)) {
    showError(rutInput.parentElement, 'RUT inválido. Verifique el formato y dígito verificador.');
    isValid = false;
  } else {
    clearError(rutInput.parentElement);
  }
  
  // Validar correo electrónico
  const correoInput = document.getElementById('declarante-correo');
  if (!correoInput.value.trim()) {
    showError(correoInput.parentElement, 'Por favor, ingrese su correo electrónico.');
    isValid = false;
  } else if (!validarCorreo(correoInput.value)) {
    showError(correoInput.parentElement, 'Correo electrónico inválido. Verifique el formato.');
    isValid = false;
  } else {
    clearError(correoInput.parentElement);
  }
  
  // Validar firma
  const fileInput = document.getElementById('firma-file');
  if (!fileInput.files || fileInput.files.length === 0) {
    showError(fileInput.parentElement, 'Por favor, adjunte su firma digital.');
    isValid = false;
  } else {
    clearError(fileInput.parentElement);
  }
  
  // Validar checkbox de declaración de veracidad
  const declaracionCheckbox = document.getElementById('declaracion-veracidad');
  if (!declaracionCheckbox.checked) {
    showError(declaracionCheckbox.parentElement.parentElement, 'Debe aceptar la declaración de veracidad.');
    isValid = false;
  } else {
    clearError(declaracionCheckbox.parentElement.parentElement);
  }
  
  return isValid;
}

// Función para validar RUT chileno
function validarRutChileno(rut) {
  // Limpiar el RUT de puntos y guiones
  const rutLimpio = rut.replace(/[^0-9kK]/g, '');
  
  // Verificar longitud mínima
  if (rutLimpio.length < 2) {
    return false;
  }
  
  // Separar número y dígito verificador
  const numero = rutLimpio.slice(0, -1);
  const dv = rutLimpio.slice(-1).toLowerCase();
  
  // Calcular dígito verificador
  let suma = 0;
  let multiplicador = 2;
  
  for (let i = numero.length - 1; i >= 0; i--) {
    suma += parseInt(numero[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }
  
  const resto = suma % 11;
  const dvCalculado = resto === 0 ? '0' : resto === 1 ? 'k' : (11 - resto).toString();
  
  return dv === dvCalculado;
}

// Función para validar correo electrónico
function validarCorreo(correo) {
  // Expresión regular para validar formato de correo electrónico
  const regexCorreo = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return regexCorreo.test(correo);
}

// Función para formatear RUT mientras se escribe
function formatearRut(rut) {
  // Limpiar el RUT
  const rutLimpio = rut.replace(/[^0-9kK]/g, '');
  
  if (rutLimpio.length <= 1) {
    return rutLimpio;
  }
  
  // Separar número y dígito verificador
  const numero = rutLimpio.slice(0, -1);
  const dv = rutLimpio.slice(-1);
  
  // Formatear con puntos
  let numeroFormateado = '';
  for (let i = 0; i < numero.length; i++) {
    if (i > 0 && (numero.length - i) % 3 === 0) {
      numeroFormateado += '.';
    }
    numeroFormateado += numero[i];
  }
  
  return numeroFormateado + '-' + dv;
}

// Configurar formateo automático del RUT
function setupRutFormatting() {
  const rutInput = document.getElementById('declarante-rut');
  if (rutInput) {
    rutInput.addEventListener('input', function(e) {
      const cursorPosition = e.target.selectionStart;
      const oldValue = e.target.value;
      const newValue = formatearRut(oldValue);
      
      e.target.value = newValue;
      
      // Ajustar posición del cursor
      const diff = newValue.length - oldValue.length;
      e.target.setSelectionRange(cursorPosition + diff, cursorPosition + diff);
    });
    
    rutInput.addEventListener('blur', function(e) {
      if (e.target.value && !validarRutChileno(e.target.value)) {
        showError(e.target.parentElement, 'RUT inválido. Verifique el formato y dígito verificador.');
      } else {
        clearError(e.target.parentElement);
      }
    });
  }
}

// Hacer la función disponible globalmente para el onclick en HTML
window.removeSignatureFile = removeSignatureFile;
