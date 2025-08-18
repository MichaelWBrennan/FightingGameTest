# HD-2D Graphics Pipeline Documentation

This document outlines the standards and procedures for creating and integrating assets into the HD-2D rendering pipeline for this project.

## 1. Overview

The rendering pipeline is built on PlayCanvas and TypeScript, designed to combine 2D, billboarded sprites with 3D environments to achieve a modern "HD-2D" or "2.5D" aesthetic, similar to games like Octopath Traveler, but tuned for a fighting game.

The core of the system is a set of modular PlayCanvas script components that handle different aspects of the rendering process:
-   `StageLayerManager`: Manages the creation and parallaxing of 2D and 3D stage layers.
-   `SpriteRendererHD2D`: Renders character sprites with support for normal maps and dynamic lighting.
-   `CameraCinematicController`: Controls the camera's perspective and movement.
-   `PostProcessingPipeline`: Manages all screen-space post-processing effects like bloom and depth of field.

## 2. How to Add New Characters

This section will detail the process for adding a new character to the game.

### Asset Requirements
-   **Sprite Sheets:** (Format, resolution, naming conventions)
-   **Normal Maps:** (How to generate, format, and name them)
-   **Character Data:** (Explanation of the `.base.json` and `.variations.json` files)

### Integration Steps
1.  **Add Sprite Assets:** (Where to place the sprite and normal map files)
2.  **Create Character Data Files:** (How to create the necessary JSON files for the character)
3.  **Hooking into `CharacterManager`:** (How the character is loaded and instantiated)
4.  **Using `SpriteRendererHD2D`:** (How the character's sprite is rendered in the world)

*(Placeholder for detailed instructions, code snippets, and examples)*

## 3. How to Build Stages

This section will explain how to create a new 3D stage with parallaxing layers.

### Asset Requirements
-   **Layer Textures:** (Format, resolution)
-   **3D Props:** (Model format, texture requirements)
-   **Stage Data:** (Explanation of the stage JSON file format)

### Integration Steps
1.  **Add Stage Assets:** (Where to place texture and model files)
2.  **Create Stage Data File:** (How to define the stage's layers, lighting, and camera settings in JSON)
3.  **Using `StageLayerManager`:** (How the stage layers are created and managed)

*(Placeholder for detailed instructions, code snippets, and examples)*

## 4. How to Hook into the Camera and Effects System

This section will describe how to interact with the camera and post-processing systems.

### Camera Control
-   **Using `CameraCinematicController`:** (How to set the camera's focus target, adjust smoothing, etc.)
-   **Triggering Camera Events:** (e.g., a super move causing a dramatic zoom)

### Post-Processing
-   **Using `PostProcessingPipeline`:** (How to enable/disable effects and change their parameters at runtime)
-   **Adding New Effects:** (How to extend the pipeline with new custom post-processing effects)

*(Placeholder for detailed instructions, code snippets, and examples)*
