/**
 * Sprite Normal Mapping Shader for HD-2D 2D Sprites
 * Adds depth and lighting to flat 2D character sprites using normal maps
 * Converted from GLSL to TypeScript
 */
export class SpriteNormalMappingShader {
    static createMaterial(device) {
        const material = new device.StandardMaterial();
        material.chunks.VS_TRANSFORM = this.vertexShader;
        material.chunks.PS_OUTPUT = this.fragmentShader;
        return material;
    }
    static setUniforms(material, params) {
        material.setParameter('view_position', params.viewPosition);
        material.setParameter('light_position_0', params.lightPosition0);
        material.setParameter('light_position_1', params.lightPosition1);
        material.setParameter('light_position_2', params.lightPosition2);
        material.setParameter('light_color_0', params.lightColor0);
        material.setParameter('light_color_1', params.lightColor1);
        material.setParameter('light_color_2', params.lightColor2);
        material.setParameter('light_intensity_0', params.lightIntensity0);
        material.setParameter('light_intensity_1', params.lightIntensity1);
        material.setParameter('light_intensity_2', params.lightIntensity2);
        material.setParameter('material_diffuse', params.materialDiffuse);
        material.setParameter('material_specular', params.materialSpecular);
        material.setParameter('material_shininess', params.materialShininess);
        material.setParameter('material_opacity', params.materialOpacity);
        material.setParameter('normalMapStrength', params.normalMapStrength);
        material.setParameter('spriteDepth', params.spriteDepth);
        material.setParameter('spritePixelSize', params.spritePixelSize);
        material.setParameter('pixelPerfect', params.pixelPerfect);
        material.setParameter('hitFlash', params.hitFlash);
        material.setParameter('hitFlashColor', params.hitFlashColor);
        material.setParameter('stunEffect', params.stunEffect);
        material.setParameter('counterHitGlow', params.counterHitGlow);
        material.setParameter('playerTint', params.playerTint);
        material.setParameter('animationFrame', params.animationFrame);
        material.setParameter('spriteSheetSize', params.spriteSheetSize);
        material.setParameter('frameSize', params.frameSize);
    }
}
SpriteNormalMappingShader.vertexShader = `
    // ========== VERTEX SHADER ==========
    attribute vec3 vertex_position;
    attribute vec2 vertex_texCoord0;
    attribute vec3 vertex_normal;
    attribute vec3 vertex_tangent;

    uniform mat4 matrix_model;
    uniform mat4 matrix_view;
    uniform mat4 matrix_projection;
    uniform mat4 matrix_normal;

    // Camera position
    uniform vec3 view_position;

    // Light positions (multiple lights for HD-2D)
    uniform vec3 light_position_0;
    uniform vec3 light_position_1;
    uniform vec3 light_position_2;

    // Output to fragment shader
    varying vec2 vUv0;
    varying vec3 vWorldPosition;
    varying vec3 vWorldNormal;
    varying vec3 vWorldTangent;
    varying vec3 vWorldBitangent;
    varying vec3 vViewDirection;

    // Light directions in tangent space
    varying vec3 vLightDirection0_TS;
    varying vec3 vLightDirection1_TS;
    varying vec3 vLightDirection2_TS;
    varying vec3 vViewDirection_TS;

    void main(void) {
        // Transform vertex to world space
        vec4 worldPosition = matrix_model * vec4(vertex_position, 1.0);
        vWorldPosition = worldPosition.xyz;
        
        // Transform normal and tangent to world space
        vWorldNormal = normalize((matrix_normal * vec4(vertex_normal, 0.0)).xyz);
        vWorldTangent = normalize((matrix_normal * vec4(vertex_tangent, 0.0)).xyz);
        vWorldBitangent = cross(vWorldNormal, vWorldTangent);
        
        // Create tangent-to-world matrix
        mat3 TBN = mat3(vWorldTangent, vWorldBitangent, vWorldNormal);
        mat3 worldToTangent = transpose(TBN);
        
        // Calculate view direction
        vViewDirection = normalize(view_position - vWorldPosition);
        vViewDirection_TS = worldToTangent * vViewDirection;
        
        // Calculate light directions in tangent space
        vec3 lightDir0 = normalize(light_position_0 - vWorldPosition);
        vec3 lightDir1 = normalize(light_position_1 - vWorldPosition);
        vec3 lightDir2 = normalize(light_position_2 - vWorldPosition);
        
        vLightDirection0_TS = worldToTangent * lightDir0;
        vLightDirection1_TS = worldToTangent * lightDir1;
        vLightDirection2_TS = worldToTangent * lightDir2;
        
        // Pass texture coordinates
        vUv0 = vertex_texCoord0;
        
        // Final vertex position
        gl_Position = matrix_projection * matrix_view * worldPosition;
    }
  `;
