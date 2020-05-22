// A list of connections accessible across the module,
// used primarily for passing ssl proxy auth header
// around.
import { IncomingMessage } from 'http';

const connections: { [key: string]: IncomingMessage } = {};

export default connections;
