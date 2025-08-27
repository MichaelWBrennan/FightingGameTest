/**
 * Depth-Based Post-Processing Shader for HD-2D Effects
 * Implements depth-of-field, volumetric fog, and atmospheric effects
 * Converted from GLSL to TypeScript
 */
export class DepthPostProcessShader {
    static createMaterial(device) {
        const material = new device.StandardMaterial();
        material.chunks.VS_TRANSFORM = this.vertexShader;
        material.chunks.PS_OUTPUT = this.fragmentShader;
        return material;
    }
    static setUniforms(material, params) {
        material.setParameter('uScreenSize', params.screenSize);
        material.setParameter('uInvScreenSize', [1.0 / params.screenSize[0], 1.0 / params.screenSize[1]]);
        material.setParameter('uNearClip', params.nearClip);
        material.setParameter('uFarClip', params.farClip);
        material.setParameter('uFocusDistance', params.focusDistance);
        material.setParameter('uFocusRange', params.focusRange);
        material.setParameter('uBokehRadius', params.bokehRadius);
        material.setParameter('uBokehIntensity', params.bokehIntensity);
        material.setParameter('uFogColor', params.fogColor);
        material.setParameter('uFogDensity', params.fogDensity);
        material.setParameter('uFogStart', params.fogStart);
        material.setParameter('uFogEnd', params.fogEnd);
        material.setParameter('uAtmosphericPerspective', params.atmosphericPerspective);
        material.setParameter('uAtmosphereColor', params.atmosphereColor);
        material.setParameter('uHeatHaze', params.heatHaze);
        material.setParameter('uColorSeparation', params.colorSeparation);
        material.setParameter('uScreenShake', params.screenShake);
        material.setParameter('uScreenShakeOffset', params.screenShakeOffset);
        material.setParameter('uTimeScale', params.timeScale);
        material.setParameter('uTime', params.time);
    }
}
DepthPostProcessShader.vertexShader = `
    // ========== VERTEX SHADER ==========
    attribute vec3 vertex_position;
    attribute vec2 vertex_texCoord0;

    uniform mat4 matrix_model;
    uniform mat4 matrix_view;
    uniform mat4 matrix_projection;

    varying vec2 vUv0;

    void main(void) {
        vUv0 = vertex_texCoord0;
        gl_Position = matrix_projection * matrix_view * matrix_model * vec4(vertex_position, 1.0);
    }
  `;