SpriteNormalMappingShader.fragmentShader = `
    // ========== FRAGMENT SHADER ==========
    #ifdef GL_ES
    precision highp float;
    #endif

    // Input from vertex shader
    varying vec2 vUv0;
    varying vec3 vWorldPosition;
    varying vec3 vWorldNormal;
    varying vec3 vWorldTangent;
    varying vec3 vWorldBitangent;
    varying vec3 vViewDirection;

    varying vec3 vLightDirection0_TS;
    varying vec3 vLightDirection1_TS;
    varying vec3 vLightDirection2_TS;
    varying vec3 vViewDirection_TS;

    // Texture uniforms
    uniform sampler2D texture_diffuseMap;
    uniform sampler2D texture_normalMap;
    uniform sampler2D texture_specularMap;

    // Material properties
    uniform vec3 material_diffuse;
    uniform vec3 material_specular;
    uniform float material_shininess;
    uniform float material_opacity;

    // Light properties
    uniform vec3 light_color_0;
    uniform vec3 light_color_1;
    uniform vec3 light_color_2;
    uniform float light_intensity_0;
    uniform float light_intensity_1;
    uniform float light_intensity_2;

    // HD-2D specific parameters
    uniform float normalMapStrength;
    uniform float spriteDepth;
    uniform vec2 spritePixelSize;
    uniform float pixelPerfect;

    // Fighting game effects
    uniform float hitFlash;
    uniform vec3 hitFlashColor;
    uniform float stunEffect;
    uniform float counterHitGlow;
    uniform vec3 playerTint; // P1/P2 color tinting

    // Animation parameters
    uniform float animationFrame;
    uniform vec2 spriteSheetSize;
    uniform vec2 frameSize;

    vec2 getSpriteUV(vec2 baseUV) {
        if (animationFrame <= 0.0) return baseUV;
        
        // Calculate sprite sheet coordinates
        float frameX = mod(animationFrame, spriteSheetSize.x);
        float frameY = floor(animationFrame / spriteSheetSize.x);
        
        vec2 frameOffset = vec2(frameX, frameY) * frameSize;
        return frameOffset + baseUV * frameSize;
    }

    vec3 sampleNormalMap(vec2 uv) {
        vec3 normal = texture2D(texture_normalMap, uv).rgb;
        normal = normal * 2.0 - 1.0; // Convert from [0,1] to [-1,1]
        
        // Adjust normal map strength for HD-2D effect
        normal.xy *= normalMapStrength;
        normal = normalize(normal);
        
        return normal;
    }

    vec3 calculateLighting(vec3 normal, vec3 lightDir, vec3 lightColor, float lightIntensity, vec3 viewDir) {
        // Diffuse lighting
        float NdotL = max(dot(normal, lightDir), 0.0);
        vec3 diffuse = lightColor * lightIntensity * NdotL;
        
        // Specular lighting (Blinn-Phong)
        vec3 halfVector = normalize(lightDir + viewDir);
        float NdotH = max(dot(normal, halfVector), 0.0);
        float specularPower = pow(NdotH, material_shininess);
        vec3 specular = material_specular * lightColor * specularPower * lightIntensity;
        
        return diffuse + specular;
    }

    vec3 applyPixelPerfectFiltering(vec3 color, vec2 uv) {
        if (pixelPerfect <= 0.0) return color;
        
        // Snap UV coordinates to pixel boundaries
        vec2 pixelUV = floor(uv * spritePixelSize) / spritePixelSize;
        
        // Sample with nearest neighbor filtering
        return texture2D(texture_diffuseMap, pixelUV).rgb * material_diffuse;
    }

    void main(void) {
        // Get sprite sheet UV coordinates
        vec2 spriteUV = getSpriteUV(vUv0);
        
        // Sample base diffuse texture
        vec4 baseColor = texture2D(texture_diffuseMap, spriteUV);
        vec3 diffuse = baseColor.rgb * material_diffuse;
        
        // Early discard for transparent pixels (important for sprites)
        if (baseColor.a < 0.1) discard;
        
        // Sample normal map and convert to tangent space
        vec3 normalTS = sampleNormalMap(spriteUV);
        
        // Sample specular map if available
        vec3 specularMask = texture2D(texture_specularMap, spriteUV).rgb;
        
        // Calculate lighting for each light source
        vec3 totalLighting = vec3(0.0);
        
        // Light 0 (Key light)
        totalLighting += calculateLighting(
            normalTS, 
            normalize(vLightDirection0_TS), 
            light_color_0, 
            light_intensity_0,
            normalize(vViewDirection_TS)
        );
        
        // Light 1 (Fill light)
        totalLighting += calculateLighting(
            normalTS, 
            normalize(vLightDirection1_TS), 
            light_color_1, 
            light_intensity_1,
            normalize(vViewDirection_TS)
        );
        
        // Light 2 (Rim light)
        totalLighting += calculateLighting(
            normalTS, 
            normalize(vLightDirection2_TS), 
            light_color_2, 
            light_intensity_2,
            normalize(vViewDirection_TS)
        );
        
        // Apply specular mask
        totalLighting *= (1.0 + specularMask * 0.5);
        
        // Combine diffuse and lighting
        vec3 finalColor = diffuse * totalLighting;
        
        // Apply player tinting (P1 warm, P2 cool)
        finalColor = mix(finalColor, finalColor * playerTint, 0.1);
        
        // Apply depth-based darkening for sprite layering
        if (spriteDepth > 0.0) {
            float depthFactor = 1.0 - spriteDepth * 0.2;
            finalColor *= depthFactor;
        }
        
        // Fighting game specific effects
        
        // Hit flash effect
        if (hitFlash > 0.0) {
            finalColor = mix(finalColor, hitFlashColor, hitFlash);
        }
        
        // Stun effect (desaturation + blur simulation)
        if (stunEffect > 0.0) {
            float luminance = dot(finalColor, vec3(0.299, 0.587, 0.114));
            finalColor = mix(finalColor, vec3(luminance), stunEffect * 0.7);
            
            // Add slight blue tint for stun
            finalColor += vec3(0.0, 0.1, 0.2) * stunEffect * 0.3;
        }
        
        // Counter hit glow effect
        if (counterHitGlow > 0.0) {
            vec3 glowColor = vec3(1.0, 0.4, 0.4); // Red glow
            finalColor += glowColor * counterHitGlow * 0.5;
        }
        
        // Pixel perfect rendering option
        if (pixelPerfect > 0.0) {
            diffuse = applyPixelPerfectFiltering(diffuse, spriteUV);
            finalColor = mix(finalColor, diffuse * totalLighting, pixelPerfect);
        }
        
        // Apply opacity
        float alpha = baseColor.a * material_opacity;
        
        gl_FragColor = vec4(finalColor, alpha);
    }
  `;
//# sourceMappingURL=SpriteNormalMappingShader.js.map