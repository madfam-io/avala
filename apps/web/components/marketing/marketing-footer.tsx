import Link from "next/link";
import { Linkedin, Twitter } from "lucide-react";

const footerLinks = {
  producto: [
    { label: "Avala Learn", href: "/producto/learn" },
    { label: "Avala Assess", href: "/producto/assess" },
    { label: "Avala Comply", href: "/producto/comply" },
    { label: "Avala Badges", href: "/producto/badges" },
    { label: "Avala Connect", href: "/producto/connect" },
    { label: "Precios", href: "/precios" },
  ],
  soluciones: [
    { label: "Para Empresas", href: "/soluciones/empresas" },
    { label: "Para ECE/OC", href: "/soluciones/ece" },
    { label: "Para CCAP", href: "/soluciones/ccap" },
  ],
  recursos: [
    { label: "Blog", href: "/blog" },
    { label: "Guías DC-3", href: "/recursos/guias-dc3" },
    { label: "Explorar EC", href: "/explorar" },
    { label: "API Docs", href: "/docs/api" },
    { label: "Status", href: "/status" },
  ],
  empresa: [
    { label: "Nosotros", href: "/nosotros" },
    { label: "Contacto", href: "/contacto" },
    { label: "Carreras", href: "/carreras" },
  ],
};

export function MarketingFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container py-12 md:py-16">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1 mb-4 lg:mb-0">
            <Link href="/" className="inline-block">
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                AVALA
              </span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground max-w-xs">
              Plataforma de capacitación alineada a EC/CONOCER con cumplimiento
              DC-3 automático y credenciales verificables.
            </p>
            <div className="flex space-x-4 mt-4">
              <a
                href="https://linkedin.com/company/avala"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Linkedin className="h-5 w-5" />
                <span className="sr-only">LinkedIn</span>
              </a>
              <a
                href="https://twitter.com/avala_mx"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </a>
            </div>
          </div>

          {/* Producto */}
          <div>
            <h3 className="font-semibold mb-3">Producto</h3>
            <ul className="space-y-2">
              {footerLinks.producto.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Soluciones */}
          <div>
            <h3 className="font-semibold mb-3">Soluciones</h3>
            <ul className="space-y-2">
              {footerLinks.soluciones.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Recursos */}
          <div>
            <h3 className="font-semibold mb-3">Recursos</h3>
            <ul className="space-y-2">
              {footerLinks.recursos.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Empresa */}
          <div>
            <h3 className="font-semibold mb-3">Empresa</h3>
            <ul className="space-y-2">
              {footerLinks.empresa.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Innovaciones MADFAM S.A.S. de C.V.
            Todos los derechos reservados.
          </p>
          <div className="flex gap-6 text-sm">
            <Link
              href="/privacidad"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacidad
            </Link>
            <Link
              href="/terminos"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Términos
            </Link>
            <Link
              href="/cookies"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
