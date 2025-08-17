// Rim Lighting Shader for HD-2D Character Depth
// Provides Octopath Traveler-style rim lighting on 2D sprites

// ========== VERTEX SHADER ==========
attribute vec3 vertex_position;
attribute vec2 vertex_texCoord0;
attribute vec3 vertex_normal;

uniform mat4 matrix_model;
uniform mat4 matrix_view;
uniform mat4 matrix_projection;
uniform mat4 matrix_normal;

// Camera and lighting uniforms
uniform vec3 view_position;
uniform vec3 light_globalAmbient;

// Rim lighting parameters
uniform float rimPower;
uniform float rimIntensity;
uniform vec3 rimColor;

// Output to fragment shader
varying vec2 vUv0;
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec3 vViewDirection;
varying float vRimFactor;

void main(void) {
    // Transform vertex position
    vec4 worldPosition = matrix_model * vec4(vertex_position, 1.0);
    vWorldPosition = worldPosition.xyz;
    
    // Transform normal to world space
    vWorldNormal = normalize((matrix_normal * vec4(vertex_normal, 0.0)).xyz);
    
    // Calculate view direction
    vViewDirection = normalize(view_position - vWorldPosition);
    
    // Calculate rim lighting factor in vertex shader for smooth interpolation
    float rimDot = 1.0 - dot(vViewDirection, vWorldNormal);
    vRimFactor = pow(smoothstep(0.0, 1.0, rimDot), rimPower);
    
    // Pass texture coordinates
    vUv0 = vertex_texCoord0;
    
    // Final vertex position
    gl_Position = matrix_projection * matrix_view * worldPosition;
}

// ========== FRAGMENT SHADER ==========
#ifdef GL_ES
precision highp float;
#endif

// Input from vertex shader
varying vec2 vUv0;
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec3 vViewDirection;
varying float vRimFactor;

// Texture uniforms
uniform sampler2D texture_diffuseMap;
uniform sampler2D texture_normalMap;

// Material properties
uniform vec3 material_diffuse;
uniform vec3 material_emissive;
uniform float material_opacity;

// Lighting uniforms
uniform vec3 light_globalAmbient;
uniform vec3 light_color;
uniform vec3 light_direction;
uniform float light_intensity;

// Rim lighting parameters
uniform float rimPower;
uniform float rimIntensity;
uniform vec3 rimColor;
uniform float rimBlend;

// HD-2D specific parameters
uniform float depthBlur;
uniform float pixelSize;
uniform vec2 screenResolution;

// Fighting game specific
uniform float hitFlash;
uniform vec3 hitFlashColor;
uniform float characterHighlight;

// Utility functions
vec3 getNormalFromMap(vec2 uv, vec3 worldPos, vec3 worldNormal) {
    vec3 tangentNormal = texture2D(texture_normalMap, uv).xyz * 2.0 - 1.0;
    
    vec3 Q1 = dFdx(worldPos);
    vec3 Q2 = dFdy(worldPos);
    vec2 st1 = dFdx(uv);
    vec2 st2 = dFdy(uv);
    
    vec3 N = normalize(worldNormal);
    vec3 T = normalize(Q1 * st2.t - Q2 * st1.t);
    vec3 B = -normalize(cross(N, T));
    mat3 TBN = mat3(T, B, N);
    
    return normalize(TBN * tangentNormal);
}

vec3 pixelateColor(vec3 color, float pixelSize) {
    if (pixelSize <= 0.0) return color;
    
    // Quantize color for pixel art effect
    return floor(color * pixelSize) / pixelSize;
}

void main(void) {
    // Sample base diffuse texture
    vec4 baseColor = texture2D(texture_diffuseMap, vUv0);
    vec3 diffuse = baseColor.rgb * material_diffuse;
    
    // Get normal (use normal map if available)
    vec3 normal = vWorldNormal;
    #ifdef NORMALMAP
        normal = getNormalFromMap(vUv0, vWorldPosition, vWorldNormal);
    #endif
    
    // Calculate basic lighting
    float lightDot = max(dot(normal, -light_direction), 0.0);
    vec3 lightColor = light_color * light_intensity * lightDot;
    
    // Calculate rim lighting
    float rimFactor = vRimFactor;
    
    // Enhanced rim calculation for HD-2D effect
    float fresnel = pow(1.0 - dot(vViewDirection, normal), rimPower);
    fresnel = smoothstep(0.0, 1.0, fresnel);
    
    // Combine rim factors
    rimFactor = max(rimFactor, fresnel) * rimIntensity;
    
    // Apply rim color
    vec3 rimContribution = rimColor * rimFactor;
    
    // Combine lighting
    vec3 ambient = light_globalAmbient * diffuse;
    vec3 finalColor = ambient + diffuse * lightColor + rimContribution;
    
    // Apply emissive
    finalColor += material_emissive;
    
    // Character highlight effect (for special moves, selection, etc.)
    if (characterHighlight > 0.0) {
        vec3 highlightColor = vec3(1.2, 1.1, 1.0);
        finalColor = mix(finalColor, finalColor * highlightColor, characterHighlight);
    }
    
    // Hit flash effect (for impact feedback)
    if (hitFlash > 0.0) {
        finalColor = mix(finalColor, hitFlashColor, hitFlash);
    }
    
    // Depth-based blur simulation (simple desaturation)
    if (depthBlur > 0.0) {
        float luminance = dot(finalColor, vec3(0.299, 0.587, 0.114));
        finalColor = mix(finalColor, vec3(luminance), depthBlur * 0.5);
    }
    
    // Pixel art preservation
    if (pixelSize > 0.0) {
        finalColor = pixelateColor(finalColor, pixelSize);
    }
    
    // Apply opacity with alpha testing for sprite edges
    float alpha = baseColor.a * material_opacity;
    if (alpha < 0.1) discard;
    
    gl_FragColor = vec4(finalColor, alpha);
}