
/**
 * Docker Configuration
 * Converted from Dockerfile to TypeScript config
 */

export const dockerConfig = {
  baseImage: 'node:18-alpine',
  
  workdir: '/app',
  
  buildSteps: [
    'COPY package*.json ./',
    'RUN npm ci --only=production',
    'COPY dist/ ./dist/',
    'COPY index.html ./',
    'COPY src/shaders/ ./src/shaders/'
  ],
  
  runtime: {
    port: 5000,
    command: 'npm start',
    healthcheck: 'curl -f http://localhost:5000 || exit 1'
  },
  
  environment: {
    NODE_ENV: 'production',
    PORT: '5000'
  }
} as const;

export function generateDockerfile(): string {
  return `
FROM ${dockerConfig.baseImage}

WORKDIR ${dockerConfig.workdir}

${dockerConfig.buildSteps.join('\n')}

EXPOSE ${dockerConfig.runtime.port}

ENV NODE_ENV=${dockerConfig.environment.NODE_ENV}
ENV PORT=${dockerConfig.environment.PORT}

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD ${dockerConfig.runtime.healthcheck}

CMD ["${dockerConfig.runtime.command}"]
`.trim();
}

if (require.main === module) {
  console.log(generateDockerfile());
}
