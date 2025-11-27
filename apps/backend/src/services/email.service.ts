/**
 * Email Service
 *
 * Handles email notifications for leads and other system events.
 * Uses a pluggable transport system (console in dev, real email in prod).
 */

import type { Lead } from "@prisma/client";

// Email configuration from environment
const EMAIL_CONFIG = {
  enabled: process.env.EMAIL_ENABLED === "true",
  from: process.env.EMAIL_FROM || "noreply@avala.mx",
  notifyTo: process.env.LEAD_NOTIFY_EMAIL || "ventas@avala.mx",
  provider: process.env.EMAIL_PROVIDER || "console", // 'console' | 'resend' | 'sendgrid'
  apiKey: process.env.EMAIL_API_KEY || "",
};

interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email using the configured provider
 */
async function sendEmail(message: EmailMessage): Promise<boolean> {
  const { provider, apiKey, from } = EMAIL_CONFIG;

  // Console provider (for development)
  if (provider === "console" || !EMAIL_CONFIG.enabled) {
    console.log("📧 Email (dev mode):", {
      from,
      to: message.to,
      subject: message.subject,
      preview: message.text?.substring(0, 100) || "HTML email",
    });
    return true;
  }

  // Resend provider
  if (provider === "resend" && apiKey) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: message.to,
          subject: message.subject,
          html: message.html,
          text: message.text,
        }),
      });

      if (!response.ok) {
        console.error("Resend API error:", await response.text());
        return false;
      }

      return true;
    } catch (error) {
      console.error("Resend error:", error);
      return false;
    }
  }

  // SendGrid provider
  if (provider === "sendgrid" && apiKey) {
    try {
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: message.to }] }],
          from: { email: from },
          subject: message.subject,
          content: [
            { type: "text/plain", value: message.text || "" },
            { type: "text/html", value: message.html },
          ],
        }),
      });

      if (!response.ok) {
        console.error("SendGrid API error:", await response.text());
        return false;
      }

      return true;
    } catch (error) {
      console.error("SendGrid error:", error);
      return false;
    }
  }

  console.warn("No email provider configured or API key missing");
  return false;
}

/**
 * Send notification email when a new lead is captured
 */
