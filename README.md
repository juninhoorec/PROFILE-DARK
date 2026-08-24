# PROFILE DARK — AI Content & Sales Engine

> Plataforma SaaS profissional para criação de personagens virtuais ultra-realistas com Character Lock, associação rigorosa de produtos com Product Lock, geração de vídeos orientada a funil comercial, validação visual multimodal por IA e renderização baseada em cenas.

---

## 💎 Visão Geral da Arquitetura

O **PROFILE DARK** transforma profiles, produtos, links e instruções em vídeos comerciais de alta conversão:

```text
PROFILE + CONTEÚDO + PRODUTO + INSTRUÇÃO + OBJETIVO COMERCIAL
                     ↓
              AI CONTEXT ENGINE
                     ↓
            AI CREATIVE DIRECTOR
                     ↓
          PLANO CRIATIVO & ROTEIRO
                     ↓
           ⚡ TESTE DE 3 SEGUNDOS
                     ↓
           AI QUALITY INSPECTOR
                     ↓
          RENDER CENTER POR CENAS
                     ↓
          DOWNLOAD (.ZIP) / PUBLICAÇÃO
                     ↓
          ANALYTICS & LEARNING LOOP
```

---

## 🚀 Instalação e Execução

### 1. Clonar e Instalar Dependências
```bash
npm install
```

### 2. Configurar Variáveis de Ambiente
Copie o arquivo `.env.example` para `.env`:
```bash
cp .env.example .env
```

### 3. Rodar em Modo de Desenvolvimento
```bash
npm run dev
```
Acesse `http://localhost:3000` no seu navegador.

---

## 🧪 Testes e Validações

O projeto inclui scripts dedicados para validação completa:

```bash
# Executa TypeCheck estrito
npm run typecheck

# Executa Linter
npm run lint

# Executa Smoke Test completo do ecossistema
npm run test:smoke

# Executa Teste dos Providers de IA
npm run test:providers

# Executa o Teste de Vídeo de 3 Segundos
npm run test:video

# Executa a suíte de testes consolidada
npm run test

# Compilação de produção
npm run build
```

---

## ⚡ O Teste de 3 Segundos (Smoke Test)

Antes de qualquer renderização longa e cara, o Profile Dark permite a execução de um teste controlado de aproximadamente **3 segundos**. 

O teste valida:
- Identidade e traços do personagem (Character Lock);
- Fidelidade do produto e marca (Product Lock);
- Iluminação e física de materiais;
- Movimento e sincronismo labial;
- Storage e integridade do player de vídeo.

---

## 🛡️ Smart Provider Router & Fallback

O sistema suporta múltiplos adapters:
- **LLM / Texto:** Google Gemini 1.5 Pro, OpenAI GPT-4o, Anthropic Claude 3.5 Sonnet, Groq.
- **Imagem:** FLUX 1.1 Pro Ultra, Fal.ai, Replicate, Stability.
- **Vídeo:** Runway Gen-3 Alpha, Luma Dream Machine, Kling.
- **Voz / TTS:** ElevenLabs Multilingual v2, OpenAI TTS.
- **Storage:** Local persistente, Supabase Storage, AWS S3 / Cloudflare R2.

---

## 📂 Estrutura do Projeto

```
src/
├── app/                  # Next.js App Router (Páginas e APIs)
├── components/           # Componentes modulares
│   ├── layout/          # Sidebar, Header, QuickWorkflowSteps
│   ├── dashboard/       # 6 Cards mestres do Dashboard e Widgets
│   └── modals/          # CreateProfile, NewGeneration, Video3sTest, etc.
├── lib/                  # Núcleo da aplicação
│   ├── ai/              # AI Orchestrator, Prompt Enhancer, Creative Director, Doctor
│   ├── storage/         # Persistência de banco e assets
│   ├── types.ts         # Tipagens TypeScript completas
│   └── constants.ts     # Dados mestres e seed de demonstração
scripts/                 # Scripts CLI de testes e validação
```

---

## 🔒 Segurança e Privacidade

- Conexões sociais utilizam exclusivamente **OAuth 2.0 e APIs oficiais** (Meta Graph API, TikTok API, YouTube Data API).
- Nenhuma senha ou credencial sensível de redes sociais é solicitada ou armazenada.
- Chaves de API de terceiros são tratadas exclusivamente no backend.
