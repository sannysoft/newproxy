import { StatusData } from '../status-data';
import { StatusDataNoMitm } from '../status-data-no-mitm';
export declare type StatusFn = (status: StatusData) => void;
export declare type StatusNoMitmFn = (status: StatusDataNoMitm) => void;
