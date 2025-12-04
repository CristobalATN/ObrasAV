/**
 * Script para generar datos ofuscados
 * Este script convierte socios.json en un formato ofuscado para dificultar su análisis.
 * Actualizado para manejar correctamente caracteres UTF-8 (tildes, ñ, etc.)
 */

const fs = require('fs');
const path = require('path');

// Clave de encriptación
const ENCRYPTION_KEY = '87fNo4mck!Ybz2J';

/**
 * Encriptación simple XOR + Base64 (UTF-8 safe)
 */
function simpleEncrypt(text, key = ENCRYPTION_KEY) {
  if (!text) return '';
  try {
    // 1. Convertir texto a bytes UTF-8
    const textBytes = Buffer.from(text, 'utf8');
    const keyBytes = Buffer.from(key, 'utf8');
    
    // 2. XOR byte a byte
    const output = Buffer.alloc(textBytes.length);
    for (let i = 0; i < textBytes.length; i++) {
      output[i] = textBytes[i] ^ keyBytes[i % keyBytes.length];
    }
    
    // 3. Convertir a Base64
    return output.toString('base64');
  } catch (error) {
    console.error('Error en encriptación:', error);
    return text;
  }
}

// Función principal
function generarDatosOfuscados() {
  try {
    // 1. Leer datos originales
    const sociosPath = path.join(__dirname, 'secure-data', 'socios.json');
    if (!fs.existsSync(sociosPath)) {
      console.error('Error: No se encontró secure-data/socios.json');
      return;
    }
    
    const sociosOriginales = JSON.parse(fs.readFileSync(sociosPath, 'utf8'));
    console.log(`Procesando ${sociosOriginales.length} registros...`);
    
    // 2. Transformar y ofuscar
    // Usamos claves cortas: "d1" para nombre, "d2" para correo
    const datosOfuscados = sociosOriginales.map(socio => {
      return {
        "d1": simpleEncrypt(socio["Nombre completo"]),
        "d2": simpleEncrypt(socio["Correo electrónico"])
      };
    });
    
    // 3. Guardar con nombre genérico
    const outputPath = path.join(__dirname, 'assets', 'core-data.json');
    fs.writeFileSync(outputPath, JSON.stringify(datosOfuscados, null, 2));
    
    console.log('✅ Archivo ofuscado generado:', outputPath);
    console.log('Formato de ejemplo (UTF-8 safe):');
    console.log(JSON.stringify(datosOfuscados[0], null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

generarDatosOfuscados();
