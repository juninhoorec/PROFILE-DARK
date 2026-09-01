import { NextResponse } from 'next/server';
import { AgentEditPlanner } from '@/lib/ai/editor/agent-edit-planner';
import { EditorAgent } from '@/lib/ai/editor/editor-agent';
import { FinalQAAgent } from '@/lib/ai/editor/final-qa-agent';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { instruction, totalScenes = 5, currentVersion = 1, sceneVideoPaths = [], action = 'plan' } = body;

    if (!instruction) {
      return NextResponse.json({ error: 'Instrução de edição é obrigatória.' }, { status: 400 });
    }

    const plan = AgentEditPlanner.parseUserInstruction(instruction, totalScenes, currentVersion);

    if (action === 'plan') {
      return NextResponse.json({
        success: true,
        plan,
      });
    }

    // Action === 'execute'
    if (sceneVideoPaths.length > 0) {
      const cuts = sceneVideoPaths.map((p: string, idx: number) => ({
        sceneNumber: idx + 1,
        inputVideoPath: p,
      }));

      const assembly = await EditorAgent.assembleProject({
        projectTitle: `Edit Version ${plan.version}`,
        cuts,
        targetResolution: '1080p',
      });

      const qa = await FinalQAAgent.inspectFinalVideo(assembly.finalVideoPath);

      return NextResponse.json({
        success: true,
        plan,
        assembly,
        qa,
      });
    }

    return NextResponse.json({
      success: true,
      plan,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
