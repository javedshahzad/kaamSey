import { Injectable } from '@angular/core';

@Injectable()
export class TimestampService {

  constructor() { }

  public generateTimeStamp(): string {
    return new Date().toISOString();
  }

  public generateLocalTimeStamp(): string {
    var date = new Date();
    return (new Date(date.getTime() - (date.getTimezoneOffset()) * 60000).toISOString());
  }

  public getMaterialNameFormat(arr) {
    let mainstring = (arr.Material && arr.Material_Sub ? arr.Material + " / " + arr.Material_Sub : arr.Material) +
      (arr.Size ? " - " + arr.Size : "") +
      (arr.Color ? " - " + arr.Color : "") +
      (arr.Client_Material_Id ? " - HA(" + arr.Client_Material_Id + ")" : "")
    return mainstring;
  }
}
