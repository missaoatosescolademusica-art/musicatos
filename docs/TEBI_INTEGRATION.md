# Integração Tebi.io (S3 Compatible)

Este documento descreve a integração com o serviço de armazenamento Tebi.io (compatível com S3) para upload de recursos.

## Visão Geral

A integração utiliza armazenamento em nuvem para garantir persistência e escalabilidade, substituindo o armazenamento local efêmero (especialmente crítico em deploys Vercel).

1.  **Nuvem (Tebi)**: Bucket S3 principal.
2.  **Local**: Removido (apenas suporte legado para deleção).

## Requisitos

-   Node.js 18+
-   Conta Tebi.io
-   Variáveis de Ambiente configuradas

## Configuração (.env)

```env
TEBI_BUCKET_NAME="seu-bucket"
TEBI_API_KEY="sua-chave-publica"
TEBI_SECRET_KEY="sua-chave-secreta"
# Alternativamente, TEBI_API_SECRET também é aceito
TEBI_API_SECRET="sua-chave-secreta"
```

## Fluxo de Upload

1.  **Frontend**:
    -   Arquivo selecionado pelo usuário.
    -   Envio via `fetch` (Multipart).
    -   Validações de extensão no `input`.

2.  **Backend (`app/api/resources`)**:
    -   Recebe `FormData`.
    -   Valida MIME types (PDF, MP3, Imagens, DOCX, XLSX).
    -   Valida tamanho (Max 100MB).
    -   Verifica duplicidade (Nome + Tamanho).
    -   **Envia para Tebi** (S3 `PutObject`).
    -   **Erro 502** se falhar o upload na nuvem (garante consistência).
    -   Registra no Banco de Dados (`tebiId`, `tebiUrl`, `path` aponta para URL S3).
    -   Gera Log de Auditoria.

## Estrutura do Código

-   `lib/tebi.ts`: Funções utilitárias S3 (`uploadToTebi`, `deleteFromTebi`).
-   `app/api/resources/route.ts`: Endpoint de criação (POST).
-   `app/api/resources/[id]/route.ts`: Endpoint de deleção (DELETE) e atualização.
-   `app/resources/page.tsx`: Interface de gerenciamento.

## Testes

Os testes de integração estão em `tests/api/resources/tebi.test.ts`.
Para rodar: `npx vitest run tests/api/resources/tebi.test.ts`

## Solução de Problemas

-   **Erro 403 (Forbidden)**: Verifique as chaves de API e se o bucket existe.
-   **Erro de Conexão**: Verifique se o endpoint `s3.tebi.io` está acessível.
-   **Erro 502 (Bad Gateway)**: Falha no upload para o Tebi. O registro não é criado no banco.
