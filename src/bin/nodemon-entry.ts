import "reflect-metadata";
import "../LoadConfig";
import "app/controllers/index";

import { ApplicationFactory } from "app/ApplicationFactory";

const PORT = 3000;

const app = ApplicationFactory.createInstance();
app.set("port", PORT);

app.listen(PORT, () => {
    console.log(`✅  Application Ready. Running on port ${PORT}`);
});
