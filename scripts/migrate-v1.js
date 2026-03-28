const fs = require("fs");

const oldData = JSON.parse(fs.readFileSync(process.argv[2], "utf-8"));

const newData = {
  version: "2.0",
  screens: [
    {
      id: "default",
      name: "Screen 1",
      components: oldData.components,
    },
  ],
  currentScreenId: "default",
  entities: oldData.entities.map((entity) => ({
    name: entity.name,
    properties: entity.properties.map((prop) => ({
      name: prop,
      type: "string",
    })),
  })),
};

console.log(JSON.stringify(newData, null, 2));
