/**
 * @project		Unofficial Facebook API
 * @descriptions	The unofficial API performs the task of sending messages and some other tasks for Facebook
 * @repositories		https://github.com/nhatvu2003/unofficial-fb-api
 * @author		Nhat Vu
 * @link			https://nhatvu.io.vn
 * @link			https://github.com/nhatvu2003
 *
 * Please do not delete this line
 *
 */

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
