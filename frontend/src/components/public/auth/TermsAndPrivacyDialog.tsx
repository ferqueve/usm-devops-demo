import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TermsAndPrivacyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept?: () => void;
  showAcceptButton?: boolean;
  defaultTab?: "terms" | "privacy";
}

// Contenido de Términos y Condiciones
const TERMS_CONTENT = `Términos y condiciones de uso

Lea atentamente los siguientes Términos y Condiciones de Uso (en adelante e indistintamente Términos) del www.USMsistemaUTEC.com.uy (en adelante e indistintamente Portal) titularidad de UTEC Space Manager (en adelante e indistintamente USM). La utilización del Portal, sus servicios o contenidos implica la aceptación plena y sin reservas de todas las disposiciones contenidas en la versión publicada en el momento en que el usuario acceda al sitio.
En virtud que los Términos pueden ser modificados en cualquier momento por USM, se recomienda al usuario su atenta lectura en cada una de las ocasiones en que se proponga utilizar el sitio. Las nuevas versiones entrarán en vigor a partir del momento de su publicación en el Portal.

1. Objeto del Portal
www.USMsistemaUTEC.com.uy tiene como objetivo facilitar la gestión de la infraestructura física de UTEC de forma ágil, brindando información detallada y herramientas directas para el manejo y gestión de aulas, inventario y reservas de dichas auras, a través del sitio web USM.

2. Condición de usuario
Se considera usuario a los efectos de estos Términos cualquier persona física, jurídica o entidad pública, estatal o no, que ingrese al sitio para recorrer, conocer e informarse o utilice el Portal y su contenido, directamente o a través de una aplicación informática.

3. Condiciones de acceso y utilización del sitio web
La utilización del Portal tiene carácter gratuito para el usuario, quien se obliga a utilizarlo respetando la normativa nacional vigente, las buenas costumbres y el orden público, comprometiéndose en todos los casos a no causar daños a USM, a otro usuario o a terceros.
En su mérito, el usuario se abstendrá de utilizar el Portal, sus contenidos o cualquiera de sus servicios con fines o efectos ilícitos, prohibidos en estos Términos, en normas técnicas o jurídicas, lesivos de los derechos e intereses de USM, de otros usuarios o de terceros, o que de cualquier forma puedan dañar, inutilizar, sobrecargar, deteriorar o impedir la normal utilización del Portal, sus servicios o contenidos, así como de cualquier equipo informático de USM, de otros usuarios o de terceros.
Salvo indicación en contrario, la información contenida en el Portal será considerada de carácter público. Cuando su uso o tratamiento estén sujetos a algún tipo de restricción deberá estarse a lo indicado expresamente en ese caso.

4. Obligaciones de los usuarios
El usuario se obliga a:
No dañar, inutilizar o deteriorar los sistemas informáticos que sustentan el Portal, los de USM, de otros usuarios o de terceros, ni los contenidos incorporados y/o almacenados en estos.
No modificar los referidos sistemas de ninguna manera y, consecuentemente, no utilizar versiones de sistemas modificados con el fin de obtener acceso no autorizado a cualquier contenido y/o servicios del sitio.
No interferir ni interrumpir el acceso y utilización del Portal, servidores o redes conectados a este o incumplir los requisitos, procedimientos y regulaciones de la política de conexión de redes.
USM podrá actuar, por lo medios que considere pertinentes y oportunos, contra cualquier utilización del Portal por usuarios o de terceros que se oponga a estos Términos, infrinja o vulnere derechos de propiedad intelectual , así como cualquier otro derecho de USM, de otros usuarios o de terceros.
USM se reserva la facultad de modificar, en cualquier momento y sin previo aviso, la presentación, configuración, contenidos y servicios del Portal www.USMsistemaUTEC.com.uy, pudiendo interrumpir, desactivar y/o cancelar cualquiera de los contenidos y/o servicios presentados, integrados o incorporados a este, sin expresión de causa y sin responsabilidad.

5. Propiedad Intelectual
Todas las marcas, nombres comerciales o signos distintivos de cualquier clase que eventualmente aparezcan en este sitio web son propiedad de USM o de terceros, sin que pueda entenderse que el uso o acceso al sitio atribuya al usuario derecho alguno sobre las citadas marcas, nombres comerciales o signos distintivos de cualquier clase.

6. Responsabilidad del titular del Portal
La veracidad, integridad y actualidad de los contenidos publicados en el Portal son de exclusiva responsabilidad de quien los proporciona.
Presidencia de la República se exonera de cualquier responsabilidad por los daños y perjuicios de toda y cualquier naturaleza que puedan deberse a la falta de disponibilidad o continuidad del funcionamiento del Portal, servicios o contenidos, en particular aunque no de modo exclusivo, a su fiabilidad, a los fallos en el acceso a las distintas páginas web o a aquellas desde las que se prestan los servicios o contenidos.
Se procurará anunciar las interrupciones programadas.

7. Enlaces a terceros sitios o portales.
El Portal puede contener dispositivos técnicos de enlace (tales como links, banners, botones) que permiten acceder a sitios web pertenecientes a terceros, con el único objeto de facilitar a los usuarios la búsqueda y acceso a otros sitios y/o contenidos disponibles en Internet.
Los enlaces a otros sitios web, servicios o contenidos, no implican aprobación, en forma alguna, por lo que USM en su mérito, se deslinda toda responsabilidad contractual, legal o de cualquier otra índole que pudiera derivarse, a modo de ejemplo, por la precisión y uso de los servicios y/o contenidos enlazados.

8. Duración y terminación
El Portal, sus servicios y contenidos tienen una duración indeterminada. Sin perjuicio de ello, podrá ser suspendido temporal o definitivamente, total o parcialmente, por USM sin expresión de causa y sin responsabilidad, cuando entienda que no están dadas las condiciones para su continuidad.

9. Protección de datos personales
Los datos personales proporcionados en el marco del uso del Portal serán tratados por Presidencia de la República según lo establecido en la Ley Nº 18.331 del 11 de agosto de 2008 y su decreto reglamentario Nº 414/2009 del 31 de agosto de 2009.
USM podrá utilizar cookies cuando se utilice el Portal. No obstante, el usuario podrá configurar su navegador para ser avisado de la recepción de las cookies e impedir en caso de considerarlo adecuado, su instalación en el disco duro.

10. Retiro y suspensión de los servicios
USM podrá retirar o suspender, en cualquier momento y sin necesidad de previo aviso, la prestación de los servicios del Portal a aquellos usuarios que incumplan lo establecido en los presentes Términos.

11. Legislación aplicable y jurisdicción competente
Toda controversia derivada de la aplicación e interpretación de los presentes Términos de Uso, será competencia de los jueces y tribunales ordinarios de la ciudad de Montevideo, República Oriental del Uruguay.
La ley aplicable será la de la República Oriental del Uruguay.

12. Procedimiento para denunciar contenidos
En caso de contenido erróneo, incompleto, desactualizado, que vulnere derechos de propiedad intelectual o ante cualquier otra situación irregular de hecho o de derecho, el usuario podrá comunicarse a través del correo electrónico: usm.utec.uy@gmail.com.

13. Contacto
Por cualquier, queja, sugerencia o propuesta de colaboración, escríbanos a usm.utec.uy@gmail.com.`;