export async function sendLeadNotification(lead: Lead): Promise<boolean> {
  const { notifyTo } = EMAIL_CONFIG;

  const interestLabels: Record<string, string> = {
    certification: "Certificación en competencias",
    training: "Capacitación para equipo",
    dc3: "Gestión de constancias DC-3",
    compliance: "Cumplimiento STPS/LFT",
  };

  const interests = lead.interests
    .map((i) => interestLabels[i] || i)
    .join(", ");

  const contextInfo = [
    lead.ecCode && `EC: ${lead.ecCode}`,
    lead.certifierId && `Certificador ID: ${lead.certifierId}`,
    lead.centerId && `Centro ID: ${lead.centerId}`,
  ]
    .filter(Boolean)
    .join(" | ");

  const utmInfo = [
    lead.utmSource && `Source: ${lead.utmSource}`,
    lead.utmMedium && `Medium: ${lead.utmMedium}`,
    lead.utmCampaign && `Campaign: ${lead.utmCampaign}`,
  ]
    .filter(Boolean)
    .join(" | ");

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0066cc, #004499); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px; }
    .field { margin-bottom: 12px; }
    .label { font-weight: 600; color: #666; font-size: 12px; text-transform: uppercase; }
    .value { font-size: 16px; margin-top: 4px; }
    .badge { display: inline-block; background: #e0f0ff; color: #0066cc; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-right: 4px; }
    .footer { margin-top: 20px; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">🎯 Nuevo Lead - RENEC Explorer</h2>
      <p style="margin: 8px 0 0 0; opacity: 0.9;">${lead.leadType === "ORGANIZATION" ? "Empresa" : "Individuo"}</p>
    </div>
    <div class="content">
      <div class="field">
        <div class="label">Nombre</div>
        <div class="value">${lead.name || "No proporcionado"}</div>
      </div>
      <div class="field">
        <div class="label">Email</div>
        <div class="value"><a href="mailto:${lead.email}">${lead.email}</a></div>
      </div>
      ${
        lead.phone
          ? `
      <div class="field">
        <div class="label">Teléfono</div>
        <div class="value"><a href="tel:${lead.phone}">${lead.phone}</a></div>
      </div>
      `
          : ""
      }
      ${
        lead.company
          ? `
      <div class="field">
        <div class="label">Empresa</div>
        <div class="value">${lead.company}</div>
      </div>
      `
          : ""
      }
      ${
        interests
          ? `
      <div class="field">
        <div class="label">Intereses</div>
        <div class="value">${lead.interests.map((i) => `<span class="badge">${interestLabels[i] || i}</span>`).join(" ")}</div>
      </div>
      `
          : ""
      }
      ${
        contextInfo
          ? `
      <div class="field">
        <div class="label">Contexto de navegación</div>
        <div class="value">${contextInfo}</div>
      </div>
      `
          : ""
      }
      ${
        utmInfo
          ? `
      <div class="field">
        <div class="label">Origen</div>
        <div class="value">${utmInfo}</div>
      </div>
      `
          : ""
      }
      <div class="field">
        <div class="label">Fecha</div>
        <div class="value">${new Date(lead.createdAt).toLocaleString("es-MX", { timeZone: "America/Mexico_City" })}</div>
      </div>
    </div>
    <div class="footer">
      <p>Este correo fue generado automáticamente por el sistema de captura de leads de Avala.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Nuevo Lead - RENEC Explorer
============================

Tipo: ${lead.leadType === "ORGANIZATION" ? "Empresa" : "Individuo"}
Nombre: ${lead.name || "No proporcionado"}
Email: ${lead.email}
${lead.phone ? `Teléfono: ${lead.phone}` : ""}
${lead.company ? `Empresa: ${lead.company}` : ""}
${interests ? `Intereses: ${interests}` : ""}
${contextInfo ? `Contexto: ${contextInfo}` : ""}
${utmInfo ? `Origen: ${utmInfo}` : ""}

Fecha: ${new Date(lead.createdAt).toLocaleString("es-MX")}
  `.trim();

  return sendEmail({
    to: notifyTo,
    subject: `🎯 Nuevo Lead: ${lead.name || lead.email} ${lead.ecCode ? `(${lead.ecCode})` : ""}`,
    html,
    text,
  });
}

/**
 * Send welcome email to the lead
 */
export async function sendLeadWelcomeEmail(lead: Lead): Promise<boolean> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0066cc, #004499); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
    .footer { background: #f5f5f5; padding: 20px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #666; }
    .btn { display: inline-block; background: #0066cc; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; }
    .btn:hover { background: #0055aa; }
    h1 { margin: 0; }
    .highlight { background: #f0f7ff; border-left: 4px solid #0066cc; padding: 15px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>¡Bienvenido a Avala!</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Tu camino hacia la certificación comienza aquí</p>
    </div>
    <div class="content">
      <p>Hola ${lead.name || ""},</p>

      <p>Gracias por tu interés en certificarte con nosotros. Hemos recibido tu información y un asesor se pondrá en contacto contigo pronto.</p>

      <div class="highlight">
        <strong>¿Qué sigue?</strong>
        <ul style="margin: 10px 0 0 0; padding-left: 20px;">
          <li>Un asesor te contactará en las próximas 24 horas hábiles</li>
          <li>Te ayudaremos a elegir el mejor camino de certificación</li>
          <li>Podrás comenzar tu preparación de inmediato</li>
        </ul>
      </div>

      <p>Mientras tanto, puedes seguir explorando los estándares de competencia disponibles:</p>

      <p style="text-align: center; margin: 30px 0;">
        <a href="https://avala.mx/explorar" class="btn">Explorar Estándares</a>
      </p>

      <p>¿Tienes alguna pregunta? Responde a este correo o escríbenos a <a href="mailto:hola@avala.mx">hola@avala.mx</a></p>

      <p>¡Nos vemos pronto!</p>
      <p><strong>El equipo de Avala</strong></p>
    </div>
    <div class="footer">
      <p>Avala - Plataforma de Certificación de Competencias</p>
      <p>Este correo fue enviado a ${lead.email} porque te registraste en avala.mx</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
¡Bienvenido a Avala!

Hola ${lead.name || ""},

Gracias por tu interés en certificarte con nosotros. Hemos recibido tu información y un asesor se pondrá en contacto contigo pronto.

¿Qué sigue?
- Un asesor te contactará en las próximas 24 horas hábiles
- Te ayudaremos a elegir el mejor camino de certificación
- Podrás comenzar tu preparación de inmediato

Mientras tanto, puedes seguir explorando: https://avala.mx/explorar

¿Preguntas? Escríbenos a hola@avala.mx

¡Nos vemos pronto!
El equipo de Avala
  `.trim();

  return sendEmail({
    to: lead.email,
    subject: "¡Bienvenido a Avala! Tu certificación comienza aquí 🎓",
    html,
    text,
  });
}
