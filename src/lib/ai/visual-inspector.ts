import { GenerationJob, QualityCheck } from '../types';

export class VisualInspector {
  static inspect(_job:GenerationJob):QualityCheck {
    throw new Error('O inspetor multimodal real ainda não está configurado; nenhuma nota automática será fabricada.');
  }
}