// Contenido de Política de Privacidad
const PRIVACY_CONTENT = `Política de Privacidad

La presente Política de Privacidad para la Protección de Datos Personales describe el tratamiento que UTEC Space Manager (en adelante USM) brinda a los datos personales que recopila de los usuarios de su dominio www.USMsistemaUTEC.com.uy (en adelante sitio web).

Al registrarse y utilizar los servicios de USM, usted consiente y acepta que el tratamiento de sus datos personales se realice de acuerdo con lo informado en este documento y con lo dispuesto en la Ley Nº 18.331, de 11 de agosto de 2008 y el Decreto Nº 414/009, de 21 de agosto de 2009.

1. Tratamiento de datos
Los datos personales recabados y accedidos para el registro en nuestra base de datos serán tratados por USM con la finalidad de contactar con el usuario y brindar la información solicitada
Los datos personales almacenados en el sistema se encuentran en la base de datos de USM *

* se parte de la hipótesis que la base de datos va a estar inscripta en la URCDP cuando y si UTEC decide implementar el proyecto. Por lo que en la actualidad, la base de datos del proyecto no se encuentra inscripta ante la URCDP.

2. Cookies
USM utiliza cookies. Usted puede configurar su navegador para ser avisado de la recepción de las cookies o impedir su instalación.

3. Ejercicio de los derechos
Usted podrá ejercer sus derechos de acceso, rectificación, actualización, inclusión y supresión, ante la Unidad Reguladora y de Control de Datos Personalesa través del formulario de "Contacto" de la página web de URCDP, enviando un correo electrónico a infourcdp@datospersonales.gub.uy o personalmente dirigiéndose a Liniers 1324 Piso 4°.

4. Enlaces
La presente Política de Privacidad es de aplicación exclusiva para sitios, portales, servicios o contenidos de USM y no se extiende a los enlaces hacía otros sitios, portales, servicios o contenidos de distinta titularidad.

5. Ley aplicable y jurisdicción competente
Esta Política se encuentra regida en todas sus cláusulas y sin excepción por las leyes de la República Oriental del Uruguay.
Cualquier controversia derivada de este documento relativa a su existencia, validez, interpretación, alcance o cumplimiento será sometida a los Tribunales ordinarios de la ciudad de Montevideo, Uruguay.`;

