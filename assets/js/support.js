import { loadConfig, setSupportLinks } from './common.js';
const config = await loadConfig();
setSupportLinks(config, config.supportWhatsappText);
