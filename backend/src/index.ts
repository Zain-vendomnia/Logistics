import app from "./app";
import initialSetup from "./initialSetup";

function main() {
  initialSetup();
  app.listen(app.get("port"), () => {
    console.log(`App runing on port ${app.get("port")}`);
  });
}

main();
