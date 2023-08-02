import express, { Express, Request, Response } from "express";
import { MainRequest } from "./request";
import { getEnv } from "./getenv";
import { IsDefined, IsNotEmpty, IsNotEmptyObject, IsObject, IsString, validateOrReject } from "class-validator";
import { plainToInstance } from "class-transformer";
import * as BodyParser from "body-parser";
import { randomUUID } from "crypto";

const app: Express = express();
const port = getEnv("PORT", "3030");

app.use(BodyParser.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});

app.post("/main-request", async (req: Request, res: Response) => {
  const dto: RequestDTO = plainToInstance(RequestDTO, { ...req.query, ...req.params, ...req.body, ...res.locals });
  try {
    await validateOrReject(dto);
  } catch (err_validation: any) {
    return res.status(400).end(err_validation.toString());
  }

  try {
    const params = {
      id: randomUUID(),
      data: {
        email: dto.data.email,
        name: dto.data.name,
        phone_number: dto.data.phone_number
      }
    }
  
    await MainRequest.Main.instance(dto.client_key, dto.secret_key).postRequest(params)
  
    return res.json(true);
  } catch (err: any) {
    return res.json(false);
  }
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});

export class RequestDTO {
  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  data!: ProfileDTO;

  @IsNotEmpty()
  @IsString()
  secret_key!: string;

  @IsNotEmpty()
  @IsString()
  client_key!: string;
}

export class ProfileDTO {
  @IsNotEmpty()
  @IsString()
  email!: string;

  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsString()
  phone_number!: string;
}
