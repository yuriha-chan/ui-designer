# Topological UI Designer
Distraction-free UI structure designer

## The Problem
Novice designers often get trapped in adjusting after adjusting visual details to achieve perfection before they understand the logic of the system. This **distraction** leads to unfinished products, delayed decisions, and design inconsistency in reality. In other words, their desires for perfection is the enemy of structural progress. This sort of **abuse of design media** occurs virtually anywhere, in "professional" Adobe tools or even on paper. Any medium that allows for visual adjustment does distract from the process of deciding visual relationships necessary for a functional, working system.

## The Philosophy
The core philosophy is that "the right tool speaks more than university textbooks or lectures." In this tool, designers are not allowed to touch any visual properties. Colors, fonts, sizes, and even orders do not exist here. This software functions as a pedagogical environment where the only available actions relate to containment and topology, teaching the fundamental rules of UI architecture through **enforced constraints**.

## How it Works
The tool replaces manual positioning with a system of topological equivalence. A UI is treated as a mathematical tree where the identity of any component is defined by its position relative to its parent and its children.

### S-expression Determinism
Spatial arrangement is governed by a deterministic sorting algorithm to prevent distraction from manual alignment. The order of components within a container is calculated using S-expressions.The sorting value for a component $c$ is determined by:$$S(c) = (type \: entityPath \: S(child_1) \: S(child_2) \dots S(child_n)) .$$

### Visual Representation
The interface uses a functional system to represent the hierarchy. Containers are assigned grayscale shades based on their depth in the tree. Leaf nodes use fixed colors to indicate their type: blue for text, green for numbers, and red for buttons. If a leaf node has no entity path, it displays a placeholder.

### Technical Implementation
The application is built with React 18 and TypeScript. The drag-and-drop system, implemented via react-dnd, utilizes a deepest-target detection logic to manage nested structures. Component identities are maintained using the uuid for internal reference (e.g. tracking of the elements being dragged).

## Future Development
- **Input Node**: Implementation of a specialized component for user data entry fields.
- **Entity Editor**: A dedicated interface for pasting and managing entity descriptions and properties.
- **Common Labels**: Support for a restricted vocabulary of labels (e.g. OK, Cancel, Select) to provide context without allowing arbitrary text.
- **Export/Import**: Functionality to save and load designs as JSON and HTML for integration with development workflows.
- **Storyboard**: A system to link multiple UI states to describe user transitions and experience flow.
- **Demo Mode**: A testing environment for storyboards using a minimalistic, functional UI.
