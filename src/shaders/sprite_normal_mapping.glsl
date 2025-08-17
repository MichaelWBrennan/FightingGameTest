// Sprite Normal Mapping Shader for HD-2D Depth Effects
// Creates depth illusion from 2D sprites using generated or provided normal maps

// Vertex Shader
#ifdef VERTEX_SHADER

attribute vec3 vertex_position;
attribute vec2 vertex_texCoord0;
attribute vec3 vertex_normal;
attribute vec4 vertex_tangent;

uniform mat4 matrix_model;
uniform mat4 matrix_view;
uniform mat4 matrix_viewProjection;
uniform mat3 matrix_normal;

uniform vec3 uCameraPosition;
uniform vec3 uLightPosition;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vTangent;
varying vec3 vBinormal;
varying vec3 vWorldPos;
varying vec3 vLightDir;
varying vec3 vViewDir;

void main() {
    vec4 worldPos = matrix_model * vec4(vertex_position, 1.0);
    vWorldPos = worldPos.xyz;
    vUv = vertex_texCoord0;
    
    // Transform normal, tangent, binormal to world space
    vNormal = normalize(matrix_normal * vertex_normal);
    vTangent = normalize(matrix_normal * vertex_tangent.xyz);
    vBinormal = cross(vNormal, vTangent) * vertex_tangent.w;
    
    // Calculate light and view directions
    vLightDir = normalize(uLightPosition - worldPos.xyz);
    vViewDir = normalize(uCameraPosition - worldPos.xyz);
    
    gl_Position = matrix_viewProjection * worldPos;
}

#endif

// Fragment Shader
#ifdef FRAGMENT_SHADER

precision mediump float;

uniform sampler2D uTexture;
uniform sampler2D uNormalMap;
uniform bool uUseNormalMap;
uniform float uNormalStrength;
uniform float uHeightScale;

// Lighting parameters
uniform vec3 uLightColor;
uniform float uLightIntensity;
uniform vec3 uAmbientColor;
uniform float uAmbientIntensity;

// Material parameters
uniform float uRoughness;
uniform float uMetallic;
uniform float uSpecularIntensity;

// HD-2D specific parameters
uniform float uDepthMultiplier;
uniform bool uGenerateNormalsFromHeight;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vTangent;
varying vec3 vBinormal;
varying vec3 vWorldPos;
varying vec3 vLightDir;
varying vec3 vViewDir;

// Generate normal map from sprite alpha channel (height)
vec3 generateNormalFromHeight(sampler2D tex, vec2 uv, float strength) {
    vec2 texelSize = vec2(1.0) / vec2(textureSize(tex, 0));
    
    // Sample height values from alpha channel
    float heightL = texture2D(tex, uv - vec2(texelSize.x, 0.0)).a;
    float heightR = texture2D(tex, uv + vec2(texelSize.x, 0.0)).a;
    float heightD = texture2D(tex, uv - vec2(0.0, texelSize.y)).a;
    float heightU = texture2D(tex, uv + vec2(0.0, texelSize.y)).a;
    
    // Calculate gradients
    vec3 normal;
    normal.x = (heightL - heightR) * strength;
    normal.y = (heightD - heightU) * strength;
    normal.z = 1.0;
    
    return normalize(normal);
}

// Enhanced normal mapping for sprites
vec3 calculateSpriteNormal(vec2 uv) {
    vec3 tangentNormal;
    
    if (uUseNormalMap) {
        // Use provided normal map
        tangentNormal = texture2D(uNormalMap, uv).rgb * 2.0 - 1.0;
        tangentNormal.xy *= uNormalStrength;
        tangentNormal = normalize(tangentNormal);
    } else if (uGenerateNormalsFromHeight) {
        // Generate from sprite alpha/height
        tangentNormal = generateNormalFromHeight(uTexture, uv, uNormalStrength);
    } else {
        // Default flat normal
        tangentNormal = vec3(0.0, 0.0, 1.0);
    }
    
    // Transform to world space using TBN matrix
    mat3 TBN = mat3(normalize(vTangent), normalize(vBinormal), normalize(vNormal));
    return normalize(TBN * tangentNormal);
}

