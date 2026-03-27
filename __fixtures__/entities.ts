import { Entity } from "../src/types";

// Sample entities for testing
export const accountEntity: Entity = {
  name: "Account",
  properties: ["Name", "Email", "Phone", "Submit", "Cancel"],
};

export const productEntity: Entity = {
  name: "Product",
  properties: ["Price", "Quantity", "Title", "Description"],
};

export const addressEntity: Entity = {
  name: "Address",
  properties: ["Street", "City", "State", "ZipCode", "Country"],
};

export const userEntity: Entity = {
  name: "User",
  properties: ["Username", "Password", "Role", "CreatedAt"],
};

export const orderEntity: Entity = {
  name: "Order",
  properties: ["OrderId", "Total", "Status", "Date"],
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
