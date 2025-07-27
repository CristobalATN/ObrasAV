// Paleta institucional
const COLOR_VERDE = '#097137';
const COLOR_GRIS = '#575656';

const steps = [
  {
    title: 'Datos Generales de la Obra',
    render: renderStep1
  },
  {
    title: 'Exhibición Internacional',
    render: renderStep2
  },
  {
    title: 'Participaciones',
    render: renderStep3
  }
  // Aquí se pueden agregar más pasos en el futuro
];

let currentStep = 0;
let formData = {};
let generosData = [];
let rolesData = [];

// Cargar datos de los JSON
const fetchJSON = async (file) => {
  const res = await fetch(`assets/${file}`);
  return res.json();
};

// Renderizar barra de progreso
function renderProgress() {
  const progress = document.getElementById('wizard-progress');
  progress.innerHTML = '';
  steps.forEach((step, idx) => {
    const indicator = document.createElement('div');
    indicator.className = 'wizard-step-indicator' + (idx === currentStep ? ' active' : '');
    indicator.innerHTML = `
      <div class="wizard-circle">${idx + 1}</div>
      <div class="wizard-title">${step.title}</div>
    `;
    progress.appendChild(indicator);
  });
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
    
    <div id="exhibiciones-container">
      <!-- Las exhibiciones se agregarán aquí dinámicamente -->
    </div>
    
    <button type="button" id="agregar-exhibicion" class="btn btn-secondary" style="margin-top: 20px;">
      + Agregar Exhibición
    </button>
  `;
  
  // Agregar la primera exhibición vacía
  agregarExhibicion();
  
  // Manejador para agregar más exhibiciones
  document.getElementById('agregar-exhibicion').addEventListener('click', agregarExhibicion);
  
  // Inicializar Select2 para los dropdowns
  if (window.$ && window.$.fn.select2) {
    inicializarSelect2();
  }
}

function agregarExhibicion() {
  const container = document.getElementById('exhibiciones-container');
  const exhibicionId = Date.now(); // ID único para cada exhibición
  
  const exhibicionHTML = `
    <div class="exhibicion-item" id="exhibicion-${exhibicionId}" style="margin-bottom: 30px; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background: #f9f9f9;">
      <div class="form-group">
        <label for="otro-titulo-${exhibicionId}">Otro título</label>
        <input type="text" id="otro-titulo-${exhibicionId}" name="exhibiciones[${exhibicionId}][otro_titulo]" placeholder="Ingrese el título con el que se exhibió">
      </div>
      
      <div class="form-row">
        <div class="form-group" style="flex: 1; margin-right: 15px;">
          <label for="idioma-exhibicion-${exhibicionId}">Idioma</label>
          <select id="idioma-exhibicion-${exhibicionId}" name="exhibiciones[${exhibicionId}][idioma]" class="idioma-select">
            <option value="">Seleccione...</option>
          </select>
        </div>
        
        <div class="form-group" style="flex: 1;">
          <label for="pais-exhibicion-${exhibicionId}">País de exhibición</label>
          <select id="pais-exhibicion-${exhibicionId}" name="exhibiciones[${exhibicionId}][pais]" class="pais-select">
            <option value="">Seleccione...</option>
          </select>
        </div>
      </div>
      
      <div class="form-group">
        <label for="canal-${exhibicionId}">Canal / Plataforma / Sala</label>
        <input type="text" id="canal-${exhibicionId}" name="exhibiciones[${exhibicionId}][canal]" placeholder="Ingrese el nombre del canal, plataforma o sala">
      </div>
      
      <button type="button" class="btn-eliminar" data-exhibicion-id="${exhibicionId}" style="color: #dc3545; background: none; border: none; cursor: pointer; padding: 5px 0; display: flex; align-items: center;">
        <span style="color: #dc3545; margin-right: 5px;">×</span> Eliminar
      </button>
    </div>
  `;
  
  // Insertar la nueva exhibición
  container.insertAdjacentHTML('beforeend', exhibicionHTML);
  
  // Inicializar Select2 para los nuevos selects
  if (window.$ && window.$.fn.select2) {
    inicializarSelect2();
  }
  
  // Agregar manejador de evento para el botón de eliminar
  const btnEliminar = document.querySelector(`[data-exhibicion-id="${exhibicionId}"]`);
  if (btnEliminar) {
    btnEliminar.addEventListener('click', function() {
      const exhibicion = document.getElementById(`exhibicion-${exhibicionId}`);
      if (exhibicion) {
        exhibicion.remove();
      }
    });
  }
}

async function inicializarSelect2() {
  // Cargar datos necesarios
  const [paises, idiomas] = await Promise.all([
    fetchJSON('paises.json'),
    fetchJSON('idioma.json')
  ]);
  
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
        select.append(new Option(pais.text, pais.value));
      });
      
      select.select2({
        placeholder: 'Seleccione...',
        width: '100%',
        allowClear: true
      });
    }
  });
}

// Renderizar la sección de participaciones
async function renderStep3(container) {
  rolesData = await fetchJSON('rol.json');
  container.innerHTML = `
    <div id="participaciones-container"></div>
    <button type="button" id="agregar-participacion" class="btn btn-secondary" style="margin-top: 20px;">
      + Agregar Participación
    </button>
  `;

  agregarParticipacion();

  document.getElementById('agregar-participacion').addEventListener('click', agregarParticipacion);

  if (window.$ && window.$.fn.select2) {
    inicializarSelect2Participaciones();
  }
}

function agregarParticipacion(data = {}) {
  const container = document.getElementById('participaciones-container');
  const id = Date.now() + Math.floor(Math.random() * 1000);

  const opcionesRol = rolesData.map(r => `<option value="${r.Rol}">${r.Rol}</option>`).join('');

  const html = `
    <div class="participacion-item" id="participacion-${id}" style="margin-bottom:30px; padding:20px; border:1px solid #e0e0e0; border-radius:8px; background:#f9f9f9;">
      <div class="form-row">
        <div class="form-group" style="flex:1; margin-right:15px;">
          <label for="rol-${id}">Rol</label>
          <select id="rol-${id}" name="participaciones[${id}][rol]" class="rol-select">
            <option value="">Seleccione...</option>
            ${opcionesRol}
          </select>
        </div>
        <div class="form-group" style="flex:1; margin-right:15px;">
          <label for="autor-${id}">Autor</label>
          <select id="autor-${id}" name="participaciones[${id}][autor]" class="autor-select">
            <option value="">Seleccione...</option>
          </select>
        </div>
        <div class="form-group" style="flex:1;">
          <label for="porcentaje-${id}">Participación (%)</label>
          <input type="number" step="0.01" min="0" max="100" id="porcentaje-${id}" name="participaciones[${id}][porcentaje]" placeholder="0.0">
        </div>
      </div>
      <button type="button" class="btn-eliminar" data-participacion-id="${id}" style="color: #dc3545; background: none; border: none; cursor: pointer; padding: 5px 0; display: flex; align-items: center;">
        <span style="color: #dc3545; margin-right: 5px;">\u00d7</span> Eliminar
      </button>
    </div>
  `;

  container.insertAdjacentHTML('beforeend', html);

  const item = document.getElementById(`participacion-${id}`);
  if (data.rol) item.querySelector(`#rol-${id}`).value = data.rol;
  if (data.autor) item.querySelector(`#autor-${id}`).value = data.autor;
  if (data.porcentaje) item.querySelector(`#porcentaje-${id}`).value = data.porcentaje;

  if (window.$ && window.$.fn.select2) {
    inicializarSelect2Participaciones();
  }

  const btnEliminar = document.querySelector(`[data-participacion-id="${id}"]`);
  if (btnEliminar) {
    btnEliminar.addEventListener('click', () => {
      const elemento = document.getElementById(`participacion-${id}`);
      if (elemento) elemento.remove();
    });
  }
}

