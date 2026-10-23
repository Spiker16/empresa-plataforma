import VehicleAssistant from '@/components/VehicleAssistant'

type VehicleAdvisorSectionProps = {
  assistantEnabled: boolean
}

export default function VehicleAdvisorSection({
  assistantEnabled,
}: VehicleAdvisorSectionProps) {
  return (
    <section
      id="asesoria"
      className="scroll-mt-24 overflow-hidden rounded-3xl border border-black/10 bg-[#f5f3ec] shadow-sm dark:border-white/15 dark:bg-[#151515]"
    >
      <div className="grid lg:grid-cols-[0.8fr_1.2fr]">
        <div className="bg-[#0b0b0b] p-7 text-[#f5f3ec] sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ffd51a]">
            Asesoría personalizada
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight [font-family:var(--font-fraunces)]">
            Encuentra la bicicleta eléctrica ideal para ti
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-[#a3a39b]">
            Nuestro asesor puede orientarte sobre modelos, autonomía, uso diario y presupuesto;
            revisa las opciones reales disponibles y te ayuda a elegir con confianza.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-[#f5f3ec]">
            <li>• Recomendaciones basadas en bicicletas disponibles.</li>
            <li>• Preguntas graduales sobre recorrido, uso y preferencias.</li>
            <li>• Información clara para elegir tu próxima bicicleta eléctrica.</li>
          </ul>
          {!assistantEnabled ? (
            <p className="mt-7 border-t border-white/15 pt-4 text-xs leading-relaxed text-[#ffd51a]">
              El chat está visible, pero todavía no está conectado. Bikefast debe
              iniciar Ollama y configurar el modelo local para responder consultas.
            </p>
          ) : (
            <p className="mt-7 border-t border-white/15 pt-4 text-xs leading-relaxed text-[#ffd51a]">
              Los mensajes e imágenes se procesan en la instancia Ollama configurada por
              Bikefast. Disponibilidad y condiciones comerciales requieren validación del equipo.
            </p>
          )}
        </div>
        <div className="min-w-0 bg-[#f5f3ec] p-4 sm:p-7 dark:bg-[#0a0a0a]">
          <VehicleAssistant variant="embedded" assistantEnabled={assistantEnabled} />
        </div>
      </div>
    </section>
  )
}
