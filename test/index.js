import login from "../index.js";
import { readFileSync } from "fs";
import { resolve as resolvePath } from "path";
login(
    {
        Cookie: JSON.parse(
            readFileSync(
                resolvePath(process.cwd(), "test", "cookie.json"),
                "utf-8"
            )
        )
    },
   async (err, api) => {
        console.log(await api.getAppstate());
    }
);
