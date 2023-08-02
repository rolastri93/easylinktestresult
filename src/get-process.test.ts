import axios from "axios";
import { randomUUID } from "crypto";

(async () => {
  const BASE_URL = 'http://localhost:3030'
  const endpoint = '/main-request';

  const params = {
    id: randomUUID(),
    data: {
      email: "it@ayolinx.id",
      name: "IT Dev",
      phone_number: "08228369813"
    },
    secret_key: "ck_ey13Bkas8Undaviw",
    client_key: "sk_hdsandj3scipqfH3"
  }

  try {
    await axios.post(BASE_URL + endpoint, params, {
      headers: {
        "Content-Type": "application/json"
      },
    })
  } catch (err: any) {
    console.log(err);
  }
})();