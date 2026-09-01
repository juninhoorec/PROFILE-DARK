import os from 'node:os';
import { HardwareProfile } from '../interfaces';

export interface SystemHardwareInfo {
  osPlatform: string;
  osRelease: string;
  totalRamGb: number;
  freeRamGb: number;
  cpuModel: string;
  cpuCores: number;
  gpuName?: string;
  vramGb?: number;
  hasCuda: boolean;
  hasFfmpeg: boolean;
  hardwareProfile: HardwareProfile;
  recommendedResolution: '480p' | '720p' | '1080p';
  warnings: string[];
}

export class HardwareDetector {
  static detect(): SystemHardwareInfo {
    const totalRamGb = Math.round((os.totalmem() / (1024 * 1024 * 1024)) * 10) / 10;
    const freeRamGb = Math.round((os.freemem() / (1024 * 1024 * 1024)) * 10) / 10;
    const cpus = os.cpus();
    const cpuModel = cpus[0]?.model || 'Unknown CPU';
    const cpuCores = cpus.length;

    // Detect GPU & VRAM if available via env or system defaults
    const gpuName = process.env.LOCAL_GPU_NAME || 'AMD Radeon R9 380 (Legacy)';
    const vramGb = Number(process.env.LOCAL_VRAM_GB) || 2;
    const hasCuda = process.env.CUDA_AVAILABLE === 'true' || false;
    const hasFfmpeg = true;

    // Determine Hardware Profile
    let hardwareProfile: HardwareProfile = 'LOW';
    if (vramGb >= 16 && hasCuda) {
      hardwareProfile = 'HIGH';
    } else if (vramGb >= 8 && hasCuda) {
      hardwareProfile = 'MEDIUM';
    } else if (process.env.USE_REMOTE_GPU === 'true') {
      hardwareProfile = 'REMOTE';
    } else {
      hardwareProfile = 'LOW';
    }

    const warnings: string[] = [];
    if (vramGb < 6) {
      warnings.push(
        `VRAM local (${vramGb} GB) é limitada para modelos pesados (como Wan A14B completo). O PD usará automaticamente modo leve, quantizado ou adaptadores em fila sem travar seu PC.`
      );
    }
    if (!hasCuda) {
      warnings.push(
        'CUDA não detectado. Síntese local operará via CPU otimizada / ComfyUI / FFmpeg.'
      );
    }

    const recommendedResolution: '480p' | '720p' | '1080p' =
      hardwareProfile === 'HIGH' || hardwareProfile === 'REMOTE'
        ? '1080p'
        : hardwareProfile === 'MEDIUM'
        ? '720p'
        : '480p';

    return {
      osPlatform: os.platform(),
      osRelease: os.release(),
      totalRamGb,
      freeRamGb,
      cpuModel,
      cpuCores,
      gpuName,
      vramGb,
      hasCuda,
      hasFfmpeg,
      hardwareProfile,
      recommendedResolution,
      warnings,
    };
  }
}
