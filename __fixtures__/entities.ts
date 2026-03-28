import { Entity } from "../src/types";

// Sample entities for testing
export const accountEntity: Entity = {
  name: "Account",
  properties: [
    { name: "Name", type: "string" },
    { name: "Email", type: "string" },
    { name: "Phone", type: "string" },
    { name: "Submit", type: "string" },
    { name: "Cancel", type: "string" },
  ],
};

export const productEntity: Entity = {
  name: "Product",
  properties: [
    { name: "Price", type: "number" },
    { name: "Quantity", type: "number" },
    { name: "Title", type: "string" },
    { name: "Description", type: "string" },
  ],
};

export const addressEntity: Entity = {
  name: "Address",
  properties: [
    { name: "Street", type: "string" },
    { name: "City", type: "string" },
    { name: "State", type: "string" },
    { name: "ZipCode", type: "string" },
    { name: "Country", type: "string" },
  ],
};

export const userEntity: Entity = {
  name: "User",
  properties: [
    { name: "Username", type: "string" },
    { name: "Password", type: "string" },
    { name: "Role", type: "string" },
    { name: "CreatedAt", type: "string" },
  ],
};

export const orderEntity: Entity = {
  name: "Order",
  properties: [
    { name: "OrderId", type: "string" },
    { name: "Total", type: "number" },
    { name: "Status", type: "string" },
    { name: "Date", type: "string" },
  ],
};

// Collection of all entities
export const allEntities: Entity[] = [
  accountEntity,
  productEntity,
  addressEntity,
  userEntity,
  orderEntity,
];

// Entity map for quick lookup
export const entityMap: Record<string, Entity> = {
  Account: accountEntity,
  Product: productEntity,
  Address: addressEntity,
  User: userEntity,
  Order: orderEntity,
};
