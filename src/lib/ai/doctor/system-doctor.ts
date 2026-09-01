import { db } from '../../storage/db';
import { ProviderHealth } from '../../types';

export interface DiagnosticReport {
  overallStatus: 'healthy' | 'warning' | 'critical';
  summary: string;
  providers: ProviderHealth[];
  issuesFound: string[];
  recommendedActions: string[];
  canRunGeneration: boolean;
  canRun3SecondTest: boolean;
}

export class SystemDoctor {
  static diagnose(): DiagnosticReport {
    const providers = db.getProviderHealth();
    const issuesFound: string[] = [];
    const recommendedActions: string[] = [];

    providers.forEach((p) => {
      if (p.status === 'unavailable' || p.status === 'not_configured') {
        issuesFound.push(`Serviço ${p.name} não está operacional (${p.status}).`);
        recommendedActions.push(`Configure a chave de API para o serviço ${p.name} nas Configurações.`);
      } else if (p.status === 'degraded') {
        issuesFound.push(`Serviço ${p.name} aguardando validação: ${p.lastError || 'teste real pendente'}`);
        recommendedActions.push(`Execute o teste real do provider de ${p.name} antes de liberar gerações.`);
      }
    });

    const isVideoOperational = providers.some((p) => (p.service === 'video' || p.service === 'render') && p.status === 'operational');
    const isLlmOperational = providers.some((p) => p.service === 'llm' && p.status === 'operational');

    let overallStatus: DiagnosticReport['overallStatus'] = 'healthy';
    if (issuesFound.length > 2) {
      overallStatus = 'critical';
    } else if (issuesFound.length > 0) {
      overallStatus = 'warning';
    }

    return {
      overallStatus,
      summary:
        overallStatus === 'healthy'
          ? 'Todos os sistemas de Inteligência Artificial, renderização e storage estão operacionais.'
          : `${issuesFound.length} aviso(s) detectado(s) pelo AI System Doctor.`,
      providers,
      issuesFound,
      recommendedActions:
        recommendedActions.length > 0
          ? recommendedActions
          : ['Nenhuma ação corretiva necessária. Todos os pipelines estão saudáveis.'],
      canRunGeneration: isVideoOperational && isLlmOperational,
      canRun3SecondTest: isVideoOperational,
    };
  }
}
