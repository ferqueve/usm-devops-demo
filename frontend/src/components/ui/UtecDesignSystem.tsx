import React from 'react';
import  { UTEC_BRANDING } from '../../constants/branding';
import  { UTEC_COLORS } from '../../constants/colors';

const UtecDesignSystem: React.FC = () => {
  return (
    <div className="p-6 space-y-8 font-utec">
      {/* 🎨 Paleta cromática */}
      <section>
        <h2 className="text-2xl font-black text-utec-black">🎨 Paleta UTEC</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
          <div className="p-4 rounded-2xl shadow bg-utec-primary text-white">
            Cian<br/>#{UTEC_COLORS.PRIMARY.replace('#', '')}
          </div>
          <div className="p-4 rounded-2xl shadow bg-utec-black text-white">
            Negro<br/>#{UTEC_COLORS.BLACK.replace('#', '')}
          </div>
          <div className="p-4 rounded-2xl shadow bg-utec-ti text-white">
            TI<br/>#{UTEC_COLORS.DEPARTMENTS.TI.replace('#', '')}
          </div>
          <div className="p-4 rounded-2xl shadow bg-utec-innovation text-white">
            Innovación<br/>#{UTEC_COLORS.DEPARTMENTS.INNOVATION.replace('#', '')}
          </div>
          <div className="p-4 rounded-2xl shadow bg-utec-mechatronics text-utec-black">
            Mecatrónica<br/>#{UTEC_COLORS.DEPARTMENTS.MECHATRONICS.replace('#', '')}
          </div>
          <div className="p-4 rounded-2xl shadow bg-utec-food text-white">
            Alimentos<br/>#{UTEC_COLORS.DEPARTMENTS.FOOD.replace('#', '')}
          </div>
          <div className="p-4 rounded-2xl shadow bg-utec-sustainability text-white">
            Sostenibilidad<br/>#{UTEC_COLORS.DEPARTMENTS.SUSTAINABILITY.replace('#', '')}
          </div>
        </div>
      </section>

      {/* 🔤 Tipografía */}
      <section>
        <h2 className="text-2xl font-black text-utec-black">🔤 Tipografía UTEC</h2>
        <p className="text-utec-title text-utec-black">
          Titulares (UTEC txt Black → usar Tailwind font-black)
        </p>
        <p className="text-utec-subtitle text-utec-black">
          Subtítulos (UTEC txt Heavy → usar Tailwind font-extrabold)
        </p>
        <p className="text-utec-body text-utec-black">
          Texto (UTEC txt Regular → usar Tailwind font-normal)
        </p>
        <p className="mt-2 text-utec-display text-utec-black">
          Eventual (UTEC Display → MAYÚSCULAS + espaciado)
        </p>
      </section>

      {/* 📐 Reglas de logos */}
      <section>
        <h2 className="text-2xl font-black text-utec-black">📐 Reglas de Logo</h2>
        <ul className="list-disc pl-6 space-y-2 text-utec-body text-utec-black">
          <li>
            Usar <span className="text-utec-primary font-extrabold">
              versión {UTEC_BRANDING.LOGO_VERSIONS.PRIMARY}
            </span> como prioritaria.
          </li>
          <li>
            Respetar área de protección mínima: {UTEC_BRANDING.PROTECTION_AREA.RULE}.
          </li>
          <li>
            Tamaños mínimos: {UTEC_BRANDING.MIN_SIZES.VERTICAL.WIDTH} × {UTEC_BRANDING.MIN_SIZES.VERTICAL.HEIGHT} cm (vertical), 
            {UTEC_BRANDING.MIN_SIZES.HORIZONTAL.WIDTH} cm (horizontal).
          </li>
          <li>
            {UTEC_BRANDING.USAGE_RULES.LIGHT_BACKGROUNDS} → logo en cian/negro. 
            {UTEC_BRANDING.USAGE_RULES.DARK_BACKGROUNDS} → logo en blanco.
          </li>
          <li>{UTEC_BRANDING.USAGE_RULES.NO_ALTERATIONS}.</li>
        </ul>
      </section>

      {/* 🎯 Uso de clases personalizadas */}
      <section>
        <h2 className="text-2xl font-black text-utec-black">🎯 Clases UTEC Personalizadas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="p-4 border border-utec-primary rounded-lg">
            <h3 className="text-utec-subtitle text-utec-primary mb-2">Colores UTEC</h3>
            <p className="text-utec-body text-utec-black">
              Usar: <code className="bg-gray-100 px-2 py-1 rounded">bg-utec-primary</code>, 
              <code className="bg-gray-100 px-2 py-1 rounded">text-utec-black</code>
            </p>
          </div>
          <div className="p-4 border border-utec-innovation rounded-lg">
            <h3 className="text-utec-subtitle text-utec-innovation mb-2">Tipografía UTEC</h3>
            <p className="text-utec-body text-utec-black">
              Usar: <code className="bg-gray-100 px-2 py-1 rounded">text-utec-title</code>, 
              <code className="bg-gray-100 px-2 py-1 rounded">font-utec</code>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default UtecDesignSystem;