// PBR-style lighting calculation adapted for sprites
vec3 calculatePBRLighting(vec3 albedo, vec3 normal, vec3 lightDir, vec3 viewDir, 
                         vec3 lightColor, float lightIntensity, float roughness, float metallic) {
    
    float NdotL = max(0.0, dot(normal, lightDir));
    float NdotV = max(0.0, dot(normal, viewDir));
    
    // Simplified Fresnel for sprites
    vec3 F0 = mix(vec3(0.04), albedo, metallic);
    vec3 F = F0 + (1.0 - F0) * pow(1.0 - NdotV, 5.0);
    
    // Simplified BRDF for performance
    float alpha = roughness * roughness;
    float alpha2 = alpha * alpha;
    
    // Diffuse component
    vec3 diffuse = albedo * (1.0 - F) * (1.0 - metallic) / 3.14159;
    
    // Specular component (simplified)
    float denom = NdotL * NdotV;
    vec3 specular = vec3(0.0);
    if (denom > 0.0) {
        vec3 H = normalize(lightDir + viewDir);
        float NdotH = max(0.0, dot(normal, H));
        float D = alpha2 / (3.14159 * pow(NdotH * NdotH * (alpha2 - 1.0) + 1.0, 2.0));
        specular = F * D / max(4.0 * denom, 0.001);
    }
    
    return (diffuse + specular) * lightColor * lightIntensity * NdotL;
}

// HD-2D depth enhancement
float calculateDepthEffect(vec2 uv, vec3 normal) {
    // Create depth-based shading variation
    float depth = dot(normal, vec3(0.0, 0.0, 1.0));
    depth = (depth + 1.0) * 0.5; // Normalize to 0-1
    
    // Add subtle depth-based color variation
    return 1.0 + (depth - 0.5) * uDepthMultiplier;
}

// Soft ambient occlusion approximation for sprites
float calculateSpriteAO(vec2 uv, sampler2D tex) {
    vec2 texelSize = vec2(1.0) / vec2(textureSize(tex, 0));
    float ao = 0.0;
    int samples = 8;
    
    // Sample surrounding pixels
    for (int i = 0; i < samples; i++) {
        float angle = float(i) * 6.28318 / float(samples);
        vec2 offset = vec2(cos(angle), sin(angle)) * texelSize * 2.0;
        float sample = texture2D(tex, uv + offset).a;
        ao += sample;
    }
    
    ao /= float(samples);
    return mix(0.7, 1.0, ao); // Darken areas with less surrounding content
}

void main() {
    vec4 texColor = texture2D(uTexture, vUv);
    
    if (texColor.a < 0.1) discard;
    
    // Calculate enhanced normal for the sprite
    vec3 normal = calculateSpriteNormal(vUv);
    
    // Normalize directions
    vec3 lightDir = normalize(vLightDir);
    vec3 viewDir = normalize(vViewDir);
    
    // Base albedo color
    vec3 albedo = texColor.rgb;
    
    // Calculate ambient lighting
    vec3 ambient = uAmbientColor * uAmbientIntensity * albedo;
    
    // Calculate main PBR lighting
    vec3 lighting = calculatePBRLighting(albedo, normal, lightDir, viewDir, 
                                        uLightColor, uLightIntensity, 
                                        uRoughness, uMetallic);
    
    // Add depth enhancement for HD-2D effect
    float depthEffect = calculateDepthEffect(vUv, normal);
    lighting *= depthEffect;
    
    // Add ambient occlusion
    float ao = calculateSpriteAO(vUv, uTexture);
    lighting *= ao;
    
    // Combine ambient and direct lighting
    vec3 finalColor = ambient + lighting;
    
    // Add specular highlights for HD-2D pop
    vec3 H = normalize(lightDir + viewDir);
    float NdotH = max(0.0, dot(normal, H));
    float specular = pow(NdotH, 32.0) * uSpecularIntensity;
    finalColor += vec3(specular);
    
    // Tone mapping for HDR-like effect
    finalColor = finalColor / (finalColor + vec3(1.0));
    finalColor = pow(finalColor, vec3(1.0/2.2)); // Gamma correction
    
    gl_FragColor = vec4(finalColor, texColor.a);
}

#endif