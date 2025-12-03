import { NextResponse } from "next/server"

export async function GET() {
  const spec = {
    openapi: "3.0.3",
    info: { title: "Resources API", version: "1.0.0", description: "CRUD de recursos (PDF, MP3, YouTube)" },
    paths: {
      "/api/resources": {
        get: {
          summary: "Listar recursos",
          parameters: [
            { name: "page", in: "query", schema: { type: "integer", minimum: 1 }, example: 1 },
            { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100 }, example: 10 },
            { name: "type", in: "query", schema: { type: "string", enum: ["pdf", "mp3", "youtube"] } },
            { name: "q", in: "query", schema: { type: "string" } },
          ],
          responses: { 200: { description: "OK" }, 403: { description: "Sem permissão" } },
        },
        post: {
          summary: "Criar recurso",
          requestBody: {
            content: {
              "multipart/form-data": {
                schema: { type: "object", properties: { file: { type: "string", format: "binary" } } },
              },
              "application/json": {
                schema: { type: "object", properties: { url: { type: "string" } }, required: ["url"] },
                examples: { youtube: { value: { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" } } },
              },
            },
          },
          responses: { 201: { description: "Criado" }, 400: { description: "Dados inválidos" }, 409: { description: "Duplicado" }, 403: { description: "Sem permissão" } },
        },
      },
      "/api/resources/{id}": {
        get: { summary: "Obter recurso", parameters: [{ name: "id", in: "path", required: true }], responses: { 200: { description: "OK" }, 404: { description: "Não encontrado" } } },
        put: {
          summary: "Atualizar recurso",
          parameters: [{ name: "id", in: "path", required: true }],
          requestBody: { content: { "application/json": { schema: { type: "object", properties: { originalName: { type: "string" }, url: { type: "string" } } } } } },
          responses: { 200: { description: "OK" }, 400: { description: "Dados inválidos" }, 403: { description: "Sem permissão" }, 404: { description: "Não encontrado" } },
        },
        delete: { summary: "Excluir recurso", parameters: [{ name: "id", in: "path", required: true }], responses: { 200: { description: "OK" }, 403: { description: "Sem permissão" }, 404: { description: "Não encontrado" } } },
      },
    },
    components: {
      securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
      schemas: {
        Resource: {
          type: "object",
          properties: { id: { type: "string" }, type: { type: "string", enum: ["pdf", "mp3", "youtube"] }, path: { type: "string" }, originalName: { type: "string" }, size: { type: "integer" }, createdAt: { type: "string" }, updatedAt: { type: "string" }, createdById: { type: "string" } },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  }
  return NextResponse.json(spec)
}
