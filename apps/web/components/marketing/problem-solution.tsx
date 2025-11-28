import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";

const comparisons = [
  {
    problem: "DC-3 manual en Excel, errores frecuentes",
    solution: "Generación automática, cero errores",
  },
  {
    problem: "Evidencias dispersas, auditorías estresantes",
    solution: "Portafolio centralizado, hash verificable",
  },
  {
    problem: "Cumplimiento SIRCE a última hora",
    solution: "Exports listos, siempre al día",
  },
  {
    problem: "Certificados en papel, fáciles de falsificar",
    solution: "Credenciales digitales verificables",
  },
  {
    problem: "Sin visibilidad del progreso por competencia",
    solution: "Dashboard de cobertura por criterio EC",
  },
];

export function ProblemSolution() {
  return (
    <section className="py-20 md:py-28">
      <div className="container">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            De la frustración al cumplimiento automático
          </h2>
          <p className="text-lg text-muted-foreground">
            Transforma la manera en que gestionas la capacitación y el
            cumplimiento laboral de tu organización.
          </p>
        </div>

        {/* Comparison Grid */}
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 md:gap-4">
            {/* Problems Column */}
            <div className="space-y-4">
              <div className="text-center md:text-left mb-6">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 text-sm font-medium">
                  <XCircle className="w-4 h-4 mr-1.5" />
                  Sin AVALA
                </span>
              </div>
              {comparisons.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-4 rounded-lg bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50"
                >
                  <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">
                    {item.problem}
                  </span>
                </div>
              ))}
            </div>

            {/* Arrow (desktop only) */}
            <div className="hidden md:flex items-center justify-center absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                <ArrowRight className="w-6 h-6 text-primary-foreground" />
              </div>
            </div>

            {/* Solutions Column */}
            <div className="space-y-4">
              <div className="text-center md:text-left mb-6">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  Con AVALA
                </span>
              </div>
              {comparisons.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-4 rounded-lg bg-green-50/50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/50"
                >
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-sm">{item.solution}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
