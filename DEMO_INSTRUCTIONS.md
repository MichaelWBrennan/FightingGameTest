# Pseudo 2.5D Graphics System Demo

This interactive demo showcases the visual effects implemented in the pseudo 2.5D graphics system for the fighting game, inspired by BlazBlue and Skullgirls.

## How to View the Demo

Open `pseudo_2d5_demo.html` in your web browser to see the interactive demonstration.

## What You'll See

### 🎨 Visual Features Demonstrated

1. **Parallax Depth Demo**
   - Multi-layer background scrolling
   - Depth-based motion blur effects
   - Atmospheric perspective simulation
   - Camera movement creating 3D illusion

2. **Character Lighting Demo** 
   - Dynamic rim lighting on 2D sprites
   - Pseudo 3D lighting calculations
   - Energy pulse effects
   - Enhanced character silhouettes

3. **Impact Effects Demo**
   - Explosive particle systems
   - Screen shake on impact
   - Color-coded effect types
   - Screen distortion overlay

4. **Slash Effects Demo**
   - Motion blur weapon trails
   - Dynamic slash path generation
   - Glowing energy effects
   - Speed-responsive intensity

5. **Magic Burst Demo**
   - Radial particle emission
   - Energy wave propagation
   - Layered magical effects
   - Color-coded spell types

6. **Combo System Demo**
   - Escalating visual effects
   - Dynamic text animations
   - Screen shake scaling
   - Combo streak feedback

7. **Camera Cinematics Demo**
   - Automatic camera movements
   - Dramatic angle shifts
   - Bezier curve transitions
   - Impact-responsive framing

### 🎮 Interactive Controls

- **Manual Navigation**: Click the demo buttons to switch between modes
- **Auto-Cycle**: The demo automatically cycles through all modes every 8 seconds
- **Real-Time Effects**: All effects render in real-time using web technologies

### 🔧 Technical Implementation

The web demo recreates the core visual concepts of the Godot-based pseudo 2.5D system:

- **CSS3 animations** for smooth motion effects
- **JavaScript particle systems** for dynamic effects  
- **Hardware-accelerated transforms** for performance
- **Layered rendering** mimicking the depth system
- **Dynamic effect generation** showing procedural capabilities

This demonstrates the same visual principles implemented in the actual Godot fighting game engine, including:

- Multi-layer depth rendering
- Pseudo lighting calculations
- Dynamic particle generation  
- Screen-space effects
- Cinematic camera systems

## Real Game Integration

In the actual Godot project, these effects are implemented using:

- **Pseudo2D5Manager.cs** - Central rendering orchestration
- **Enhanced2D5ParticleSystem.cs** - Advanced particle effects
- **CinematicCameraSystem.cs** - Dynamic camera control
- **Custom shaders** - BlazBlue-style lighting and rim effects
- **Multi-layer canvas system** - Depth-based rendering

The web demo provides a visual preview of what players will experience in the actual fighting game with these pseudo 2.5D enhancements.