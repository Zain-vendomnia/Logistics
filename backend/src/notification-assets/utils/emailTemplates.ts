import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';

export const renderTemplate = (templateName: string, data: Record<string, string | number>) => {
  const filePath = path.join(__dirname, '../../notification-assets/templates/email', `${templateName}.html`);
  const source = fs.readFileSync(filePath, 'utf-8');
  const template = handlebars.compile(source);
  return template(data);
};
