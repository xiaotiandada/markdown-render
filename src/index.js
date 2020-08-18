import { version } from '../package.json';

import { finishView } from './extra'
import markdown from "./markdown";

console.log('markdown render version ' + version);
export { finishView, markdown }