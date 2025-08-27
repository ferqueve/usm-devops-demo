import React from 'react';
import { UtecDesignSystem } from '../components/ui';

const IdentidadDigital: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 font-utec">
      {/* Header de la página */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-utec-title text-utec-primary">
                Identidad Digital UTEC
              </h1>
              <p className="text-utec-body text-utec-black mt-2">
                Sistema de diseño y guía de marca institucional
              </p>
            </div>
            <div className="text-right">
              <div className="text-utec-display text-utec-primary">
                SISTEMA DE DISEÑO
              </div>
              <div className="text-utec-body text-utec-black">
                Versión 1.0
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="container mx-auto px-4 py-8">
        {/* Introducción */}
        <section className="mb-12">
          <div className="bg-white rounded-lg shadow-lg p-8 border-l-4 border-utec-primary">
            <h2 className="text-utec-subtitle text-utec-black mb-4">
              🎯 Propósito de esta guía
            </h2>
            <p className="text-utec-body text-utec-black mb-4">
              Esta página contiene la guía completa de identidad visual de UTEC para aplicaciones digitales. 
              Aquí encontrarás todos los elementos necesarios para mantener la consistencia de marca en el 
              desarrollo de interfaces de usuario.
            </p>
            <p className="text-utec-body text-utec-black">
              <strong>Nota:</strong> Esta es una página de referencia interna para desarrolladores. 
              No está conectada a la navegación principal de la aplicación.
            </p>
          </div>
        </section>

        {/* Sistema de diseño UTEC */}
        <UtecDesignSystem />

        {/* Información adicional */}
        <section className="mt-12">
          <div className="bg-gradient-to-r from-utec-primary to-utec-ti rounded-lg shadow-lg p-8 text-white">
            <h2 className="text-utec-subtitle mb-4">
              📚 Recursos adicionales
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-utec-body font-semibold mb-2">Archivos de marca</h3>
                <ul className="text-utec-body space-y-1">
                  <li>• Logo UTEC (SVG, PNG)</li>
                  <li>• Paleta de colores oficial</li>
                  <li>• Tipografías institucionales</li>
                  <li>• Guía de uso del logo</li>
                </ul>
              </div>
              <div>
                <h3 className="text-utec-body font-semibold mb-2">Contacto</h3>
                <p className="text-utec-body">
                  Para consultas sobre identidad visual:<br/>
                  <span className="font-semibold">comunicaciones@utec.edu.pe</span>
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-utec-black text-white py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-utec-body">
            © 2024 Universidad de Ingeniería y Tecnología - UTEC
          </p>
          <p className="text-utec-display text-utec-primary mt-2">
            IDENTIDAD DIGITAL INSTITUCIONAL
          </p>
        </div>
      </footer>
    </div>
  );
};

export default IdentidadDigital;