export function TermsAndPrivacyDialog({
  open,
  onOpenChange,
  onAccept,
  showAcceptButton = false,
  defaultTab = "terms",
}: Readonly<TermsAndPrivacyDialogProps>) {
  const [activeTab, setActiveTab] = useState<"terms" | "privacy">(defaultTab);
  
  // Actualizar tab cuando cambia defaultTab o se abre el diálogo
  useEffect(() => {
    if (open && defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [open, defaultTab]);

  const handleAccept = () => {
    if (onAccept) {
      onAccept();
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-xl">
            {showAcceptButton
              ? "Términos y Condiciones / Política de Privacidad"
              : "Términos y Condiciones / Política de Privacidad"}
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "terms" | "privacy")}
          className="flex-1 flex flex-col min-h-0 px-6 pb-6"
        >
          <TabsList className="grid w-full grid-cols-2 h-12 mb-4">
            <TabsTrigger value="terms" className="text-base font-medium px-4 py-2">
              Términos y Condiciones
            </TabsTrigger>
            <TabsTrigger value="privacy" className="text-base font-medium px-4 py-2">
              Política de Privacidad
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="terms"
            className="flex-1 min-h-0 mt-0 data-[state=active]:flex data-[state=active]:flex-col overflow-hidden"
          >
            <ScrollArea className="h-[calc(90vh-250px)] min-h-[400px]">
              <div className="whitespace-pre-line text-sm leading-relaxed pr-4 pb-4">
                {TERMS_CONTENT}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent
            value="privacy"
            className="flex-1 min-h-0 mt-0 data-[state=active]:flex data-[state=active]:flex-col overflow-hidden"
          >
            <ScrollArea className="h-[calc(90vh-250px)] min-h-[400px]">
              <div className="whitespace-pre-line text-sm leading-relaxed pr-4 pb-4">
                {PRIVACY_CONTENT}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {showAcceptButton && (
          <div className="flex justify-end gap-2 px-6 pb-6 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAccept}>Aceptar</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