DepthPostProcessShader.fragmentShader = `
    // ========== FRAGMENT SHADER ==========
    #ifdef GL_ES
    precision highp float;
    #endif

    varying vec2 vUv0;

    // Input textures
    uniform sampler2D texture_colorBuffer;
    uniform sampler2D texture_depthBuffer;

    // Screen resolution
    uniform vec2 uScreenSize;
    uniform vec2 uInvScreenSize;

    // Camera parameters
    uniform float uNearClip;
    uniform float uFarClip;
    uniform vec3 uCameraPosition;
    uniform mat4 uViewMatrix;
    uniform mat4 uProjectionMatrix;

    // Depth-of-field parameters
    uniform float uFocusDistance;
    uniform float uFocusRange;
    uniform float uBokehRadius;
    uniform float uBokehIntensity;
    uniform int uDofSamples;

    // Volumetric fog parameters
    uniform vec3 uFogColor;
    uniform float uFogDensity;
    uniform float uFogStart;
    uniform float uFogEnd;
    uniform vec3 uLightPosition;
    uniform vec3 uLightColor;
    uniform float uLightScattering;

    // HD-2D atmospheric effects
    uniform float uAtmosphericPerspective;
    uniform vec3 uAtmosphereColor;
    uniform float uHeatHaze;
    uniform float uColorSeparation;

    // Fighting game specific
    uniform float uScreenShake;
    uniform vec2 uScreenShakeOffset;
    uniform float uTimeScale;
    uniform float uTime;

    // Utility functions
    float linearizeDepth(float depth) {
        float z = depth * 2.0 - 1.0; // Convert from [0,1] to [-1,1]
        return (2.0 * uNearClip * uFarClip) / (uFarClip + uNearClip - z * (uFarClip - uNearClip));
    }

    float getDepth(vec2 uv) {
        return linearizeDepth(texture2D(texture_depthBuffer, uv).r);
    }

    vec3 getWorldPositionFromDepth(vec2 uv, float depth) {
        vec4 clipSpacePosition = vec4(uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
        vec4 viewSpacePosition = inverse(uProjectionMatrix) * clipSpacePosition;
        viewSpacePosition /= viewSpacePosition.w;
        vec4 worldSpacePosition = inverse(uViewMatrix) * viewSpacePosition;
        return worldSpacePosition.xyz;
    }

    // Gaussian blur for depth-of-field
    vec3 gaussianBlur(sampler2D tex, vec2 uv, vec2 direction, float radius, int samples) {
        vec3 color = vec3(0.0);
        float totalWeight = 0.0;
        
        float step = radius / float(samples);
        
        for (int i = -samples; i <= samples; i++) {
            vec2 offset = direction * step * float(i);
            vec2 sampleUV = uv + offset * uInvScreenSize;
            
            // Check bounds
            if (sampleUV.x >= 0.0 && sampleUV.x <= 1.0 && sampleUV.y >= 0.0 && sampleUV.y <= 1.0) {
                float weight = exp(-0.5 * pow(float(i) / float(samples), 2.0));
                color += texture2D(tex, sampleUV).rgb * weight;
                totalWeight += weight;
            }
        }
        
        return color / totalWeight;
    }

    // Bokeh blur for depth-of-field
    vec3 bokehBlur(sampler2D tex, vec2 uv, float radius) {
        vec3 color = vec3(0.0);
        float totalWeight = 0.0;
        
        // Hexagonal bokeh pattern
        const int samples = 19;
        const vec2 offsets[19] = vec2[](
            vec2(0.0, 0.0),
            vec2(0.0, 1.0), vec2(0.866, 0.5), vec2(0.866, -0.5), 
            vec2(0.0, -1.0), vec2(-0.866, -0.5), vec2(-0.866, 0.5),
            vec2(0.0, 2.0), vec2(1.732, 1.0), vec2(1.732, -1.0),
            vec2(0.0, -2.0), vec2(-1.732, -1.0), vec2(-1.732, 1.0),
            vec2(1.5, 0.866), vec2(1.5, -0.866), vec2(-1.5, -0.866), vec2(-1.5, 0.866),
            vec2(0.866, 1.5), vec2(-0.866, 1.5)
        );
        
        for (int i = 0; i < samples; i++) {
            vec2 offset = offsets[i] * radius * uInvScreenSize;
            vec2 sampleUV = uv + offset;
            
            if (sampleUV.x >= 0.0 && sampleUV.x <= 1.0 && sampleUV.y >= 0.0 && sampleUV.y <= 1.0) {
                float weight = 1.0;
                if (i > 0) weight = 0.7; // Reduce weight for outer samples
                
                color += texture2D(tex, sampleUV).rgb * weight;
                totalWeight += weight;
            }
        }
        
        return color / totalWeight;
    }

    // Calculate depth-of-field blur amount
    float calculateDofBlur(float depth) {
        float distance = abs(depth - uFocusDistance);
        float blur = smoothstep(0.0, uFocusRange, distance);
        return blur * uBokehRadius;
    }

    // Volumetric fog calculation
    vec3 calculateVolumetricFog(vec2 uv, float depth, vec3 worldPos) {
        // Calculate fog factor based on distance
        float fogFactor = smoothstep(uFogStart, uFogEnd, depth);
        fogFactor *= uFogDensity;
        
        // Calculate light scattering
        vec3 lightDir = normalize(uLightPosition - worldPos);
        vec3 viewDir = normalize(uCameraPosition - worldPos);
        float scattering = pow(max(dot(lightDir, viewDir), 0.0), 8.0);
        
        // Combine fog color with light scattering
        vec3 fogColorWithLight = mix(uFogColor, uLightColor, scattering * uLightScattering);
        
        return fogColorWithLight * fogFactor;
    }

    // Atmospheric perspective
    vec3 applyAtmosphericPerspective(vec3 color, float depth) {
        float atmosphereFactor = smoothstep(10.0, 50.0, depth) * uAtmosphericPerspective;
        return mix(color, uAtmosphereColor, atmosphereFactor);
    }

    // Heat haze effect
    vec2 applyHeatHaze(vec2 uv, float time) {
        if (uHeatHaze <= 0.0) return uv;
        
        float wave1 = sin(uv.y * 30.0 + time * 5.0) * 0.003;
        float wave2 = sin(uv.y * 45.0 + time * 3.0) * 0.002;
        
        return uv + vec2(wave1 + wave2, 0.0) * uHeatHaze;
    }

    // Chromatic aberration for impact effects
    vec3 applyChromaticAberration(sampler2D tex, vec2 uv, float amount) {
        if (amount <= 0.0) return texture2D(tex, uv).rgb;
        
        vec2 offset = (uv - 0.5) * amount * 0.01;
        
        float r = texture2D(tex, uv + offset).r;
        float g = texture2D(tex, uv).g;
        float b = texture2D(tex, uv - offset).b;
        
        return vec3(r, g, b);
    }

    // Screen shake effect
    vec2 applyScreenShake(vec2 uv) {
        if (uScreenShake <= 0.0) return uv;
        
        vec2 shake = uScreenShakeOffset * uScreenShake * 0.01;
        return uv + shake;
    }

    void main(void) {
        // Apply screen shake
        vec2 finalUV = applyScreenShake(vUv0);
        
        // Apply heat haze
        finalUV = applyHeatHaze(finalUV, uTime);
        
        // Get depth at current pixel
        float depth = getDepth(finalUV);
        vec3 worldPos = getWorldPositionFromDepth(finalUV, depth);
        
        // Sample base color
        vec3 color = texture2D(texture_colorBuffer, finalUV).rgb;
        
        // Apply chromatic aberration for impact effects
        if (uColorSeparation > 0.0) {
            color = applyChromaticAberration(texture_colorBuffer, finalUV, uColorSeparation);
        }
        
        // Calculate depth-of-field
        float dofBlur = calculateDofBlur(depth);
        
        if (dofBlur > 0.1) {
            // Apply bokeh blur for out-of-focus areas
            vec3 blurredColor = bokehBlur(texture_colorBuffer, finalUV, dofBlur);
            color = mix(color, blurredColor, min(dofBlur * uBokehIntensity, 1.0));
        }
        
        // Apply volumetric fog
        if (uFogDensity > 0.0) {
            vec3 fogColor = calculateVolumetricFog(finalUV, depth, worldPos);
            color = mix(color, fogColor, min(uFogDensity, 0.9));
        }
        
        // Apply atmospheric perspective
        if (uAtmosphericPerspective > 0.0) {
            color = applyAtmosphericPerspective(color, depth);
        }
        
        // Time-based effects for fighting games
        if (uTimeScale != 1.0) {
            // Slow motion effect - enhance clarity
            color = mix(color, color * 1.1, (1.0 - uTimeScale) * 0.3);
        }
        
        gl_FragColor = vec4(color, 1.0);
    }
  `;
//# sourceMappingURL=DepthPostProcessShader.js.map