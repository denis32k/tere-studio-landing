import { loadConfig, setSupportLinks } from './common.js';
const CONFIG = await loadConfig();
setSupportLinks(CONFIG);