function inicializarSelect2Participaciones() {
  $('.rol-select').each(function() {
    if (!$(this).hasClass('select2-hidden-accessible')) {
      $(this).select2({ placeholder: 'Seleccione...', width: '100%', allowClear: true });
    }
  });
  $('.autor-select').each(function() {
    if (!$(this).hasClass('select2-hidden-accessible')) {
      $(this).select2({ placeholder: 'Seleccione...', width: '100%', allowClear: true });
    }
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
      return '<option value="">Seleccione...</option>';
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
      <select id="genero" name="genero" required>
        ${renderGeneroOptions('')}
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
        ${paises.map(p => `<option value="${p.value}">${p.text}</option>`).join('')}
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
  if (!formData) formData = { step1: {}, step2: { exhibiciones: [] }, step3: { participaciones: [] } };
  if (!formData.step2) formData.step2 = { exhibiciones: [] };
  
  // Inicializar array de exhibiciones
  formData.step2.exhibiciones = [];
  
  // Obtener todos los contenedores de exhibición
  const exhibiciones = document.querySelectorAll('.exhibicion-item');
  
  exhibiciones.forEach((exhibicion, index) => {
    const datosExhibicion = {
      id: exhibicion.id.replace('exhibicion-', ''),
      otro_titulo: exhibicion.querySelector('input[name$="[otro_titulo]"]')?.value || '',
      idioma: exhibicion.querySelector('select[name$="[idioma]"]')?.value || '',
      pais: exhibicion.querySelector('select[name$="[pais]"]')?.value || '',
      canal: exhibicion.querySelector('input[name$="[canal]"]')?.value || ''
    };
    
    formData.step2.exhibiciones.push(datosExhibicion);
  });
  
  console.log('Datos del paso 2 guardados:', formData.step2);
  return true;
}

function saveStep3Data() {
  if (!formData) formData = { step1: {}, step2: { exhibiciones: [] }, step3: { participaciones: [] } };
  if (!formData.step3) formData.step3 = { participaciones: [] };

  formData.step3.participaciones = [];

  const items = document.querySelectorAll('.participacion-item');

  items.forEach(item => {
    const datos = {
      id: item.id.replace('participacion-', ''),
      rol: item.querySelector('select[name$="[rol]"]')?.value || '',
      autor: item.querySelector('select[name$="[autor]"]')?.value || '',
      porcentaje: parseFloat(item.querySelector('input[name$="[porcentaje]"]')?.value || '0')
    };
    formData.step3.participaciones.push(datos);
  });

  console.log('Datos del paso 3 guardados:', formData.step3);
  return true;
}

// Función para guardar los datos del paso actual
function saveCurrentStepData() {
  if (currentStep === 0) {
    saveStep1Data();
  } else if (currentStep === 1) {
    saveStep2Data();
  } else if (currentStep === 2) {
    saveStep3Data();
  }
  // Agregar más pasos según sea necesario
}

// Función para restaurar los datos de un paso
function restoreStepData(stepIndex, container) {
  if (stepIndex === 0 && formData.step1) {
    restoreStep1Data(container);
  } else if (stepIndex === 1 && formData.step2) {
    restoreStep2Data(container);
  } else if (stepIndex === 2 && formData.step3) {
    restoreStep3Data(container);
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
  
  // Renderizar la barra de progreso
  renderProgress();
  
  // Renderizar el paso si es necesario
  if (steps[idx]) {
    console.log('Renderizando paso:', idx + 1);
    try {
      await steps[idx].render(nextStepElement);
      // Restaurar datos guardados para este paso
      restoreStepData(idx, nextStepElement);
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

function validateStep3() {
  let isValid = true;

  const items = document.querySelectorAll('.participacion-item');
  const acumulados = {};

  if (items.length === 0) {
    alert('Agregue al menos una participación');
    return false;
  }

  document.querySelectorAll('.error-message').forEach(el => el.remove());
  document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));

  items.forEach(item => {
    const rolSelect = item.querySelector('select[name$="[rol]"]');
    const porcInput = item.querySelector('input[name$="[porcentaje]"]');

    const rol = rolSelect ? rolSelect.value : '';
    const porc = parseFloat(porcInput ? porcInput.value : '');

    if (!rol) {
      showError(rolSelect, 'Seleccione el rol');
      isValid = false;
    } else {
      clearError(rolSelect);
    }

    if (isNaN(porc)) {
      showError(porcInput, 'Ingrese la participación');
      isValid = false;
    } else if (porc < 0 || porc > 100) {
      showError(porcInput, 'Porcentaje inválido');
      isValid = false;
    } else {
      clearError(porcInput);
    }

    if (rol) {
      acumulados[rol] = (acumulados[rol] || 0) + (isNaN(porc) ? 0 : porc);
    }
  });

  Object.entries(acumulados).forEach(([rol, total]) => {
    if (total > 100) {
      alert(`La suma de porcentajes para el rol "${rol}" supera el 100%`);
      isValid = false;
    }
  });

  return isValid;
}

// Mostrar mensajes
function showMessage(msg, error = false) {
  const el = document.getElementById('form-message');
  el.textContent = msg;
  el.style.color = error ? '#c0392b' : COLOR_VERDE;
  setTimeout(() => { el.textContent = ''; }, 3500);
}

// Inicializar formData si no existe
if (!window.formData) {
  window.formData = {
    step1: {
      titulo: '',
      formato: '',
      genero: '',
      productora: '',
      paises: [],
      anio: '',
      idioma: '',
      actores: '',
      directores: '',
      guionistas: ''
    },
    step2: { exhibiciones: [] },
    step3: { participaciones: [] }
  };
}

// Guardar datos del paso 1
function saveStep1Data() {
  // Asegurarse de que formData.step1 existe
  if (!formData) formData = { step1: {}, step2: { exhibiciones: [] }, step3: { participaciones: [] } };
  if (!formData.step1) formData.step1 = {};
  
  // Obtener referencias a los elementos del formulario
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
    guionistas: document.getElementById('guionistas')
  };
  
  // Guardar cada campo si existe
  Object.entries(campos).forEach(([key, element]) => {
    if (!element) return;
    
    if (key === 'paises' && element.multiple) {
      // Manejar selección múltiple
      formData.step1[key] = Array.from(element.selectedOptions).map(opt => opt.value);
    } else if (element.type === 'checkbox' || element.type === 'radio') {
      // Manejar checkboxes y radios
      formData.step1[key] = element.checked;
    } else {
      // Manejar inputs de texto y selects normales
      formData.step1[key] = element.value.trim ? element.value.trim() : element.value;
    }
  });
  
  console.log('Datos del paso 1 guardados:', formData.step1);
  return true;
}

// Restaurar datos del paso 1
function restoreStep1Data(container) {
  if (!formData.step1) return;
  
  const fields = {
    'titulo': 'value',
    'formato': 'value',
    'genero': 'value',
    'productora': 'value',
    'paises': 'selectMultiple',
    'anio': 'value',
    'idioma': 'value',
    'actores': 'value',
    'directores': 'value',
    'guionistas': 'value'
  };
  
  Object.entries(fields).forEach(([id, type]) => {
    const element = document.getElementById(id);
    if (!element || !formData.step1[id]) return;
    
    if (type === 'selectMultiple' && Array.isArray(formData.step1[id])) {
      // Para selects múltiples
      const values = formData.step1[id];
      Array.from(element.options).forEach(option => {
        option.selected = values.includes(option.value);
      });
      // Disparar evento de cambio para Select2
      $(element).trigger('change');
    } else if (element.type === 'checkbox') {
      element.checked = formData.step1[id];
    } else {
      element.value = formData.step1[id];
      // Disparar evento de entrada para Select2
      if ($(element).hasClass('select2-hidden-accessible')) {
        $(element).trigger('change');
      }
    }
  });
  
  console.log('Datos del paso 1 restaurados');
}

function restoreStep3Data(container) {
  if (!formData.step3) return;

  const cont = document.getElementById('participaciones-container');
  if (!cont) return;
  cont.innerHTML = '';

  formData.step3.participaciones.forEach(p => {
    agregarParticipacion(p);
  });
}

// Envío simulado
async function submitForm(e) {
  e.preventDefault();
  if (!validateStep1()) return;
  if (!validateStep3()) return;
  saveStep1Data();
  saveStep3Data();
  document.getElementById('submit-btn').disabled = true;
  showMessage('Enviando declaración...');
  try {
    await new Promise(r => setTimeout(r, 1200)); // Simula espera
    await fetch('https://powerautomate.url-placeholder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    showMessage('¡Declaración enviada correctamente!');
    document.getElementById('wizard-form').reset();
  } catch {
    showMessage('Error al enviar. Intente nuevamente.', true);
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

// Inicialización
window.addEventListener('DOMContentLoaded', async () => {
  console.log('Inicializando formulario...');
  
  // Configurar validación en tiempo real
  setupRealTimeValidation();
  
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
    if (currentStep === 0 && !validateStep1()) return;
    if (currentStep === 1 && !validateStep2()) return;
    if (currentStep < steps.length - 1) {
      if (currentStep === 0) saveStep1Data();
      await showStep(currentStep + 1);
    }
  });
  document.getElementById('wizard-form').addEventListener('submit', submitForm);
});