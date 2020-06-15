// A list of connections accessible across the module,
// used primarily for passing ssl proxy auth header
// around.
import { ContextNoMitm } from '../types/contexts/context-no-mitm';

const contexts: { [key: string]: ContextNoMitm } = {};

export default contexts;
