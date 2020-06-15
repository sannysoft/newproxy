import { StatusData } from '../status-data';
import { StatusDataNoMitm } from '../status-data-no-mitm';

export type StatusFn = (status: StatusData) => void;
export type StatusNoMitmFn = (status: StatusDataNoMitm) => void;
