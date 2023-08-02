import axios, { AxiosInstance } from "axios";
import { getEnv } from "./getenv";
import {
  BinaryToTextEncoding,
  createHash,
  createHmac,
  randomUUID,
  timingSafeEqual,
} from "crypto";

export namespace MainRequest {
  export interface SignatureParam {
    client_key: string;
    request_timestamp: Date;
    request_target: string;
    body?: any;
  }

  export function normalizeBody(body: any): any {
    let string_body = "";
    switch (typeof body) {
      case "object":
        string_body = JSON.stringify(body);
        break;
      case "number":
        string_body = String(body);
        break;
      case "boolean":
        string_body = String(body);
        break;
      case "string":
        string_body = body;
        break;
    }
    return string_body;
  }

  export class Crypto {
    private static _instance: Crypto;

    public static get instance(): Crypto {
      if (!Crypto._instance) {
        Crypto._instance = new Crypto();
      }

      return Crypto._instance;
    }

    public hmac256Hash(
      data: string,
      secret_key: string,
      output_encoding: BinaryToTextEncoding = "hex"
    ): string {
      return createHmac("SHA256", secret_key)
        .update(data)
        .digest(output_encoding);
    }

    public sha256(data: any, output_encoding: BinaryToTextEncoding = "hex") {
      return createHash("SHA256")
        .update(normalizeBody(data))
        .digest(output_encoding);
    }
  }
  export class Main {
    private client_key: string;
    private client_secret: string;
    private http_instance: AxiosInstance;
    private static _instance: Main;

    public static instance(client_key: string, client_secret: string): Main {
      if (!Main._instance) {
        Main._instance = new Main(client_key, client_secret);
      }

      return Main._instance;
    }

    private constructor(client_key: string, client_secret: string) {
      const baseURL = getEnv('URL', '');
      this.client_key = client_key;
      this.client_secret = client_secret;
      this.http_instance = axios.create({
        baseURL,
        timeout: 10 * 1000
      });
    }

    private signatureDataToSign(param: SignatureParam): string {
      return [
        `Client-Key:${param.client_key}`,
        `Request-Timestamp:${param.request_timestamp.toISOString()}`,
        `Request-Target:${param.request_target}`,
        `Digest:${Crypto.instance.sha256(normalizeBody(param.body), "base64")}`,
      ].join("\n");
    }

    public getSignature(param: SignatureParam, secret_key: string): string {
      return Crypto.instance.hmac256Hash(
        this.signatureDataToSign(param),
        secret_key,
        "hex"
      );
    }

    public async postRequest(params: any): Promise<string> {
      const endpoint = getEnv('ENDPOINT', '');
      const timestamp = new Date();
      const signature: string = this.getSignature({
        client_key: this.client_key,
        request_timestamp: timestamp,
        request_target: endpoint,
        body: params
      }, this.client_secret);
      try {
        return (await this.http_instance.post(endpoint, params, {
          headers: {
            'Content-Type': 'application/json',
            'Client-Key': this.client_key,
            'Request-Id': randomUUID(),
            'Signature': signature,
            'Request-Timestamp': timestamp.toISOString()
          }
        })).data;
      } catch (err: any) {
        throw new Error(err.response.data.toString());
      }
    }
  }
}
