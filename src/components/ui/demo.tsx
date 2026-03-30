'use client';

import { Sparkles, Zap } from 'lucide-react';

import { SplineScene } from '@/components/ui/splite';
import { Card } from '@/components/ui/card';
import { Spotlight } from '@/components/ui/spotlight';

export function SplineSceneBasic() {
  return (
    <Card className="relative w-full overflow-hidden border-white/10 bg-black/[0.96] shadow-[0_25px_100px_rgba(0,0,0,0.45)]">
      <Spotlight
        className="-top-40 left-0 md:left-60 md:-top-20"
        fill="white"
      />

      <div className="flex min-h-[500px] flex-col lg:flex-row">
        <div className="relative z-10 flex flex-1 flex-col justify-center p-8 lg:p-10">
          <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs uppercase tracking-[0.28em] text-emerald-100">
            <Sparkles className="h-3.5 w-3.5" />
            Interactive 3D layer
          </div>
          <h2 className="bg-gradient-to-b from-neutral-50 to-neutral-400 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
            Pocket Manager,
            <br />
            but with presence.
          </h2>
          <p className="mt-4 max-w-lg text-neutral-300">
            Bring the dashboard to life with a premium motion layer — useful for hero sections,
            feature reveals, and launch moments that feel bigger than plain UI.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm text-white/80">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2">
              <Zap className="h-4 w-4 text-emerald-300" />
              React + Tailwind + TypeScript
            </div>
            <div className="rounded-full border border-white/10 px-3 py-2">
              Spline-ready scene block
            </div>
          </div>
        </div>

        <div className="relative min-h-[320px] flex-1 lg:min-h-[500px]">
          <SplineScene
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="h-full w-full"
          />
        </div>
      </div>
    </Card>
  );
}
