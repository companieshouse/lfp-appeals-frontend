import { IMap } from './types';


interface ISession {
    cookieId: string
    data: IMap<any>
}

export class Session{
    private _cookieId: string;
    private _data: IMap<any>;

    constructor (cookieId: string, data: IMap<any>) {
        this._data = data
        this._cookieId = cookieId;

      }

      get cookieId(): string {
        return this._cookieId;
      }

      set cookieId(cookieId: string) {
        this._cookieId = cookieId;
      }

      set data(data: IMap<any>) {
        this._data = data;
      }

      get data(): IMap<any> {
        return this._data;
      }
}
