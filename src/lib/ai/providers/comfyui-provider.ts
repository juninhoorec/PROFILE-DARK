import fs from 'node:fs/promises';
import path from 'node:path';
import {
  ComfyUIProvider as IComfyUIProvider,
  ComfyWorkflowParams,
  ComfyWorkflowResult,
  CommercialLicenseInfo,
  HardwareProfile,
  ProviderCapabilities,
} from '../engine/interfaces';

// Security Allowlist for ComfyUI custom nodes
const NODE_ALLOWLIST = new Set([
  'KSampler',
  'KSamplerAdvanced',
  'CheckpointLoaderSimple',
  'CLIPTextEncode',
  'VAEDecode',
  'VAEEncode',
  'EmptyLatentImage',
  'LoadImage',
  'SaveImage',
  'PreviewImage',
  'ImageScale',
  'ImageUpscaleWithModel',
  'UpscaleModelLoader',
  'IPAdapterApply',
  'IPAdapterModelLoader',
  'ApplyInstantID',
  'InstantIDModelLoader',
  'WanVideoSampler',
  'LatentSyncNode',
  'VHS_VideoCombine',
  'VHS_LoadVideo',
  'DualCLIPLoader',
  'FluxGuidance',
  'UNETLoader',
  'ConditioningConcat',
  'ConditioningAverage',
]);

export class ComfyUIProvider implements IComfyUIProvider {
  readonly id = 'comfyui';
  readonly name = 'ComfyUI Workflow Engine';
  readonly serviceType = 'workflow' as const;
  readonly isLocal: boolean;
  readonly recommendedHardware: HardwareProfile = 'LOW';
  readonly minVramGb = 4;

  readonly capabilities: ProviderCapabilities = {
    supportsReferenceImage: true,
    supportsMultipleReferences: true,
    supportsCharacterConsistency: true,
    supportsProductReference: true,
    supportsAudioConditioning: true,
    supportsLipSync: true,
    supportsInpainting: true,
    supportsControlNet: true,
  };

  readonly license: CommercialLicenseInfo = {
    licenseName: 'GPL-3.0',
    isCommercialAllowed: true,
    attributionRequired: false,
    licenseUrl: 'https://github.com/comfyanonymous/ComfyUI/blob/master/LICENSE',
  };

  private baseUrl: string;

  constructor(baseUrl = process.env.COMFYUI_URL || 'http://127.0.0.1:8188') {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.isLocal = this.baseUrl.includes('127.0.0.1') || this.baseUrl.includes('localhost');
  }

  async isConfigured(): Promise<boolean> {
    return Boolean(this.baseUrl);
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/system_stats`, {
        signal: AbortSignal.timeout(3000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  estimateCost(): { credits: number; usdEstimate: number } {
    return { credits: 0, usdEstimate: 0 };
  }

  async getWorkflowTemplate(workflowPath: string): Promise<Record<string, any>> {
    const fullPath = path.isAbsolute(workflowPath)
      ? workflowPath
      : path.join(process.cwd(), 'workflows', workflowPath);

    const raw = await fs.readFile(fullPath, 'utf8');
    return JSON.parse(raw);
  }

  private validateWorkflowNodes(workflow: Record<string, any>) {
    const unknownNodes: string[] = [];
    for (const [nodeId, node] of Object.entries(workflow)) {
      const classType = (node as any)?.class_type;
      if (classType && !NODE_ALLOWLIST.has(classType)) {
        unknownNodes.push(`${nodeId}:${classType}`);
      }
    }
    if (unknownNodes.length > 0 && process.env.STRICT_COMFY_SECURITY === 'true') {
      throw new Error(`Nós não permitidos detectados no workflow do ComfyUI: ${unknownNodes.join(', ')}`);
    }
  }

  async submitWorkflow(params: ComfyWorkflowParams): Promise<ComfyWorkflowResult> {
    const startTime = Date.now();
    const available = await this.isAvailable();
    if (!available) {
      throw new Error(`ComfyUI não está acessível em ${this.baseUrl}. Inicie o servidor ComfyUI.`);
    }

    let workflow = await this.getWorkflowTemplate(params.workflowName);
    this.validateWorkflowNodes(workflow);

    for (const [key, value] of Object.entries(params.inputs)) {
      const [nodeId, field] = key.split('.');
      if (nodeId && field && workflow[nodeId]?.inputs) {
        workflow[nodeId].inputs[field] = value;
      }
    }

    const clientId = `pd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const promptRes = await fetch(`${this.baseUrl}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: workflow, client_id: clientId }),
    });

    if (!promptRes.ok) {
      const errorText = await promptRes.text();
      throw new Error(`Falha ao submeter workflow ao ComfyUI (${promptRes.status}): ${errorText}`);
    }

    const promptData = await promptRes.json();
    const promptId = promptData.prompt_id;
    if (!promptId) {
      throw new Error('ComfyUI não retornou um prompt_id válido.');
    }

    const timeoutMs = params.timeoutMs || 180_000;
    const history = await this.pollHistory(promptId, timeoutMs);

    const outputs = history?.outputs || {};
    const mediaUrls: string[] = [];

    for (const nodeOutput of Object.values(outputs) as any[]) {
      if (nodeOutput.images) {
        for (const img of nodeOutput.images) {
          mediaUrls.push(`${this.baseUrl}/view?filename=${encodeURIComponent(img.filename)}&subfolder=${encodeURIComponent(img.subfolder || '')}&type=${encodeURIComponent(img.type || 'output')}`);
        }
      }
      if (nodeOutput.gifs || nodeOutput.videos) {
        const vids = nodeOutput.gifs || nodeOutput.videos;
        for (const vid of vids) {
          mediaUrls.push(`${this.baseUrl}/view?filename=${encodeURIComponent(vid.filename)}&subfolder=${encodeURIComponent(vid.subfolder || '')}&type=${encodeURIComponent(vid.type || 'output')}`);
        }
      }
    }

    return {
      promptId,
      outputs,
      mediaUrls,
      executionTimeMs: Date.now() - startTime,
      nodeHistory: history,
    };
  }

  private async pollHistory(promptId: string, timeoutMs: number): Promise<any> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      await new Promise((r) => setTimeout(r, 1500));
      const res = await fetch(`${this.baseUrl}/history/${promptId}`);
      if (res.ok) {
        const historyData = await res.json();
        if (historyData[promptId]) {
          return historyData[promptId];
        }
      }
    }
    throw new Error(`ComfyUI workflow timed out after ${Math.round(timeoutMs / 1000)}s`);
  }

  async getQueue(): Promise<{ pending: number; running: number }> {
    try {
      const res = await fetch(`${this.baseUrl}/queue`);
      if (!res.ok) return { pending: 0, running: 0 };
      const data = await res.json();
      return {
        running: data.queue_running?.length || 0,
        pending: data.queue_pending?.length || 0,
      };
    } catch {
      return { pending: 0, running: 0 };
    }
  }

  async getHistory(promptId: string): Promise<any> {
    const res = await fetch(`${this.baseUrl}/history/${promptId}`);
    if (!res.ok) return undefined;
    const data = await res.json();
    return data[promptId];
  }

  async cancelJob(promptId: string): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/interrupt`, { method: 'POST' });
      return res.ok;
    } catch {
      return false;
    }
  }
}

export const comfyUIProvider = new ComfyUIProvider();
