const config = require('../config/config');

let TransactionalEmailsApi;
try {
  ({ TransactionalEmailsApi } = require('@getbrevo/brevo'));
} catch (error) {
  console.warn(
    '[sendEmail] No se pudo cargar @getbrevo/brevo. El envío de emails queda deshabilitado hasta instalar la dependencia.',
    error?.message || error
  );
}

const brevoClient = TransactionalEmailsApi ? new TransactionalEmailsApi() : null;
let brevoClientConfigured = false;

const ensureApiKey = (client, apiKey) => {
  if (!client || brevoClientConfigured) {
    return;
  }

  if (typeof client.setApiKey === 'function') {
    client.setApiKey(apiKey);
    brevoClientConfigured = true;
    return;
  }

  if (client.authentications?.['api-key']) {
    client.authentications['api-key'].apiKey = apiKey;
    brevoClientConfigured = true;
    return;
  }

  if (client.apiClient?.authentications?.['api-key']) {
    client.apiClient.authentications['api-key'].apiKey = apiKey;
    brevoClientConfigured = true;
  }
};

const normalizeRecipients = (target, value) => {
  if (!value) {
    return;
  }

  const pushRecipient = (recipient) => {
    if (!recipient) {
      return;
    }

    if (typeof recipient === 'string') {
      const trimmed = recipient.trim();
      if (trimmed) {
        target.push({ email: trimmed });
      }
      return;
    }

    if (Array.isArray(recipient)) {
      recipient.forEach(pushRecipient);
      return;
    }

    if (typeof recipient === 'object' && recipient.email) {
      target.push({ email: recipient.email, name: recipient.name });
    }
  };

  pushRecipient(value);
};

const uniqueRecipients = (recipients) => {
  if (!recipients.length) {
    return recipients;
  }

  const unique = new Map();
  recipients.forEach((recipient) => {
    if (recipient.email) {
      unique.set(recipient.email.toLowerCase(), recipient);
    }
  });

  return Array.from(unique.values());
};

const toHtml = (text) => {
  if (!text) {
    return undefined;
  }

  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('<br />');
};

const sendEmail = async (options = {}) => {
  const {
    email,
    emails,
    to,
    subject,
    message,
    html
  } = options;

  const apiKey = config.brevoApiKey || process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn('[sendEmail] BREVO_API_KEY no configurada. Se omite el envío.');
    return;
  }

  if (!brevoClient) {
    console.warn('[sendEmail] Cliente de Brevo no inicializado. Se omite el envío.');
    return;
  }

  ensureApiKey(brevoClient, apiKey);

  const recipients = [];
  normalizeRecipients(recipients, to);
  normalizeRecipients(recipients, emails);
  normalizeRecipients(recipients, email);

  const toField = uniqueRecipients(recipients);
  if (!toField.length) {
    console.warn('[sendEmail] No se proporcionaron destinatarios.');
    return;
  }

  const senderEmail = config.email?.from;
  const payload = {
    to: toField,
    subject,
    textContent: message?.trim(),
    htmlContent: html || toHtml(message)
  };

  if (senderEmail) {
    payload.sender = { email: senderEmail };
  }

  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) {
      delete payload[key];
    }
  });

  try {
    return await brevoClient.sendTransacEmail(payload);
  } catch (error) {
    console.error(
      '[sendEmail] Error enviando email transaccional a través de Brevo',
      {
        to: toField.map((recipient) => recipient.email),
        subject,
        error: error?.message || error
      }
    );
    throw error;
  }
};

module.exports = sendEmail;
