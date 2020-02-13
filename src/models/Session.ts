interface ISession {
    cookieId: string
    data: Record<string, any>
}

export class Session{
    private _cookieId: string;
    private _data: Record<string, any>;

    constructor (cookieId: string, data: Record<string, any>) {
        this._data = data
        this._cookieId = cookieId;

      }

      get cookieId(): string {
        return this._cookieId;
      }

      set cookieId(cookieId: string) {
        this._cookieId = cookieId;
      }

      set data(data: Record<string, any>) {
        this._data = data;
      }

      get data(): Record<string, any> {
        return this._data;
      }
}
