import { UIComponent } from "../src/types";

// Simple tree: single container with a few leaves
export const simpleTree: UIComponent[] = [
  {
    id: "root",
    type: "container",
    children: [
      { id: "text1", type: "text", entityPath: "Account>Name", children: [] },
      {
        id: "button1",
        type: "button",
        entityPath: "Account>Submit",
        children: [],
      },
      {
        id: "number1",
        type: "number",
        entityPath: "Product>Price",
        children: [],
      },
    ],
  },
];

// Medium tree: nested containers
export const mediumTree: UIComponent[] = [
  {
    id: "root",
    type: "container",
    children: [
      {
        id: "container1",
        type: "container",
        children: [
          {
            id: "text1",
            type: "text",
            entityPath: "Account>Name",
            children: [],
          },
          {
            id: "text2",
            type: "text",
            entityPath: "Account>Email",
            children: [],
          },
        ],
      },
      {
        id: "container2",
        type: "container",
        children: [
          {
            id: "button1",
            type: "button",
            entityPath: "Account>Submit",
            children: [],
          },
          {
            id: "number1",
            type: "number",
            entityPath: "Product>Price",
            children: [],
          },
        ],
      },
    ],
  },
];

// Deep tree: deeply nested (4 levels)
export const deepTree: UIComponent[] = [
  {
    id: "level1",
    type: "container",
    children: [
      {
        id: "level2",
        type: "container",
        children: [
          {
            id: "level3",
            type: "container",
            children: [
              {
                id: "level4",
                type: "container",
                children: [
                  {
                    id: "leaf",
                    type: "text",
                    entityPath: "Account>Name",
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

// Wide tree: many children at root
export const wideTree: UIComponent[] = [
  {
    id: "root",
    type: "container",
    children: [
      { id: "text1", type: "text", entityPath: "Account>Name", children: [] },
      { id: "text2", type: "text", entityPath: "Account>Email", children: [] },
      { id: "text3", type: "text", entityPath: "Account>Phone", children: [] },
      {
        id: "button1",
        type: "button",
        entityPath: "Account>Submit",
        children: [],
      },
      {
        id: "button2",
        type: "button",
        entityPath: "Account>Cancel",
        children: [],
      },
      {
        id: "number1",
        type: "number",
        entityPath: "Product>Price",
        children: [],
      },
      {
        id: "number2",
        type: "number",
        entityPath: "Product>Quantity",
        children: [],
      },
    ],
  },
];

// Mixed tree: containers and leaves at various levels
export const mixedTree: UIComponent[] = [
  {
    id: "root",
    type: "container",
    children: [
      {
        id: "formContainer",
        type: "container",
        children: [
          {
            id: "nameField",
            type: "text",
            entityPath: "Account>Name",
            children: [],
          },
          {
            id: "emailField",
            type: "text",
            entityPath: "Account>Email",
            children: [],
          },
          {
            id: "addressContainer",
            type: "container",
            children: [
              {
                id: "street",
                type: "text",
                entityPath: "Address>Street",
                children: [],
              },
              {
                id: "city",
                type: "text",
                entityPath: "Address>City",
                children: [],
              },
            ],
          },
        ],
      },
      {
        id: "actionContainer",
        type: "container",
        children: [
          {
            id: "submitBtn",
            type: "button",
            entityPath: "Account>Submit",
            children: [],
          },
          {
            id: "cancelBtn",
            type: "button",
            entityPath: "Account>Cancel",
            children: [],
          },
        ],
      },
    ],
  },
];

// Empty tree
export const emptyTree: UIComponent[] = [];

// Single component tree
export const singleComponentTree: UIComponent[] = [
  { id: "single", type: "text", entityPath: "Account>Name", children: [] },
];
