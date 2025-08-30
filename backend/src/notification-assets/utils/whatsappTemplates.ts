import fs from 'fs';
import path from 'path';

export const renderWhatsAppTemplate = (
  templateName: string,
  data: Record<string, string>
): string => {
  const templatePath = path.join(__dirname, '../../notification-assets/templates/whatsapp', `${templateName}.txt`);
  const rawTemplate = fs.readFileSync(templatePath, 'utf-8');

  let filledTemplate = rawTemplate;
  for (const key in data) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    filledTemplate = filledTemplate.replace(regex, data[key]);
  }

  return filledTemplate;
};
