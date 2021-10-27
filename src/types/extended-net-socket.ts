import net from 'net';

export type ExtendedNetSocket = net.Socket & {
  connectKey?: string;
};
